from dataclasses import dataclass
from pathlib import Path
import os

from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parents[2]

load_dotenv(PROJECT_ROOT / ".env.backend")


def resolve_project_path(
    configured_path: str | None,
    default_path: str,
) -> Path:
    """
    Resolve a configured path relative to the project root.

    Absolute paths are preserved.
    """

    path = Path(configured_path or default_path)

    if not path.is_absolute():
        path = PROJECT_ROOT / path

    return path.resolve()


def parse_origins(raw_origins: str | None) -> list[str]:
    if not raw_origins:
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]

    return [
        origin.strip()
        for origin in raw_origins.split(",")
        if origin.strip()
    ]


@dataclass(frozen=True)
class Settings:
    project_root: Path
    model_path: Path
    metadata_path: Path
    allowed_origins: list[str]
    api_host: str
    api_port: int
    api_prefix: str = "/api/v1"


settings = Settings(
    project_root=PROJECT_ROOT,
    model_path=resolve_project_path(
        os.getenv("MODEL_PATH"),
        "ml_training/model_artifacts/cognitive_load_model.joblib",
    ),
    metadata_path=resolve_project_path(
        os.getenv("MODEL_METADATA_PATH"),
        "ml_training/model_artifacts/model_metadata.json",
    ),
    allowed_origins=parse_origins(os.getenv("ALLOWED_ORIGINS")),
    api_host=os.getenv("API_HOST", "127.0.0.1"),
    api_port=int(os.getenv("API_PORT", "8000")),
)