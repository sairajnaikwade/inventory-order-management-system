import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Inventory & Order Management System"
    API_V1_STR: str = "/api/v1"
    
    # PostgreSQL Configuration
    DB_USER: str = os.getenv("POSTGRES_USER", "postgres")
    DB_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    DB_HOST: str = os.getenv("POSTGRES_HOST", "db")
    DB_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    DB_NAME: str = os.getenv("POSTGRES_DB", "inventory_db")
    
    # SQLite Fallback Configuration
    USE_SQLITE: bool = os.getenv("USE_SQLITE", "false").lower() == "true"
    
    @property
    def DATABASE_URL(self) -> str:
        if self.USE_SQLITE:
            return "sqlite:///./local_inventory.db"
            
        # Check if DATABASE_URL is set directly (e.g. for Render or local dev)
        direct_url = os.getenv("DATABASE_URL")
        if direct_url:
            # Handle possible Render/Railway postgres:// vs postgresql:// scheme issue
            if direct_url.startswith("postgres://"):
                direct_url = direct_url.replace("postgres://", "postgresql://", 1)
            return direct_url
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

settings = Settings()
