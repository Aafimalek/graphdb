import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env file *before* initializing BaseSettings
# This ensures that environment variables from the file are available.
load_dotenv()

# The incorrect line `from config import Settings` has been removed.

class Settings(BaseSettings):
    """
    Pydantic settings model to manage configuration.
    This reads from environment variables (and .env files via load_dotenv).
    It provides type-checking and a single source of truth for config.
    """
    
    # Groq Configuration
    GROQ_API_KEY: str
    GROQ_MODEL: str = "llama3-8b-8192" # Provide a sensible default

    # Neo4j Configuration
    NEO4J_URI: str
    NEO4J_USERNAME: str
    NEO4J_PASSWORD: str
    NEO4J_DATABASE: str = "neo4j" # Default Neo4j DB

    class Config:
        # This allows BaseSettings to find a .env file
        # Note: We still call load_dotenv() manually for explicit control.
        env_file = ".env"
        env_file_encoding = 'utf-8'
        
        # --- THIS IS THE FIX ---
        # This tells Pydantic to ignore extra variables
        # found in the .env file (like 'aura_instanceid')
        extra = 'ignore'

# Create a single, globally-importable instance
# This is a common pattern: initialize settings once and import elsewhere.
try:
    settings = Settings()
except Exception as e:
    print(f"FATAL ERROR: Could not load application settings: {e}")
    # In a real app, you might exit or raise a critical error
    # For this example, we'll raise it so it's visible.
    raise ValueError(f"Configuration error: {e}") from e