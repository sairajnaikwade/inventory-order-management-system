import sys
import os
from decimal import Decimal
from sqlalchemy.orm import Session

# Ensure app is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app import models

def seed():
    # 1. Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    
    try:
        # Clear existing data to prevent SKU unique violations on re-run
        db.query(models.OrderItem).delete()
        db.query(models.Order).delete()
        db.query(models.Product).delete()
        db.query(models.Customer).delete()
        db.commit()
        print("Cleared any existing data from database.")

        # 2. Insert Products
        products = [
            models.Product(
                name="Stealth Gaming Mouse",
                sku="MOU-STEALTH-01",
                price=Decimal("79.99"),
                quantity_in_stock=45
            ),
            models.Product(
                name="Mechanical Keyboard Pro",
                sku="KEY-MECH-02",
                price=Decimal("149.50"),
                quantity_in_stock=12
            ),
            models.Product(
                name="4K UltraWide Monitor",
                sku="MON-4K-03",
                price=Decimal("499.99"),
                quantity_in_stock=8  # triggers Low Stock alert (<=10)
            ),
            models.Product(
                name="Wireless Charging Pad",
                sku="CHA-WIRE-04",
                price=Decimal("29.99"),
                quantity_in_stock=0  # Out of Stock indicator
            ),
            models.Product(
                name="Ergonomic Office Chair",
                sku="CHR-ERGO-05",
                price=Decimal("289.00"),
                quantity_in_stock=15
            )
        ]
        db.add_all(products)
        db.flush() # flush to generate product.id
        print(f"Seeded {len(products)} products catalog items.")

        # 3. Insert Customers
        customers = [
            models.Customer(
                full_name="Alexander Vance",
                email="alexander@domain.com",
                phone_number="+1 (555) 902-1240"
            ),
            models.Customer(
                full_name="Evelyn Thorne",
                email="evelyn@domain.com",
                phone_number="+1 (555) 304-8931"
            ),
            models.Customer(
                full_name="Marcus Sterling",
                email="marcus@domain.com",
                phone_number="+1 (555) 712-4055"
            )
        ]
        db.add_all(customers)
        db.flush() # flush to generate customer.id
        print(f"Seeded {len(customers)} customer CRM profiles.")

        # 4. Create Order 1 (Alexander Vance purchasing Mouse & Keyboard)
        cust_alex = customers[0]
        prod_mouse = products[0]
        prod_keyboard = products[1]
        
        # Deduct stocks
        prod_mouse.quantity_in_stock -= 1
        prod_keyboard.quantity_in_stock -= 1
        
        order1 = models.Order(
            customer_id=cust_alex.id,
            total_amount=Decimal("229.49")
        )
        db.add(order1)
        db.flush()
        
        order1_items = [
            models.OrderItem(
                order_id=order1.id,
                product_id=prod_mouse.id,
                quantity=1,
                unit_price=prod_mouse.price
            ),
            models.OrderItem(
                order_id=order1.id,
                product_id=prod_keyboard.id,
                quantity=1,
                unit_price=prod_keyboard.price
            )
        ]
        db.add_all(order1_items)

        # 5. Create Order 2 (Evelyn Thorne purchasing Monitor & Chair)
        cust_evelyn = customers[1]
        prod_monitor = products[2]
        prod_chair = products[4]
        
        # Deduct stocks
        prod_monitor.quantity_in_stock -= 1
        prod_chair.quantity_in_stock -= 2
        
        order2 = models.Order(
            customer_id=cust_evelyn.id,
            total_amount=Decimal("1077.99")
        )
        db.add(order2)
        db.flush()
        
        order2_items = [
            models.OrderItem(
                order_id=order2.id,
                product_id=prod_monitor.id,
                quantity=1,
                unit_price=prod_monitor.price
            ),
            models.OrderItem(
                order_id=order2.id,
                product_id=prod_chair.id,
                quantity=2,
                unit_price=prod_chair.price
            )
        ]
        db.add_all(order2_items)
        
        db.commit()
        print("Successfully seeded transactional dummy sale orders and deducted stock levels!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
