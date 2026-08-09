from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


LoadLabel = Literal["low", "medium", "high"]


class FeatureVector(BaseModel):
    """
    ML-ready interaction features received from the React application.
    """

    model_config = ConfigDict(
        extra="forbid",
        allow_inf_nan=False,
    )

    clickRatePerMin: float = Field(ge=0)
    repeatedClickCount: int = Field(ge=0)
    scrollCount: int = Field(ge=0)
    scrollDirectionChanges: int = Field(ge=0)
    avgPointerSpeed: float = Field(ge=0)
    keyPressCount: int = Field(ge=0)
    navigationCount: int = Field(ge=0)
    avgHesitationMs: float = Field(ge=0)
    maxHesitationMs: float = Field(ge=0)
    durationSec: float = Field(ge=0)


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sessionId: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    features: FeatureVector


class BatchPredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PredictionRequest] = Field(
        min_length=1,
        max_length=100,
    )


class AdaptationRecommendation(BaseModel):
    summary: str
    actions: list[str]


class PredictionResponse(BaseModel):
    requestId: str
    sessionId: str | None

    predictedLoad: LoadLabel
    confidence: float
    probabilities: dict[str, float]

    adaptation: AdaptationRecommendation
    featuresUsed: dict[str, float | int]

    modelName: str
    modelVersion: str
    predictedAt: str


class BatchPredictionResponse(BaseModel):
    predictions: list[PredictionResponse]


class HealthResponse(BaseModel):
    status: Literal["healthy", "unhealthy"]
    modelLoaded: bool
    modelName: str | None
    modelVersion: str | None
    apiVersion: str


class ModelInfoResponse(BaseModel):
    modelName: str
    modelVersion: str
    featureColumns: list[str]
    labels: list[str]
    loadedAt: str