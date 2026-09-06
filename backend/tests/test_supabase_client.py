import os
import unittest
from unittest.mock import patch
from app.database.supabase_client import (
    get_supabase_credentials,
    get_supabase_client,
    reset_supabase_client,
)
from supabase import Client


class TestSupabaseClient(unittest.TestCase):
    def setUp(self):
        reset_supabase_client()

    def tearDown(self):
        reset_supabase_client()

    def test_missing_credentials_raises_error(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(ValueError) as ctx:
                get_supabase_credentials()
            self.assertIn("Missing required Supabase environment variables", str(ctx.exception))

    def test_credentials_loaded_from_next_public_prefix(self):
        env = {
            "NEXT_PUBLIC_SUPABASE_URL": "https://example.supabase.co",
            "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": "test-publishable-key",
        }
        with patch.dict(os.environ, env, clear=True):
            url, key = get_supabase_credentials()
            self.assertEqual(url, "https://example.supabase.co")
            self.assertEqual(key, "test-publishable-key")

    def test_credentials_loaded_from_standard_prefix(self):
        env = {
            "SUPABASE_URL": "https://example-standard.supabase.co",
            "SUPABASE_KEY": "test-standard-key",
        }
        with patch.dict(os.environ, env, clear=True):
            url, key = get_supabase_credentials()
            self.assertEqual(url, "https://example-standard.supabase.co")
            self.assertEqual(key, "test-standard-key")

    def test_get_supabase_client_singleton(self):
        client = get_supabase_client()
        self.assertIsInstance(client, Client)
        client_second = get_supabase_client()
        self.assertIs(client, client_second)


if __name__ == "__main__":
    unittest.main()
