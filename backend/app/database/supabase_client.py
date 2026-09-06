import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from supabase import Client, create_client

# Locate .env file relative to the project structure
_BASE_DIR = Path(__file__).resolve().parent.parent.parent
_ENV_PATH = _BASE_DIR / ".env"

if _ENV_PATH.exists():
    load_dotenv(dotenv_path=_ENV_PATH)
else:
    load_dotenv()


def get_supabase_credentials() -> tuple[str, str]:
    """
    Retrieve and validate Supabase credentials from environment variables.

    Supports standard backend variables (SUPABASE_URL, SUPABASE_KEY) as well as
    NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.

    Raises:
        ValueError: If either the Supabase URL or Key is missing.
    """
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = (
        os.getenv("SUPABASE_KEY")
        or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
    )

    if not supabase_url or not supabase_key:
        missing_vars = []
        if not supabase_url:
            missing_vars.append("SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL")
        if not supabase_key:
            missing_vars.append("SUPABASE_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
        raise ValueError(
            f"Missing required Supabase environment variables: {', '.join(missing_vars)}. "
            "Please configure them in your .env file."
        )

    return supabase_url.strip(), supabase_key.strip()


_client_instance: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Provide a reusable singleton Supabase client instance.

    Initializes the client lazily on first access and caches it
    for subsequent module calls across the application.

    Returns:
        Client: An active Supabase client instance.
    """
    global _client_instance
    if _client_instance is None:
        url, key = get_supabase_credentials()
        _client_instance = create_client(url, key)
    return _client_instance


def reset_supabase_client() -> None:
    """Reset the cached Supabase client instance (useful in tests)."""
    global _client_instance
    _client_instance = None
