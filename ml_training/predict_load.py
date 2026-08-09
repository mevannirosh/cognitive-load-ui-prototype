from pathlib import Path
import argparse
import json
import sys

import joblib
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ARTIFACT_DIR = PROJECT_ROOT / "ml_training" / "model_artifacts"

MODEL_PATH = ARTIFACT_DIR / "cognitive_load_model.joblib"
METADATA_PATH = ARTIFACT_DIR / "model_metadata.json"


def load_artifacts():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. Run: python ml_training/train_model.py"
        )

    if not METADATA_PATH.exists():
        raise FileNotFoundError(
            f"Metadata not found at {METADATA_PATH}. Run: python ml_training/train_model.py"
        )

    model = joblib.load(MODEL_PATH)

    with open(METADATA_PATH, "r", encoding="utf-8") as file:
        metadata = json.load(file)

    return model, metadata


def load_input(json_string=None, file_path=None):
    if json_string:
        return json.loads(json_string)

    if file_path:
        with open(file_path, "r", encoding="utf-8") as file:
            return json.load(file)

    raise ValueError("Provide either --json or --file input.")


def build_dataframe(input_data, feature_columns):
    missing = [feature for feature in feature_columns if feature not in input_data]

    if missing:
        raise ValueError(f"Missing required feature(s): {missing}")

    row = {feature: input_data[feature] for feature in feature_columns}
    return pd.DataFrame([row])


def get_adaptation_recommendation(load_label):
    if load_label == "low":
        return {
            "summary": "Show full interface and advanced options.",
            "actions": [
                "Show advanced analytics",
                "Display detailed table columns",
                "Keep optional fields visible",
                "Enable rich content view",
            ],
        }

    if load_label == "medium":
        return {
            "summary": "Provide light guidance while keeping the interface mostly unchanged.",
            "actions": [
                "Highlight important actions",
                "Show short hints",
                "Keep core interface visible",
                "Avoid unnecessary extra content",
            ],
        }

    return {
        "summary": "Simplify the interface to reduce cognitive overload.",
        "actions": [
            "Hide optional sections",
            "Reduce information density",
            "Show summaries",
            "Display contextual guidance",
            "Delay non-critical notifications",
        ],
    }


def predict(input_data):
    model, metadata = load_artifacts()

    feature_columns = metadata["feature_columns"]
    input_df = build_dataframe(input_data, feature_columns)

    predicted_label = model.predict(input_df)[0]

    probabilities = {}

    if hasattr(model, "predict_proba"):
        probability_values = model.predict_proba(input_df)[0]
        classes = list(model.classes_)

        probabilities = {
            str(label): float(probability_values[index])
            for index, label in enumerate(classes)
        }

    response = {
        "predictedLoad": predicted_label,
        "probabilities": probabilities,
        "adaptation": get_adaptation_recommendation(predicted_label),
        "featuresUsed": input_data,
    }

    return response


def main():
    parser = argparse.ArgumentParser(description="Predict cognitive load level.")
    parser.add_argument("--json", type=str, help="JSON string containing feature values.")
    parser.add_argument("--file", type=str, help="Path to JSON feature file.")

    args = parser.parse_args()

    try:
        input_data = load_input(json_string=args.json, file_path=args.file)
        result = predict(input_data)

        print(json.dumps(result, indent=2))

    except Exception as error:
        print(f"Prediction failed: {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()