from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .model_service import CognitiveLoadModelService
from .schemas import (
    BatchPredictionRequest,
    BatchPredictionResponse,
    HealthResponse,
    ModelInfoResponse,
    PredictionRequest,
    PredictionResponse,
)


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)

logger = logging.getLogger(__name__)

model_service = CognitiveLoadModelService(settings)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Load the trained ML model once when the API starts.
    """

    logger.info("Loading cognitive load model...")

    model_service.load()

    app.state.model_service = model_service

    logger.info(
        "Model loaded successfully: %s, version %s",
        model_service.model_name,
        model_service.model_version,
    )

    yield

    logger.info("Shutting down ML inference API.")


app = FastAPI(
    title="Cognitive Load Inference API",
    description=(
        "Predicts low, medium, or high cognitive load from "
        "non-intrusive web interaction features."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


def get_model_service(
    request: Request,
) -> CognitiveLoadModelService:
    service = getattr(
        request.app.state,
        "model_service",
        None,
    )

    if service is None or not service.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="ML model is currently unavailable.",
        )

    return service


@app.get("/")
def root():
    return {
        "name": "Cognitive Load Inference API",
        "version": "1.0.0",
        "documentation": "/docs",
    }


@app.get(
    f"{settings.api_prefix}/health",
    response_model=HealthResponse,
)
def health(request: Request):
    service = getattr(
        request.app.state,
        "model_service",
        None,
    )

    loaded = bool(service and service.is_loaded)

    return {
        "status": "healthy" if loaded else "unhealthy",
        "modelLoaded": loaded,
        "modelName": (
            service.model_name if loaded else None
        ),
        "modelVersion": (
            service.model_version if loaded else None
        ),
        "apiVersion": "1.0.0",
    }


@app.get(
    f"{settings.api_prefix}/model",
    response_model=ModelInfoResponse,
)
def model_info(request: Request):
    service = get_model_service(request)

    return service.get_model_info()


@app.post(
    f"{settings.api_prefix}/predict",
    response_model=PredictionResponse,
)
def predict(
    payload: PredictionRequest,
    request: Request,
):
    service = get_model_service(request)

    try:
        return service.predict(
            features=payload.features,
            session_id=payload.sessionId,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error

    except Exception as error:
        logger.exception("Prediction failed.")

        raise HTTPException(
            status_code=500,
            detail="Cognitive load prediction failed.",
        ) from error


@app.post(
    f"{settings.api_prefix}/predict/batch",
    response_model=BatchPredictionResponse,
)
def predict_batch(
    payload: BatchPredictionRequest,
    request: Request,
):
    service = get_model_service(request)

    predictions = []

    try:
        for item in payload.items:
            predictions.append(
                service.predict(
                    features=item.features,
                    session_id=item.sessionId,
                )
            )

        return {
            "predictions": predictions,
        }

    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error

    except Exception as error:
        logger.exception("Batch prediction failed.")

        raise HTTPException(
            status_code=500,
            detail="Batch cognitive load prediction failed.",
        ) from error