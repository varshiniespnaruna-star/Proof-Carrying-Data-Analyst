import sqlite3
import os
from datetime import datetime


DATABASE_FOLDER = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "database"
)

DATABASE_PATH = os.path.join(
    DATABASE_FOLDER,
    "analysis_history.db"
)


def get_connection():
    os.makedirs(DATABASE_FOLDER, exist_ok=True)

    return sqlite3.connect(DATABASE_PATH)


def initialize_database():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            question TEXT NOT NULL,
            answer TEXT,
            status TEXT NOT NULL,
            confidence REAL,
            ambiguities TEXT,
            evidence TEXT
        )
    """)

    connection.commit()
    connection.close()


def save_analysis(
    question,
    answer,
    status,
    confidence=0.0,
    ambiguities="",
    evidence=""
):

    connection = get_connection()
    cursor = connection.cursor()

    timestamp = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    cursor.execute("""
        INSERT INTO analyses
        (
            timestamp,
            question,
            answer,
            status,
            confidence,
            ambiguities,
            evidence
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        timestamp,
        question,
        answer,
        status,
        confidence,
        ambiguities,
        evidence
    ))

    connection.commit()
    analysis_id = cursor.lastrowid

    connection.close()

    return analysis_id


def get_all_analyses():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            id,
            timestamp,
            question,
            answer,
            status,
            confidence,
            ambiguities,
            evidence
        FROM analyses
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    connection.close()

    return rows


if __name__ == "__main__":

   if __name__ == "__main__":
    initialize_database()

    analysis_id = save_analysis(
        question="Which city generated the highest revenue?",
        answer="Coimbatore - INR 77,300",
        status="Verified",
        confidence=1.0,
        ambiguities="Duplicate transaction detected and removed",
        evidence="Executed analysis_engine.py successfully"
    )

    print("=" * 60)
    print("DATABASE TEST")
    print("=" * 60)
    print("Analysis saved successfully!")
    print("Analysis ID:", analysis_id)
    print("=" * 60)