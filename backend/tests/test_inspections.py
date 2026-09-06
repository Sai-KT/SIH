import unittest
from unittest.mock import MagicMock, patch
from starlette.testclient import TestClient

from app.main import app


class TestInspectionAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch("app.api.inspections.get_supabase_client")
    def test_create_inspection_success(self, mock_get_supabase):
        mock_supabase = MagicMock()
        mock_table = MagicMock()
        mock_insert = MagicMock()
        mock_execute = MagicMock()

        expected_record = {
            "id": "7b8e5c2b-6c4a-4a8e-9d2a-123456789abc",
            "product_id": None,
            "inspector_id": None,
            "status": "UPLOADED",
            "compliance_score": None,
            "location": "Pune",
            "inspection_date": "2026-09-06T16:30:00Z",
            "created_at": "2026-09-06T16:30:00Z",
        }

        mock_execute.data = [expected_record]
        mock_insert.execute.return_value = mock_execute
        mock_table.insert.return_value = mock_insert
        mock_supabase.table.return_value = mock_table
        mock_get_supabase.return_value = mock_supabase

        response = self.client.post("/api/v1/inspections", json={"location": "Pune"})

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json(), expected_record)

        # Verify backend strictly enforced payload fields
        mock_table.insert.assert_called_once_with({
            "location": "Pune",
            "status": "UPLOADED",
        })

    @patch("app.api.inspections.get_supabase_client")
    def test_create_inspection_without_location(self, mock_get_supabase):
        mock_supabase = MagicMock()
        mock_table = MagicMock()
        mock_insert = MagicMock()
        mock_execute = MagicMock()

        expected_record = {
            "id": "e2f1a3b4-5c6d-7e8f-9a0b-123456789def",
            "product_id": None,
            "inspector_id": None,
            "status": "UPLOADED",
            "compliance_score": None,
            "location": None,
            "inspection_date": "2026-09-06T16:30:00Z",
            "created_at": "2026-09-06T16:30:00Z",
        }

        mock_execute.data = [expected_record]
        mock_insert.execute.return_value = mock_execute
        mock_table.insert.return_value = mock_insert
        mock_supabase.table.return_value = mock_table
        mock_get_supabase.return_value = mock_supabase

        response = self.client.post("/api/v1/inspections", json={})

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json(), expected_record)
        mock_table.insert.assert_called_once_with({
            "location": None,
            "status": "UPLOADED",
        })

    @patch("app.api.inspections.get_supabase_client")
    def test_create_inspection_db_failure(self, mock_get_supabase):
        mock_supabase = MagicMock()
        mock_table = MagicMock()
        mock_table.insert.side_effect = Exception("Supabase connection timeout")
        mock_supabase.table.return_value = mock_table
        mock_get_supabase.return_value = mock_supabase

        response = self.client.post("/api/v1/inspections", json={"location": "Pune"})

        self.assertEqual(response.status_code, 500)
        self.assertIn("Database error while creating inspection", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
