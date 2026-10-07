import pandas as pd
import os


def profile_file(file_path):
    """Analyze a CSV file and return a data quality profile."""

    df = pd.read_csv(file_path)

    profile = {
        "file": os.path.basename(file_path),
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": list(df.columns),
        "missing_values": df.isnull().sum().to_dict(),
        "duplicate_rows": int(df.duplicated().sum()),
        "data_types": df.dtypes.astype(str).to_dict()
    }

    # Detect possible currency columns
    currency_columns = []

    for column in df.columns:
        if column.lower() in ["currency", "currency_code"]:
            currency_columns.append(column)

    profile["currency_columns"] = currency_columns

    # Detect possible date columns
    date_columns = []

    for column in df.columns:
        if "date" in column.lower():
            date_columns.append(column)

    profile["date_columns"] = date_columns

    return profile


def profile_folder(folder_path):
    """Profile all CSV files inside a folder."""

    results = []

    for filename in os.listdir(folder_path):

        if filename.lower().endswith(".csv"):

            file_path = os.path.join(folder_path, filename)

            try:
                results.append(profile_file(file_path))

            except Exception as error:
                results.append({
                    "file": filename,
                    "error": str(error)
                })

    return results


if __name__ == "__main__":

    data_folder = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "data"
    )

    profiles = profile_folder(data_folder)

    print("\n" + "=" * 60)
    print("PROOF-CARRYING DATA ANALYST")
    print("DATA QUALITY PROFILE")
    print("=" * 60)

    for profile in profiles:

        print(f"\nFile: {profile['file']}")

        if "error" in profile:
            print("Error:", profile["error"])
            continue

        print("Rows:", profile["rows"])
        print("Columns:", profile["columns"])
        print("Duplicate rows:", profile["duplicate_rows"])
        print("Missing values:", profile["missing_values"])
        print("Date columns:", profile["date_columns"])
        print("Currency columns:", profile["currency_columns"])

    print("\n" + "=" * 60)