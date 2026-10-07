import re


def detect_ambiguities(question):
    """
    Detect possible ambiguities in a user's analytical question.
    """

    ambiguities = []

    question_lower = question.lower()

    # Date ambiguity
    date_patterns = [
        r"\b\d{1,2}/\d{1,2}/\d{4}\b",
        r"\b\d{1,2}-\d{1,2}-\d{4}\b"
    ]

    if any(re.search(pattern, question_lower) for pattern in date_patterns):
        ambiguities.append({
            "type": "date_format",
            "message": "The date may have multiple interpretations such as DD/MM/YYYY or MM/DD/YYYY.",
            "impact": "high"
        })

    # Month ambiguity
    months = [
        "january", "february", "march", "april",
        "may", "june", "july", "august",
        "september", "october", "november", "december"
    ]

    if any(month in question_lower for month in months):
        ambiguities.append({
            "type": "date_range",
            "message": "The requested month may require clarification about the year.",
            "impact": "medium"
        })

    # Currency ambiguity
    currency_terms = ["usd", "dollar", "dollars", "$", "inr", "rupee", "rupees", "₹"]

    if any(term in question_lower for term in currency_terms):
        ambiguities.append({
            "type": "currency",
            "message": "Currency conversion or currency consistency may need verification.",
            "impact": "high"
        })

    # Unit ambiguity
    unit_terms = [
    "kg", "kilogram", "kilograms",
    "gram", "grams",
    "liter", "liters",
    "litre", "litres",
    "meter", "meters",
    "metre", "metres"
    ]

    if any(
        re.search(rf"\b{re.escape(term)}\b", question_lower)
        for term in unit_terms
    ):
        ambiguities.append({
            "type": "unit",
            "message": "The requested unit may need conversion or consistency checking.",
            "impact": "medium"
        })

    # "Most" / "highest" ambiguity
    ranking_terms = ["highest", "lowest", "most", "least", "best", "worst", "top"]

    if any(
        re.search(rf"\b{re.escape(term)}\b", question_lower)
        for term in ranking_terms
    ):
        if not any(
            metric in question_lower
            for metric in ["revenue", "sales", "amount", "quantity", "transactions"]
        ):
            ambiguities.append({
                "type": "metric_definition",
                "message": "The ranking metric should be identified before calculating the result.",
                "impact": "medium"
            })

    return ambiguities


def ambiguity_impact_score(ambiguities):
    """
    Calculate a simple impact score.
    """

    if not ambiguities:
        return 0

    score = 0

    for ambiguity in ambiguities:

        if ambiguity["impact"] == "high":
            score += 3

        elif ambiguity["impact"] == "medium":
            score += 2

        else:
            score += 1

    return score


if __name__ == "__main__":

    question = input("Enter your question: ")

    results = detect_ambiguities(question)

    score = ambiguity_impact_score(results)

    print("\nAMBIGUITY ANALYSIS")
    print("=" * 50)

    if not results:
        print("No obvious ambiguity detected.")

    else:
        for item in results:
            print(f"\nType: {item['type']}")
            print(f"Message: {item['message']}")
            print(f"Impact: {item['impact']}")

    print("\nAmbiguity Impact Score:", score)