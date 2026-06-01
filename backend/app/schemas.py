from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

# ==========================================
# PRODUCT SCHEMAS
# ==========================================
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Name of the product")
    sku: str = Field(..., min_length=1, max_length=100, description="Unique stock keeping unit code")
    price: Decimal = Field(..., gt=0, decimal_places=2, description="Price of the product, must be greater than 0")
    quantity_in_stock: int = Field(..., ge=0, description="Available inventory stock, cannot be negative")

    @field_validator('name', 'sku')
    @classmethod
    def check_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be empty or whitespace only")
        return v.strip()

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    quantity_in_stock: Optional[int] = Field(None, ge=0)

    @field_validator('name', 'sku')
    @classmethod
    def check_not_empty_opt(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Field cannot be empty or whitespace only")
        return v.strip() if v is not None else None

class ProductOut(ProductBase):
    id: int

    class Config:
        from_attributes = True


# ==========================================
# CUSTOMER SCHEMAS
# ==========================================
class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255, description="Full name of the customer")
    email: EmailStr = Field(..., description="Unique email address of the customer")
    phone_number: str = Field(..., min_length=1, max_length=50, description="Contact phone number")

    @field_validator('full_name', 'phone_number')
    @classmethod
    def check_not_empty_cust(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be empty or whitespace only")
        return v.strip()

class CustomerCreate(CustomerBase):
    pass

class CustomerOut(CustomerBase):
    id: int

    class Config:
        from_attributes = True


# ==========================================
# ORDER ITEM SCHEMAS
# ==========================================
class OrderItemCreate(BaseModel):
    product_id: int = Field(..., gt=0, description="ID of the product to order")
    quantity: int = Field(..., gt=0, description="Quantity ordered, must be at least 1")

class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True


# ==========================================
# ORDER SCHEMAS
# ==========================================
class OrderCreate(BaseModel):
    customer_id: int = Field(..., gt=0, description="ID of the customer placing the order")
    items: List[OrderItemCreate] = Field(..., min_items=1, description="List of items to purchase, must contain at least one item")

class OrderOut(BaseModel):
    id: int
    customer_id: int
    total_amount: Decimal
    created_at: datetime
    items: List[OrderItemOut]
    customer: CustomerOut

    class Config:
        from_attributes = True


# ==========================================
# DASHBOARD SCHEMAS
# ==========================================
class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    total_revenue: Decimal
    low_stock_products: List[ProductOut]
