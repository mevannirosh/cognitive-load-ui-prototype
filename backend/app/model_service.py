from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

import hashlib
import json

import joblib
import pandas as pd

from .config import Settings
from .schemas import FeatureVector


DEFAULT_FEATURE_COLUMNS = [
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

VALID_LABELS = ["low", "medium", "high"]


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def calculate_file_hash(file_path: Path) -> str:
    sha256 = hashlib.sha256()

    with file_path.open("rb") as file:
        while chunk := file.read(1024 * 1024):
            sha256.update(chunk)

    return sha256.hexdigest()


def get_adaptation_recommendation(
    load_label: str,
) -> dict[str, Any]:
    if load_label == "low":
        return {
            "summary": (
                "The user appears comfortable. Full functionality and "
                "advanced interface elements can remain visible."
            ),
            "actions": [
                "Show advanced analytics",
                "Display detailed table columns",
                "Keep optional form fields visible",
                "Enable detailed content view",
            ],
        }

    if load_label == "medium":
        return {
            "summary": (
                "The user may need light assistance while the core "
                "interface remains available."
            ),
            "actions": [
                "Highlight important actions",
                "Show short contextual hints",
                "Prioritise essential information",
                "Reduce unnecessary secondary content",
            ],
        }

    return {
        "summary": (
            "The user may be experiencing cognitive overload. "
            "The interface should be simplified."
        ),
        "actions": [
            "Hide optional sections",
            "Reduce information density",
            "Show short summaries",
            "Display contextual guidance",
            "Delay non-critical notifications",
        ],
    }


class CognitiveLoadModelService:
    def __init__(self, settings: Settings):
        self.settings = settings

        self.model = None
        self.metadata: dict[str, Any] = {}

        self.feature_columns: list[str] = []
        self.labels: list[str] = []

        self.model_name: str | None = None
        self.model_version: str | None = None
        self.loaded_at: str | None = None

    @property
    def is_loaded(self) -> bool:
        return self.model is not None

    def load(self) -> None:
        if not self.settings.model_path.exists():
            raise FileNotFoundError(
                "Trained model not found at: "
                f"{self.settings.model_path}"
            )

        if not self.settings.metadata_path.exists():
            raise FileNotFoundError(
                "Model metadata not found at: "
                f"{self.settings.metadata_path}"
            )

        with self.settings.metadata_path.open(
            "r",
            encoding="utf-8",
        ) as file:
            self.metadata = json.load(file)

        metadata_features = self.metadata.get(
            "feature_columns",
            DEFAULT_FEATURE_COLUMNS,
        )

        missing_features = [
            feature
            for feature in DEFAULT_FEATURE_COLUMNS
            if feature not in metadata_features
        ]

        if missing_features:
            raise ValueError(
                "Model metadata is missing expected features: "
                f"{missing_features}"
            )

        # Only load model artifacts generated and trusted by this project.
        self.model = joblib.load(self.settings.model_path)

        self.feature_columns = list(metadata_features)
        self.labels = list(
            self.metadata.get("labels", VALID_LABELS)
        )

        self.model_name = self.metadata.get(
            "model_name",
            type(self.model).__name__,
        )

        full_hash = calculate_file_hash(
            self.settings.model_path
        )

        self.model_version = full_hash[:12]
        self.loaded_at = utc_now_iso()

    def get_model_classes(self) -> list[str]:
        if self.model is None:
            return []

        classes = getattr(self.model, "classes_", None)

        if classes is None and hasattr(
            self.model,
            "named_steps",
        ):
            final_estimator = self.model.named_steps.get("model")

            if final_estimator is not None:
                classes = getattr(
                    final_estimator,
                    "classes_",
                    None,
                )

        if classes is None:
            return self.labels

        return [str(label) for label in classes]

    def build_dataframe(
        self,
        features: FeatureVector,
    ) -> pd.DataFrame:
        feature_values = features.model_dump()

        missing_features = [
            feature
            for feature in self.feature_columns
            if feature not in feature_values
        ]

        if missing_features:
            raise ValueError(
                f"Missing model features: {missing_features}"
            )

        ordered_row = {
            feature: feature_values[feature]
            for feature in self.feature_columns
        }

        return pd.DataFrame(
            [ordered_row],
            columns=self.feature_columns,
        )

    def predict(
        self,
        features: FeatureVector,
        session_id: str | None = None,
    ) -> dict[str, Any]:
        if self.model is None:
            raise RuntimeError(
                "The cognitive load model is not loaded."
            )

        input_frame = self.build_dataframe(features)

        predicted_label = str(
            self.model.predict(input_frame)[0]
        ).lower()

        if predicted_label not in VALID_LABELS:
            raise ValueError(
                "Model returned an unsupported class: "
                f"{predicted_label}"
            )

        probabilities: dict[str, float] = {}
        confidence = 1.0

        if hasattr(self.model, "predict_proba"):
            probability_values = self.model.predict_proba(
                input_frame
            )[0]

            class_names = self.get_model_classes()

            probabilities = {
                class_names[index]: round(
                    float(probability),
                    6,
                )
                for index, probability in enumerate(
                    probability_values
                )
            }

            confidence = float(
                probabilities.get(
                    predicted_label,
                    max(probabilities.values()),
                )
            )

        else:
            probabilities = {
                label: 1.0 if label == predicted_label else 0.0
                for label in VALID_LABELS
            }

        return {
            "requestId": str(uuid4()),
            "sessionId": session_id,
            "predictedLoad": predicted_label,
            "confidence": round(confidence, 6),
            "probabilities": probabilities,
            "adaptation": get_adaptation_recommendation(
                predicted_label
            ),
            "featuresUsed": features.model_dump(),
            "modelName": self.model_name or "unknown",
            "modelVersion": self.model_version or "unknown",
            "predictedAt": utc_now_iso(),
        }

    def get_model_info(self) -> dict[str, Any]:
        if not self.is_loaded:
            raise RuntimeError(
                "The cognitive load model is not loaded."
            )

        return {
            "modelName": self.model_name,
            "modelVersion": self.model_version,
            "featureColumns": self.feature_columns,
            "labels": self.labels,
            "loadedAt": self.loaded_at,
        }