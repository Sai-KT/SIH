import unittest
from app.schemas import InspectionCreate


class TestInspectionSchemas(unittest.TestCase):
    def test_inspection_create_empty(self):
        # location is optional and should default to None
        schema = InspectionCreate()
        self.assertIsNone(schema.location)
        self.assertEqual(schema.model_dump(), {"location": None})

    def test_inspection_create_with_location(self):
        schema = InspectionCreate(location="Connaught Place, New Delhi")
        self.assertEqual(schema.location, "Connaught Place, New Delhi")
        self.assertEqual(schema.model_dump(), {"location": "Connaught Place, New Delhi"})


if __name__ == "__main__":
    unittest.main()
