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

    def test_create_inspection_rejects_numeric_location(self):
        # Sending numeric value 12345 should fail with 422 Unprocessable Entity
        response = self.client.post("/api/v1/inspections", json={"location": 12345})
        self.assertEqual(response.status_code, 422)
        errors = response.json().get("detail", [])
        self.assertTrue(any("string" in err.get("msg", "").lower() for err in errors))

        # Sending float value 99.99 should also fail with 422
        response_float = self.client.post("/api/v1/inspections", json={"location": 99.99})
        self.assertEqual(response_float.status_code, 422)

    @patch("app.api.inspections.get_supabase_client")
    def test_get_inspection_by_id_success(self, mock_get_supabase):
        test_id = "7b8e5c2b-6c4a-4a8e-9d2a-123456789abc"
        expected_record = {
            "id": test_id,
            "product_id": None,
            "inspector_id": None,
            "status": "UPLOADED",
            "compliance_score": None,
            "location": "Pune",
            "inspection_date": "2026-09-06T16:30:00Z",
            "created_at": "2026-09-06T16:30:00Z",
        }

        mock_supabase = MagicMock()
        mock_table = MagicMock()
        mock_select = MagicMock()
        mock_eq = MagicMock()
        mock_execute = MagicMock()

        mock_execute.data = [expected_record]
        mock_eq.execute.return_value = mock_execute
        mock_select.eq.return_value = mock_eq
        mock_table.select.return_value = mock_select
        mock_supabase.table.return_value = mock_table
        mock_get_supabase.return_value = mock_supabase

        response = self.client.get(f"/api/v1/inspections/{test_id}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), expected_record)

        mock_table.select.assert_called_once_with("*")
        mock_select.eq.assert_called_once_with("id", test_id)

    @patch("app.api.inspections.get_supabase_client")
    def test_get_inspection_by_id_not_found(self, mock_get_supabase):
        test_id = "00000000-0000-0000-0000-000000000000"

        mock_supabase = MagicMock()
        mock_table = MagicMock()
        mock_select = MagicMock()
        mock_eq = MagicMock()
        mock_execute = MagicMock()

        mock_execute.data = []  # No record found
        mock_eq.execute.return_value = mock_execute
        mock_select.eq.return_value = mock_eq
        mock_table.select.return_value = mock_select
        mock_supabase.table.return_value = mock_table
        mock_get_supabase.return_value = mock_supabase

        response = self.client.get(f"/api/v1/inspections/{test_id}")

        self.assertEqual(response.status_code, 404)
        self.assertIn(f"Inspection with ID '{test_id}' not found.", response.json()["detail"])

    def test_get_inspection_by_id_invalid_uuid(self):
        # Invalid UUID format should immediately fail at route parameter validation with 422
        response = self.client.get("/api/v1/inspections/not-a-valid-uuid")
        self.assertEqual(response.status_code, 422)

    @patch("app.api.inspections.get_supabase_client")
    def test_get_inspection_by_id_db_failure(self, mock_get_supabase):
        test_id = "7b8e5c2b-6c4a-4a8e-9d2a-123456789abc"

        mock_supabase = MagicMock()
        mock_table = MagicMock()
        mock_table.select.side_effect = Exception("Supabase connection error")
        mock_supabase.table.return_value = mock_table
        mock_get_supabase.return_value = mock_supabase

        response = self.client.get(f"/api/v1/inspections/{test_id}")

        self.assertEqual(response.status_code, 500)
        self.assertIn("Database error while retrieving inspection", response.json()["detail"])


class TestRapidInspectionAPI(unittest.TestCase):
    """Unit tests for POST /api/v1/inspections/rapid"""

    def setUp(self):
        self.client = TestClient(app)

    @patch("app.api.inspections.get_supabase_client")
    def test_rapid_create_compliant_success(self, mock_get_supabase):
        """Officer marks a commodity as COMPLIANT — record created and rapid_meta attached."""
        mock_supabase = MagicMock()
        mock_table = MagicMock()
        mock_insert = MagicMock()
        mock_execute = MagicMock()

        db_record = {
            "id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            "status": "COMPLIANT",
            "compliance_score": 100.0,
            "location": "Crawford Market, Mumbai",
            "inspector_id": "usr-003",
            "inspection_date": "2026-09-09T12:00:00Z",
            "created_at": "2026-09-09T12:00:00Z",
        }
        mock_execute.data = [db_record]
        mock_insert.execute.return_value = mock_execute
        mock_table.insert.return_value = mock_insert
        mock_supabase.table.return_value = mock_table
        mock_get_supabase.return_value = mock_supabase

        payload = {
            "location": "Crawford Market, Mumbai",
            "vendor_name": "Sharma General Stores",
            "product_name": "Britannia Good Day Butter Cookies (200g)",
            "brand_name": "Britannia Industries Ltd.",
            "net_quantity": "200g",
            "inspector_id": "usr-003",
            "inspector_badge": "LMO-MH-042",
            "violations": [],
            "status": "COMPLIANT",
            "compliance_score": 100.0,
        }

        response = self.client.post("/api/v1/inspections/rapid", json=payload)

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body["status"], "COMPLIANT")
        self.assertIn("rapid_meta", body)
        self.assertEqual(body["rapid_meta"]["vendor_name"], "Sharma General Stores")
        self.assertEqual(body["rapid_meta"]["violations"], [])

    @patch("app.api.inspections.get_supabase_client")
    def test_rapid_create_with_violations(self, mock_get_supabase):
        """Officer records violations — violation list preserved in rapid_meta."""
        mock_supabase = MagicMock()
        mock_table = MagicMock()
        mock_insert = MagicMock()
        mock_execute = MagicMock()

        db_record = {
            "id": "11111111-2222-3333-4444-555555555555",
            "status": "NON_COMPLIANT",
            "compliance_score": 45.0,
            "location": "Dadar Market, Mumbai",
            "inspector_id": None,
            "inspection_date": "2026-09-09T14:00:00Z",
            "created_at": "2026-09-09T14:00:00Z",
        }
        mock_execute.data = [db_record]
        mock_insert.execute.return_value = mock_execute
        mock_table.insert.return_value = mock_insert
        mock_supabase.table.return_value = mock_table
        mock_get_supabase.return_value = mock_supabase

        payload = {
            "location": "Dadar Market, Mumbai",
            "vendor_name": "Patel Bros Wholesale",
            "product_name": "XYZ Refined Oil 1L",
            "violations": [
                {
                    "rule_ref": "Rule 6(1)(e)",
                    "description": "MRP missing on principal display panel",
                    "tag": "DUAL_MRP",
                },
                {
                    "rule_ref": "Rule 6(1)(d)",
                    "description": "Month and year of manufacture smudged / illegible",
                    "tag": "SMUDGED_DATE",
                },
            ],
            "status": "NON_COMPLIANT",
            "compliance_score": 45.0,
        }

        response = self.client.post("/api/v1/inspections/rapid", json=payload)

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body["status"], "NON_COMPLIANT")
        self.assertEqual(len(body["rapid_meta"]["violations"]), 2)
        self.assertEqual(body["rapid_meta"]["violations"][0]["rule_ref"], "Rule 6(1)(e)")

    def test_rapid_create_rejects_invalid_status(self):
        """Unknown status strings must be rejected with 422."""
        payload = {
            "location": "Test Market",
            "status": "INVALID_STATUS_XYZ",
        }
        response = self.client.post("/api/v1/inspections/rapid", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_rapid_create_rejects_out_of_range_score(self):
        """compliance_score outside 0–100 must be rejected with 422."""
        payload = {
            "location": "Test Market",
            "status": "COMPLIANT",
            "compliance_score": 150.0,  # Invalid: > 100
        }
        response = self.client.post("/api/v1/inspections/rapid", json=payload)
        self.assertEqual(response.status_code, 422)

    @patch("app.api.inspections.get_supabase_client")
    def test_rapid_create_db_failure(self, mock_get_supabase):
        """Database error propagates as HTTP 500."""
        mock_supabase = MagicMock()
        mock_table = MagicMock()
        mock_table.insert.side_effect = Exception("Connection refused")
        mock_supabase.table.return_value = mock_table
        mock_get_supabase.return_value = mock_supabase

        response = self.client.post(
            "/api/v1/inspections/rapid",
            json={"location": "Test Market", "status": "COMPLIANT"},
        )
        self.assertEqual(response.status_code, 500)
        self.assertIn("Database error while creating rapid inspection", response.json()["detail"])


class TestDailySummaryAPI(unittest.TestCase):
    """Unit tests for GET /api/v1/inspections/daily-summary"""

    def setUp(self):
        self.client = TestClient(app)

    @patch("app.api.inspections.get_supabase_client")
    def test_daily_summary_returns_tally(self, mock_get_supabase):
        """Returns aggregated tally for today's inspections."""
        mock_supabase = MagicMock()
        mock_table = MagicMock()
        mock_select = MagicMock()
        mock_gte = MagicMock()
        mock_execute = MagicMock()

        mock_execute.data = [
            {"id": "aaa", "status": "COMPLIANT", "inspector_id": "usr-003"},
            {"id": "bbb", "status": "COMPLIANT", "inspector_id": "usr-003"},
            {"id": "ccc", "status": "NON_COMPLIANT", "inspector_id": "usr-003"},
            {"id": "ddd", "status": "UNDER_REVIEW", "inspector_id": "usr-003"},
        ]
        mock_gte.execute.return_value = mock_execute
        mock_select.gte.return_value = mock_gte
        mock_table.select.return_value = mock_select
        mock_supabase.table.return_value = mock_table
        mock_get_supabase.return_value = mock_supabase

        response = self.client.get("/api/v1/inspections/daily-summary")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["total"], 4)
        self.assertEqual(body["compliant"], 2)
        self.assertEqual(body["non_compliant"], 1)
        self.assertEqual(body["requires_review"], 1)
        self.assertIn("date", body)

    @patch("app.api.inspections.get_supabase_client")
    def test_daily_summary_with_inspector_id(self, mock_get_supabase):
        """Query is filtered by inspector_id when provided."""
        mock_supabase = MagicMock()
        mock_table = MagicMock()
        mock_select = MagicMock()
        mock_gte = MagicMock()
        mock_eq = MagicMock()
        mock_execute = MagicMock()

        mock_execute.data = [
            {"id": "aaa", "status": "COMPLIANT", "inspector_id": "usr-003"},
        ]
        mock_eq.execute.return_value = mock_execute
        mock_gte.eq.return_value = mock_eq
        mock_select.gte.return_value = mock_gte
        mock_table.select.return_value = mock_select
        mock_supabase.table.return_value = mock_table
        mock_get_supabase.return_value = mock_supabase

        response = self.client.get(
            "/api/v1/inspections/daily-summary",
            params={"inspector_id": "usr-003"},
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["inspector_id"], "usr-003")
        self.assertEqual(body["total"], 1)
        self.assertEqual(body["compliant"], 1)

    @patch("app.api.inspections.get_supabase_client")
    def test_daily_summary_empty_day(self, mock_get_supabase):
        """Returns zeroed tally when no inspections exist for today."""
        mock_supabase = MagicMock()
        mock_table = MagicMock()
        mock_select = MagicMock()
        mock_gte = MagicMock()
        mock_execute = MagicMock()

        mock_execute.data = []
        mock_gte.execute.return_value = mock_execute
        mock_select.gte.return_value = mock_gte
        mock_table.select.return_value = mock_select
        mock_supabase.table.return_value = mock_table
        mock_get_supabase.return_value = mock_supabase

        response = self.client.get("/api/v1/inspections/daily-summary")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["total"], 0)
        self.assertEqual(body["compliant"], 0)
        self.assertEqual(body["non_compliant"], 0)

    @patch("app.api.inspections.get_supabase_client")
    def test_daily_summary_db_failure(self, mock_get_supabase):
        """Database error propagates as HTTP 500."""
        mock_supabase = MagicMock()
        mock_table = MagicMock()
        mock_table.select.side_effect = Exception("DB connection dropped")
        mock_supabase.table.return_value = mock_table
        mock_get_supabase.return_value = mock_supabase

        response = self.client.get("/api/v1/inspections/daily-summary")
        self.assertEqual(response.status_code, 500)
        self.assertIn("Database error while fetching daily summary", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
