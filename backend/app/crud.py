from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from . import models, schemas
from decimal import Decimal

# ==========================================
# PRODUCT CRUD
# ==========================================
def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session):
    return db.query(models.Product).order_by(models.Product.id.desc()).all()

def create_product(db: Session, product: schemas.ProductCreate):
    # Check SKU uniqueness
    db_product = get_product_by_sku(db, product.sku)
    if db_product:
        raise ValueError(f"Product with SKU '{product.sku}' already exists.")
        
    db_obj = models.Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        quantity_in_stock=product.quantity_in_stock
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_product(db: Session, db_product: models.Product, product: schemas.ProductUpdate):
    # If SKU is updated, check uniqueness
    if product.sku and product.sku != db_product.sku:
        exists = get_product_by_sku(db, product.sku)
        if exists:
            raise ValueError(f"Product with SKU '{product.sku}' already exists.")
            
    # Update fields
    update_data = product.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
        
    # Check if product is referenced in any order items
    has_orders = db.query(models.OrderItem).filter(models.OrderItem.product_id == product_id).first()
    if has_orders:
        raise ValueError("Cannot delete product because it has active order records.")
        
    db.delete(db_product)
    db.commit()
    return db_product


# ==========================================
# CUSTOMER CRUD
# ==========================================
def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session):
    return db.query(models.Customer).order_by(models.Customer.id.desc()).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    # Check email uniqueness
    db_customer = get_customer_by_email(db, customer.email)
    if db_customer:
        raise ValueError(f"Customer with email '{customer.email}' already exists.")
        
    db_obj = models.Customer(
        full_name=customer.full_name,
        email=customer.email,
        phone_number=customer.phone_number
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return None
        
    # Check if customer has placed any orders
    has_orders = db.query(models.Order).filter(models.Order.customer_id == customer_id).first()
    if has_orders:
        raise ValueError("Cannot delete customer because they have active order history.")
        
    db.delete(db_customer)
    db.commit()
    return db_customer


# ==========================================
# ORDER CRUD & TRANSACTION HANDLING
# ==========================================
def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session):
    return db.query(models.Order).order_by(models.Order.id.desc()).all()

def create_order(db: Session, order_in: schemas.OrderCreate):
    # 1. Validate customer existence
    customer = get_customer(db, order_in.customer_id)
    if not customer:
        raise ValueError(f"Customer with ID {order_in.customer_id} does not exist.")

    # We use a subtransaction context (or rely on the caller session rollback)
    # To be extremely clean, we execute all queries on the session and commit at the end.
    # If any error occurs, caller handles session.rollback().
    
    total_amount = Decimal("0.00")
    order_items_to_create = []
    products_to_update = []
    
    # Track products we've already checked in this request to avoid race conditions with multiple items for same product
    product_stock_temp = {}

    for item in order_in.items:
        # Fetch product
        product = get_product(db, item.product_id)
        if not product:
            raise ValueError(f"Product with ID {item.product_id} does not exist.")
            
        # Get current stock status (incorporate checks from previous items in the same order)
        current_stock = product_stock_temp.get(product.id, product.quantity_in_stock)
        
        # Check stock sufficiency
        if current_stock < item.quantity:
            raise ValueError(
                f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). "
                f"Requested: {item.quantity}, Available: {current_stock}."
            )
            
        # Deduct stock temporarily
        product_stock_temp[product.id] = current_stock - item.quantity
        
        # Calculate subtotal
        item_price = product.price
        item_total = item_price * Decimal(item.quantity)
        total_amount += item_total
        
        # Record updates to be committed
        order_items_to_create.append({
            "product_id": product.id,
            "quantity": item.quantity,
            "unit_price": item_price,
            "product_ref": product # keep ref to update stock
        })

    # Create the parent order
    db_order = models.Order(
        customer_id=order_in.customer_id,
        total_amount=total_amount
    )
    db.add(db_order)
    db.flush() # Flushes order to get db_order.id
    
    # Save all order items and update product stocks
    for item_data in order_items_to_create:
        db_item = models.OrderItem(
            order_id=db_order.id,
            product_id=item_data["product_id"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"]
        )
        db.add(db_item)
        
        # Atomically reduce stock in DB
        product = item_data["product_ref"]
        product.quantity_in_stock -= item_data["quantity"]
        db.add(product)
        
    db.commit()
    db.refresh(db_order)
    return db_order

def delete_order(db: Session, order_id: int):
    # 1. Fetch order
    db_order = get_order(db, order_id)
    if not db_order:
        return None
        
    # 2. Restore inventory stock for all items
    for item in db_order.items:
        product = get_product(db, item.product_id)
        if product:
            product.quantity_in_stock += item.quantity
            db.add(product)
            
    # 3. Delete order (cascades to order_items in models)
    db.delete(db_order)
    db.commit()
    return db_order


# ==========================================
# DASHBOARD STATS CRUD
# ==========================================
def get_dashboard_summary(db: Session):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    
    # Calculate revenue using SQL SUM
    revenue_query = db.query(func.sum(models.Order.total_amount)).scalar()
    total_revenue = Decimal(str(revenue_query)) if revenue_query is not None else Decimal("0.00")
    
    # Retrieve low stock products (stock <= 10)
    low_stock_products = db.query(models.Product).filter(models.Product.quantity_in_stock <= 10).order_by(models.Product.quantity_in_stock.asc()).all()
    
    return schemas.DashboardSummary(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        total_revenue=total_revenue,
        low_stock_products=low_stock_products
    )
