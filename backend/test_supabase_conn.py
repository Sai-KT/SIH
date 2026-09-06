"""
Quick connectivity test script for Supabase.

Usage:
    python test_supabase_conn.py
"""
import sys
from app.database import get_supabase_client


def main() -> None:
    print("Testing Supabase connection...")
    try:
        client = get_supabase_client()
        print("✓ Supabase client successfully initialized.")

        # Test reachability to Supabase service
        session = client.auth.get_session()
        print("✓ Successfully reached Supabase project!")
        print(f"  Auth status: {'Session active' if session else 'Anonymous / Ready'}")
        print("\nAll Supabase connection checks passed!")
    except Exception as exc:
        print(f"✗ Failed to connect to Supabase: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
