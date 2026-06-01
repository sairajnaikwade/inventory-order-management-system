from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .routers import products, customers, orders, dashboard

# Automatically create database tables on startup if they don't exist
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")
except Exception as e:
    print(f"Error during database initialization: {e}")
    # We don't crash here so that in docker compose we allow time for DB service to boot

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-Ready Full-Stack Inventory & Order Management System API",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Configuration
# In production, specify exact allowed origins. For dev and free-hosting setups, allowing '*' or dynamic config is standard.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(customers.router, prefix=settings.API_V1_STR)
app.include_router(orders.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Status"])
def read_root():
    return {
        "status": "online",
        "message": "Inventory & Order Management API is running",
        "docs_url": "/docs"
    }
