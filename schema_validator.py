#!/usr/bin/env python3
import json
import sys
import os
from jsonschema import Draft4Validator, ValidationError

def fix_regex_patterns(schema_dict):
    """
    Fix double-escaped regex patterns in the schema.
    """
    if isinstance(schema_dict, dict):
        for key, value in schema_dict.items():
            if key == "pattern" and isinstance(value, str):
                # Fix double-escaped backslashes in regex patterns
                schema_dict[key] = value.replace("\\\\", "\\")
            else:
                fix_regex_patterns(value)
    elif isinstance(schema_dict, list):
        for item in schema_dict:
            fix_regex_patterns(item)

def validate_workitems(workitems, schema):
    """
    Validate each item in the 'workitems' array against the schema.
    """
    output_schema = schema["outputDataDefinition"]["outputSchema"]
    
    # Fix the regex patterns before validation
    fix_regex_patterns(output_schema)
    
    validator = Draft4Validator(output_schema)
    validation_results = {
        "isValid": True,
        "errors": [],
        "itemCount": len(workitems),
        "validItems": 0,
        "invalidItems": 0
    }
    
    for idx, item in enumerate(workitems):
        try:
            validator.validate(item)
            validation_results["validItems"] += 1
            # Print success message for each valid item
            # print(f"Item {idx + 1} in 'workitems' is valid.")
        except ValidationError as e:
            validation_results["isValid"] = False
            validation_results["invalidItems"] += 1
            # Print specific error message for each invalid item (to stderr for debugging)
            print(f"Item {idx + 1} in 'workitems' is invalid: {e.message}", file=sys.stderr)
            validation_results["errors"].append({
                "itemIndex": idx + 1,
                "instancePath": f"workitems[{idx}]{e.absolute_path}",
                "schemaPath": e.schema_path,
                "keyword": e.validator,
                "params": e.validator_value,
                "message": e.message
            })
    
    if validation_results["isValid"]:
        print("File is valid", file=sys.stderr)
    
    return validation_results

def test_validate(schema, text_pref_output):
    """
    Main validation function that checks workitems.
    """
    # Check if 'workitems' is present in the input JSON
    if "workitems" in text_pref_output:
        workitems = text_pref_output["workitems"]
        if isinstance(workitems, list):
            return validate_workitems(workitems, schema)
        else:
            print("'workitems' is not a valid list.", file=sys.stderr)
            return {
                "isValid": False,
                "errors": [{
                    "instancePath": "",
                    "schemaPath": "",
                    "keyword": "type",
                    "params": {},
                    "message": "'workitems' is not a valid list."
                }]
            }
    else:
        print("'workitems' property is missing from input file.", file=sys.stderr)
        return {
            "isValid": False,
            "errors": [{
                "instancePath": "",
                "schemaPath": "",
                "keyword": "required",
                "params": {},
                "message": "'workitems' property is missing from input file."
            }]
        }

def main():
    if len(sys.argv) != 3:
        print(json.dumps({
            "isValid": False,
            "errors": [{
                "instancePath": "",
                "schemaPath": "",
                "keyword": "error",
                "params": {},
                "message": "Usage: python schema_validator.py <schema_file> <data_file>"
            }]
        }))
        sys.exit(1)
    
    schema_file = sys.argv[1]
    data_file = sys.argv[2]
    
    try:
        # Load schema file
        if not os.path.exists(schema_file):
            raise FileNotFoundError(f"Schema file not found: {schema_file}")
        
        with open(schema_file, 'r') as f:
            schema = json.load(f)
        
        # Load data file
        if not os.path.exists(data_file):
            raise FileNotFoundError(f"Data file not found: {data_file}")
        
        with open(data_file, 'r') as f:
            text_pref_output = json.load(f)
        
        # Run validation using your exact logic
        result = test_validate(schema, text_pref_output)
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "isValid": False,
            "errors": [{
                "instancePath": "",
                "schemaPath": "",
                "keyword": "error",
                "params": {},
                "message": f"Validation error: {str(e)}"
            }]
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main() 