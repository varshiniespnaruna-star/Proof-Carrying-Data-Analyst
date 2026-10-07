from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from database import initialize_database, save_analysis, get_all_analyses
from ambiguity_detector import detect_ambiguities, ambiguity_impact_score
from verifier import verify_analysis
from analysis_engine import highest_revenue_city
from data_profiler import profile_folder
import os

app = Flask(
    __name__,
    static_folder="../frontend",
    static_url_path=""
)
CORS(app)
@app.route("/api/quality", methods=["GET"])
def quality():

    data_folder = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "data"
    )

    profiles = profile_folder(data_folder)

    return jsonify(profiles)

initialize_database()

@app.route("/")
def home():
    return send_from_directory(
        "../frontend",
        "index.html"
    )

@app.route("/api/history", methods=["GET"])
def history():

    rows = get_all_analyses()

    analyses = []

    for row in rows:
        analyses.append({
            "id": row[0],
            "timestamp": row[1],
            "question": row[2],
            "answer": row[3],
            "status": row[4],
            "confidence": row[5],
            "ambiguities": row[6],
            "evidence": row[7]
        })

    return jsonify(analyses)



@app.route("/api/analyze", methods=["POST"])
def analyze():

    data = request.get_json()

    if not data or "question" not in data:
        return jsonify({
            "error": "Question is required"
        }), 400

    question = data["question"]

    # Step 1: Detect ambiguities
    ambiguities = detect_ambiguities(question)

    impact_score = ambiguity_impact_score(ambiguities)

    # Step 2: Ask for clarification if ambiguity is material
    if impact_score >= 3:

        ambiguity_text = "; ".join(
            item["message"]
            for item in ambiguities
        )

        analysis_id = save_analysis(
            question=question,
            answer="Clarification required",
            status="Needs clarification",
            confidence=0.0,
            ambiguities=ambiguity_text,
            evidence="Analysis stopped before calculation."
        )

        return jsonify({
            "analysis_id": analysis_id,
            "status": "Needs clarification",
            "question": question,
            "ambiguities": ambiguities,
            "impact_score": impact_score
        })

    # Step 3: Verify the analysis engine
    verification = verify_analysis()

    if not verification["verified"]:

        analysis_id = save_analysis(
            question=question,
            answer="Analysis failed",
            status="Failed",
            confidence=0.0,
            ambiguities=str(ambiguities),
            evidence=verification.get("output", "")
        )

        return jsonify({
            "analysis_id": analysis_id,
            "status": "Failed",
            "message": verification["message"]
        }), 500

    # Step 4: Calculate the real answer
    analysis_result = highest_revenue_city()

    answer = (
        f"{analysis_result['answer']} - "
        f"{analysis_result['currency']} "
        f"{analysis_result['revenue']:,.0f}"
    )

    # Step 5: Save verified result
    analysis_id = save_analysis(
        question=question,
        answer=answer,
        status="Verified",
        confidence=1.0,
        ambiguities=str(ambiguities),
        evidence=verification["output"]
    )

    # Step 6: Return result to frontend
    return jsonify({
        "analysis_id": analysis_id,
        "status": "Verified",
        "question": question,
        "answer": answer,
        "confidence": 1.0,
        "ambiguities": ambiguities,
        "proof": verification["output"]
    })

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )