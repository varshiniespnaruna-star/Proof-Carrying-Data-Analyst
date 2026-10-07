import subprocess
import sys
import os


def verify_analysis():

    project_folder = os.path.dirname(
        os.path.dirname(__file__)
    )

    script_path = os.path.join(
        project_folder,
        "backend",
        "analysis_engine.py"
    )

    try:
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode != 0:
            return {
                "verified": False,
                "message": "Analysis execution failed.",
                "output": result.stderr
            }

        output = result.stdout

        # Check that the expected proof information
        # was actually produced by the executed program.
        required_items = [
            "ANALYSIS RESULT",
            "Answer:",
            "Revenue:",
            "Duplicate transactions removed:",
            "Revenue by City:"
        ]

        missing_items = [
            item for item in required_items
            if item not in output
        ]

        if missing_items:
            return {
                "verified": False,
                "message": "Verification failed. Required evidence is missing.",
                "missing_items": missing_items,
                "output": output
            }

        return {
            "verified": True,
            "message": "Analysis executed successfully and evidence was produced.",
            "output": output
        }

    except subprocess.TimeoutExpired:
        return {
            "verified": False,
            "message": "Analysis timed out."
        }

    except Exception as error:
        return {
            "verified": False,
            "message": str(error)
        }


if __name__ == "__main__":

    verification = verify_analysis()

    print("\n" + "=" * 60)
    print("PROOF VERIFICATION")
    print("=" * 60)

    print("\nVerified:", verification["verified"])
    print("Status:", verification["message"])

    if verification["verified"]:
        print("\nProof-carrying answer confirmed.")
        print("\nExecuted Evidence:")
        print(verification["output"])

    else:
        print("\nVerification failed.")

        if "missing_items" in verification:
            print("Missing:", verification["missing_items"])

        if "output" in verification:
            print(verification["output"])

    print("=" * 60)
    