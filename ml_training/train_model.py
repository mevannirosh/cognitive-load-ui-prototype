from pathlib import Path
import json
import warnings

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    ConfusionMatrixDisplay,
)
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC


warnings.filterwarnings("ignore")


PROJECT_ROOT = Path(__file__).resolve().parents[1]

DATASET_PATH = PROJECT_ROOT / "datasets" / "synthetic_interaction_dataset.csv"
ARTIFACT_DIR = PROJECT_ROOT / "ml_training" / "model_artifacts"

MODEL_PATH = ARTIFACT_DIR / "cognitive_load_model.joblib"
METADATA_PATH = ARTIFACT_DIR / "model_metadata.json"
REPORT_JSON_PATH = ARTIFACT_DIR / "model_report.json"
REPORT_TXT_PATH = ARTIFACT_DIR / "classification_report.txt"
CONFUSION_MATRIX_PATH = ARTIFACT_DIR / "confusion_matrix.png"
FEATURE_IMPORTANCE_PATH = ARTIFACT_DIR / "feature_importance.csv"


FEATURE_COLUMNS = [
    "clickRatePerMin",
    "repeatedClickCount",
    "scrollCount",
    "scrollDirectionChanges",
    "avgPointerSpeed",
    "keyPressCount",
    "navigationCount",
    "avgHesitationMs",
    "maxHesitationMs",
    "durationSec",
]

LABEL_COLUMN = "label"
EXPECTED_LABELS = ["low", "medium", "high"]
RANDOM_STATE = 42


def load_dataset() -> pd.DataFrame:
    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found at {DATASET_PATH}. "
            "Run: npm run generate:synthetic"
        )

    df = pd.read_csv(DATASET_PATH)

    required_columns = FEATURE_COLUMNS + [LABEL_COLUMN]
    missing_columns = [col for col in required_columns if col not in df.columns]

    if missing_columns:
        raise ValueError(f"Dataset is missing required columns: {missing_columns}")

    df = df.dropna(subset=[LABEL_COLUMN]).copy()
    df[LABEL_COLUMN] = df[LABEL_COLUMN].astype(str).str.lower().str.strip()

    invalid_labels = sorted(set(df[LABEL_COLUMN]) - set(EXPECTED_LABELS))
    if invalid_labels:
        raise ValueError(f"Invalid labels found in dataset: {invalid_labels}")

    for col in FEATURE_COLUMNS:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    return df


def build_candidate_models():
    return {
        "random_forest": Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                (
                    "model",
                    RandomForestClassifier(
                        n_estimators=300,
                        min_samples_leaf=2,
                        class_weight="balanced",
                        random_state=RANDOM_STATE,
                        n_jobs=-1,
                    ),
                ),
            ]
        ),
        "gradient_boosting": Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                (
                    "model",
                    GradientBoostingClassifier(
                        random_state=RANDOM_STATE,
                    ),
                ),
            ]
        ),
        "svm_rbf": Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
                (
                    "model",
                    SVC(
                        kernel="rbf",
                        probability=True,
                        class_weight="balanced",
                        random_state=RANDOM_STATE,
                    ),
                ),
            ]
        ),
        "logistic_regression": Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
                (
                    "model",
                    LogisticRegression(
                        max_iter=2000,
                        class_weight="balanced",
                        random_state=RANDOM_STATE,
                    ),
                ),
            ]
        ),
    }


def evaluate_model(model, X_test, y_test):
    y_pred = model.predict(X_test)

    return {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision_macro": float(
            precision_score(y_test, y_pred, average="macro", zero_division=0)
        ),
        "recall_macro": float(
            recall_score(y_test, y_pred, average="macro", zero_division=0)
        ),
        "f1_macro": float(
            f1_score(y_test, y_pred, average="macro", zero_division=0)
        ),
        "classification_report": classification_report(
            y_test,
            y_pred,
            labels=EXPECTED_LABELS,
            zero_division=0,
        ),
        "confusion_matrix": confusion_matrix(
            y_test,
            y_pred,
            labels=EXPECTED_LABELS,
        ).tolist(),
    }


def save_confusion_matrix(model, X_test, y_test):
    y_pred = model.predict(X_test)
    matrix = confusion_matrix(y_test, y_pred, labels=EXPECTED_LABELS)

    display = ConfusionMatrixDisplay(
        confusion_matrix=matrix,
        display_labels=EXPECTED_LABELS,
    )

    fig, ax = plt.subplots(figsize=(6, 5))
    display.plot(ax=ax, values_format="d")
    plt.title("Cognitive Load Classification Confusion Matrix")
    plt.tight_layout()
    plt.savefig(CONFUSION_MATRIX_PATH, dpi=200)
    plt.close()


def save_feature_importance(model):
    final_model = model.named_steps.get("model")

    if hasattr(final_model, "feature_importances_"):
        importance_values = final_model.feature_importances_

        importance_df = pd.DataFrame(
            {
                "feature": FEATURE_COLUMNS,
                "importance": importance_values,
            }
        ).sort_values(by="importance", ascending=False)

        importance_df.to_csv(FEATURE_IMPORTANCE_PATH, index=False)
        return importance_df.to_dict(orient="records")

    if hasattr(final_model, "coef_"):
        coefficients = np.mean(np.abs(final_model.coef_), axis=0)

        importance_df = pd.DataFrame(
            {
                "feature": FEATURE_COLUMNS,
                "importance": coefficients,
            }
        ).sort_values(by="importance", ascending=False)

        importance_df.to_csv(FEATURE_IMPORTANCE_PATH, index=False)
        return importance_df.to_dict(orient="records")

    pd.DataFrame(columns=["feature", "importance"]).to_csv(
        FEATURE_IMPORTANCE_PATH,
        index=False,
    )
    return []


def main():
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    df = load_dataset()

    X = df[FEATURE_COLUMNS]
    y = df[LABEL_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        stratify=y,
        random_state=RANDOM_STATE,
    )

    candidate_models = build_candidate_models()
    model_results = {}

    print("\nTraining candidate models...\n")

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

    best_model_name = None
    best_model = None
    best_score = -1

    for model_name, model in candidate_models.items():
        model.fit(X_train, y_train)

        evaluation = evaluate_model(model, X_test, y_test)

        cv_scores = cross_val_score(
            model,
            X,
            y,
            cv=cv,
            scoring="f1_macro",
            n_jobs=-1,
        )

        evaluation["cross_validation_f1_macro_mean"] = float(np.mean(cv_scores))
        evaluation["cross_validation_f1_macro_std"] = float(np.std(cv_scores))

        model_results[model_name] = evaluation

        print(
            f"{model_name}: "
            f"accuracy={evaluation['accuracy']:.4f}, "
            f"f1_macro={evaluation['f1_macro']:.4f}, "
            f"cv_f1={evaluation['cross_validation_f1_macro_mean']:.4f}"
        )

        if evaluation["f1_macro"] > best_score:
            best_score = evaluation["f1_macro"]
            best_model_name = model_name
            best_model = model

    if best_model is None:
        raise RuntimeError("No model was trained successfully.")

    print(f"\nBest model selected: {best_model_name}\n")

    best_evaluation = model_results[best_model_name]

    feature_importance = save_feature_importance(best_model)
    save_confusion_matrix(best_model, X_test, y_test)

    joblib.dump(best_model, MODEL_PATH)

    metadata = {
        "model_name": best_model_name,
        "model_path": str(MODEL_PATH),
        "dataset_path": str(DATASET_PATH),
        "feature_columns": FEATURE_COLUMNS,
        "label_column": LABEL_COLUMN,
        "labels": EXPECTED_LABELS,
        "random_state": RANDOM_STATE,
        "training_rows": int(len(X_train)),
        "testing_rows": int(len(X_test)),
        "total_rows": int(len(df)),
        "best_model_metrics": {
            "accuracy": best_evaluation["accuracy"],
            "precision_macro": best_evaluation["precision_macro"],
            "recall_macro": best_evaluation["recall_macro"],
            "f1_macro": best_evaluation["f1_macro"],
            "cross_validation_f1_macro_mean": best_evaluation[
                "cross_validation_f1_macro_mean"
            ],
            "cross_validation_f1_macro_std": best_evaluation[
                "cross_validation_f1_macro_std"
            ],
        },
    }

    report = {
        "best_model": best_model_name,
        "best_model_metrics": metadata["best_model_metrics"],
        "all_model_results": model_results,
        "feature_importance": feature_importance,
    }

    with open(METADATA_PATH, "w", encoding="utf-8") as file:
        json.dump(metadata, file, indent=2)

    with open(REPORT_JSON_PATH, "w", encoding="utf-8") as file:
        json.dump(report, file, indent=2)

    with open(REPORT_TXT_PATH, "w", encoding="utf-8") as file:
        file.write(f"Best Model: {best_model_name}\n\n")
        file.write(best_evaluation["classification_report"])

    print("Training completed successfully.")
    print(f"Saved model: {MODEL_PATH}")
    print(f"Saved metadata: {METADATA_PATH}")
    print(f"Saved report: {REPORT_JSON_PATH}")
    print(f"Saved confusion matrix: {CONFUSION_MATRIX_PATH}")
    print(f"Saved feature importance: {FEATURE_IMPORTANCE_PATH}")


if __name__ == "__main__":
    main()