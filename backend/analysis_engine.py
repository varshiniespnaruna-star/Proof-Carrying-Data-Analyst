import pandas as pd
import os


DATA_FOLDER = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "data"
)


def load_data():
    customers = pd.read_csv(
        os.path.join(DATA_FOLDER, "customers.csv")
    )

    transactions = pd.read_csv(
        os.path.join(DATA_FOLDER, "transactions.csv")
    )

    return customers, transactions


def highest_revenue_city():
    customers, transactions = load_data()

    # Detect duplicate transaction IDs
    duplicate_count = transactions.duplicated(
        subset=["transaction_id"]
    ).sum()

    # Remove duplicate transactions before calculation
    clean_transactions = transactions.drop_duplicates(
        subset=["transaction_id"]
    ).copy()

    # Join transactions with customer information
    merged = clean_transactions.merge(
        customers[["customer_id", "city"]],
        on="customer_id",
        how="left"
    )

    # Calculate revenue by city
    revenue_by_city = (
        merged.groupby("city")["amount"]
        .sum()
        .sort_values(ascending=False)
    )

    highest_city = revenue_by_city.index[0]
    highest_revenue = revenue_by_city.iloc[0]

    return {
        "answer": highest_city,
        "revenue": float(highest_revenue),
        "currency": "INR",
        "duplicate_transactions_removed": int(duplicate_count),
        "revenue_by_city": revenue_by_city.to_dict()
    }


if __name__ == "__main__":

    result = highest_revenue_city()

    print("\n" + "=" * 60)
    print("PROOF-CARRYING DATA ANALYST")
    print("ANALYSIS RESULT")
    print("=" * 60)

    print("\nQuestion:")
    print("Which city generated the highest revenue?")

    print("\nAnswer:", result["answer"])
    print("Revenue:", result["revenue"], result["currency"])

    print(
        "Duplicate transactions removed:",
        result["duplicate_transactions_removed"]
    )

    print("\nRevenue by City:")

    for city, revenue in result["revenue_by_city"].items():
        print(f"{city}: INR {revenue:,.2f}")

    print("=" * 60)