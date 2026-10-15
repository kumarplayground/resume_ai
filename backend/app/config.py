import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv, set_key

# Load .env if present
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = "Align Resume Studio API"
    VERSION: str = "1.0.0"
    
    @property
    def GEMINI_API_KEY(self) -> str:
        key = os.getenv("GEMINI_API_KEY", "").strip()
        # Treat placeholder as empty
        if key == "your_gemini_api_key_here":
            return ""
        return key

    @GEMINI_API_KEY.setter
    def GEMINI_API_KEY(self, val: str):
        os.environ["GEMINI_API_KEY"] = val.strip()

    @property
    def GROQ_API_KEY(self) -> str:
        return os.getenv("GROQ_API_KEY", "").strip()

    @property
    def OPENAI_API_KEY(self) -> str:
        return os.getenv("OPENAI_API_KEY", "").strip()

    @property
    def LLM_PROVIDER(self) -> str:
        return os.getenv("LLM_PROVIDER", "gemini").strip()

    @property
    def LLM_MODEL(self) -> str:
        return os.getenv("LLM_MODEL", "gemini-2.0-flash").strip()

    # Server & CORS
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "*"
    ]

settings = Settings()

def save_gemini_api_key(key: str) -> bool:
    """Save Gemini API Key to environment and persist in .env."""
    clean_key = key.strip()
    os.environ["GEMINI_API_KEY"] = clean_key
    try:
        if not env_path.exists():
            env_path.write_text(f"GEMINI_API_KEY={clean_key}\nLLM_PROVIDER=gemini\nLLM_MODEL=gemini-2.0-flash\n", encoding="utf-8")
        else:
            set_key(str(env_path), "GEMINI_API_KEY", clean_key)
        return True
    except Exception as e:
        print(f"Could not persist GEMINI_API_KEY to .env: {e}")
        return False
