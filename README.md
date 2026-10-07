# 🔎 Proof-Carrying Data Analyst

### Agentic GenAI-Based Evidence-Backed Data Analysis System

> **Don't just get an answer. Get the evidence behind the answer.**

Proof-Carrying Data Analyst is an Agentic GenAI-inspired data analysis system designed to make data analysis more **reliable, transparent, explainable, and verifiable**.

Instead of blindly answering a user's analytical question, the system first examines the question and available data, detects possible ambiguities and data-quality issues, performs the analysis, verifies the result, and provides the evidence used to support the answer.

---

## 🎯 Problem Statement

Traditional data analysis systems can produce incorrect results when:

- The user's question is ambiguous.
- Multiple interpretations are possible.
- Data contains duplicate records.
- Different datasets contain conflicting information.
- Dates have ambiguous formats.
- Different currencies are present.
- The analytical result is presented without evidence.

For example, consider the question:

> **"Which city generated the highest?"**

The system cannot safely assume what "highest" means.

It could mean:

- Highest revenue
- Highest quantity
- Highest number of transactions

Instead of guessing, our system identifies the ambiguity and can request clarification.

---

# 💡 Our Solution

Proof-Carrying Data Analyst introduces an **Ambiguity Negotiator** and a verification-driven analysis pipeline.

The system follows this workflow:

```text
                    USER QUESTION
                          │
                          ▼
              ┌──────────────────────┐
              │  Ambiguity Detection │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Ambiguity Impact     │
              │ Score                │
              └──────────┬───────────┘
                         │
                ┌────────┴────────┐
                │                 │
        Material Ambiguity    Clear Question
                │                 │
                ▼                 ▼
        Ask Clarification    Data Analysis
                                  │
                                  ▼
                         ┌────────────────┐
                         │ Verification   │
                         └───────┬────────┘
                                 │
                                 ▼
                         ┌────────────────┐
                         │ Proof /        │
                         │ Evidence       │
                         └───────┬────────┘
                                 │
                                 ▼
                         ┌────────────────┐
                         │ Store History  │
                         └───────┬────────┘
                                 │
                                 ▼
                         INTERACTIVE
                           DASHBOARD
