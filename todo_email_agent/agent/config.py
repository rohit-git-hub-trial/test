import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

AZURE_CLIENT_ID = os.environ.get("AZURE_CLIENT_ID", "")
AZURE_TENANT_ID = os.environ.get("AZURE_TENANT_ID", "common")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

DATA_DIR = Path(os.environ.get("DATA_DIR", "./data")).resolve()
DATA_DIR.mkdir(parents=True, exist_ok=True)

TOKEN_CACHE_PATH = DATA_DIR / "token_cache.json"
TASKS_PATH = DATA_DIR / "tasks.json"

GRAPH_SCOPES = ["Mail.Read", "Mail.ReadWrite", "Mail.Send", "User.Read"]
GRAPH_AUTHORITY = f"https://login.microsoftonline.com/{AZURE_TENANT_ID}"
GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0"


def require_client_id() -> str:
    if not AZURE_CLIENT_ID:
        raise SystemExit(
            "AZURE_CLIENT_ID is not set. Copy .env.example to .env and fill it in "
            "(see README setup section)."
        )
    return AZURE_CLIENT_ID
