import unittest
from pydantic import ValidationError

from app.schemas import InspectionCreate


class TestInspectionSchemas(unittest.TestCase):
    def test_inspection_create_empty(self):
        # location is optional and should default to None
        schema = InspectionCreate()
        self.assertIsNone(schema.location)
        self.assertEqual(schema.model_dump(), {"location": None})

    def test_inspection_create_with_none_explicit(self):
        schema = InspectionCreate(location=None)
        self.assertIsNone(schema.location)
        self.assertEqual(schema.model_dump(), {"location": None})

    def test_inspection_create_with_string_location(self):
        schema = InspectionCreate(location="Connaught Place, New Delhi")
        self.assertEqual(schema.location, "Connaught Place, New Delhi")
        self.assertEqual(schema.model_dump(), {"location": "Connaught Place, New Delhi"})

    def test_inspection_create_rejects_numeric_types(self):
        # Should not silently convert integers to strings
        with self.assertRaises(ValidationError):
            InspectionCreate(location=123)

        # Should not silently convert floats to strings
        with self.assertRaises(ValidationError):
            InspectionCreate(location=45.67)

        # Should not silently convert booleans to strings
        with self.assertRaises(ValidationError):
            InspectionCreate(location=True)


if __name__ == "__main__":
    unittest.main()
