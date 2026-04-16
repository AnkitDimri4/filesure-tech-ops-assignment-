import os
import re
from datetime import datetime

import pandas as pd
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv

# 1. Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "filesure_assignment")
MONGO_COLLECTION = os.getenv("MONGO_COLLECTION", "companies")


def normalize_status(raw):
    if not isinstance(raw, str):
        return None
    s = raw.strip().lower()
    mapping = {
        "active": "Active",
        "strike off": "Strike Off",
        "struck off": "Strike Off",
        "under liquidation": "Under Liquidation",
        "under liq.": "Under Liquidation",
        "dormant": "Dormant",
    }
    # try exact match
    if s in mapping:
        return mapping[s]
    # try partial
    if "active" in s:
        return "Active"
    if "strike" in s:
        return "Strike Off"
    if "liquid" in s:
        return "Under Liquidation"
    if "dormant" in s:
        return "Dormant"
    return raw.strip()


def parse_date(raw):
    if pd.isna(raw):
        return None
    if not isinstance(raw, str):
        raw = str(raw)

    raw = raw.strip()
    if not raw:
        return None

    # Try multiple formats
    formats = ["%d-%m-%Y", "%Y/%m/%d", "%m/%d/%Y", "%Y-%m-%d"]
    for fmt in formats:
        try:
            dt = datetime.strptime(raw, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    # If it fails, return None (or keep raw if you prefer)
    return None


def clean_paid_up_capital(raw):
    if pd.isna(raw):
        return None
    if not isinstance(raw, str):
        raw = str(raw)
    # Remove currency symbols and commas and spaces
    cleaned = raw.replace("₹", "").replace("Rs.", "").replace("Rs", "")
    cleaned = cleaned.replace(",", "").replace(" ", "")
    cleaned = cleaned.replace("..", "").strip()

    if not cleaned:
        return None
    try:
        return int(cleaned)
    except ValueError:
        return None


EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_email(raw):
    if pd.isna(raw):
        return None, False
    if not isinstance(raw, str):
        raw = str(raw)
    email = raw.strip()
    if not email:
        return None, False
    is_valid = bool(EMAIL_REGEX.match(email))
    return email, is_valid


def transform_row(row):
    cin = str(row.get("cin")).strip() if pd.notna(row.get("cin")) else None
    company_name = str(row.get("company_name")).strip() if pd.notna(row.get("company_name")) else None
    status = normalize_status(row.get("status"))
    incorporation_date = parse_date(row.get("incorporation_date"))
    state = str(row.get("state")).strip() if pd.notna(row.get("state")) else None
    director_1 = str(row.get("director_1")).strip() if pd.notna(row.get("director_1")) else None
    director_2 = str(row.get("director_2")).strip() if pd.notna(row.get("director_2")) else None
    paid_up_capital = clean_paid_up_capital(row.get("paid_up_capital"))
    last_filing_date = parse_date(row.get("last_filing_date"))
    email, is_valid_email = validate_email(row.get("email"))

    doc = {
        "cin": cin,
        "company_name": company_name,
        "status": status,
        "incorporation_date": incorporation_date,
        "state": state,
        "director_1": director_1,
        "director_2": director_2,
        "paid_up_capital": paid_up_capital,
        "last_filing_date": last_filing_date,
        "email": email,
        "is_valid_email": is_valid_email,
        "_metadata": {
            "source": "sample_csv",
        },
    }

    return doc


def main():
    csv_path = os.path.join(os.path.dirname(__file__), "company_records.csv")
    print(f"Reading CSV from {csv_path}")

    df = pd.read_csv(csv_path)

    # Connect to MongoDB
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]
    collection = db[MONGO_COLLECTION]

    docs = []
    for _, row in df.iterrows():
        try:
            doc = transform_row(row)
            docs.append(doc)
        except Exception as e:
            print("Error processing row:", row.to_dict(), e)

    if docs:
        try:
            result = collection.insert_many(docs)
            print(f"Inserted {len(result.inserted_ids)} documents.")
        except Exception as e:
            print("Error inserting documents into MongoDB:", e)

    # Create index for API queries
    try:
        collection.create_index([("status", ASCENDING), ("state", ASCENDING)])
        print("Created index on status + state.")
    except Exception as e:
        print("Error creating index:", e)


if __name__ == "__main__":
    main()