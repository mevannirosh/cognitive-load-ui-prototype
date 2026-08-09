from fastapi.testclient import TestClient

from backend.app.main import app


LOW_LOAD_FEATURES = {
    "clickRatePerMin": 9.5,
    "repeatedClickCount": 0,
    "scrollCount": 4,
    "scrollDirectionChanges": 1,
    "avgPointerSpeed": 610.3,
    "keyPressCount": 18,
    "navigationCount": 0,
    "avgHesitationMs": 520.8,
    "maxHesitationMs": 1600.2,
    "durationSec": 52.4,
}


def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/v1/health")

        assert response.status_code == 200

        payload = response.json()

        assert payload["status"] == "healthy"
        assert payload["modelLoaded"] is True


def test_model_info_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/v1/model")

        assert response.status_code == 200

        payload = response.json()

        assert payload["modelName"]
        assert payload["modelVersion"]
        assert len(payload["featureColumns"]) == 10


def test_prediction_endpoint():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/predict",
            json={
                "sessionId": "test-session-001",
                "features": LOW_LOAD_FEATURES,
            },
        )

        assert response.status_code == 200

        payload = response.json()

        assert payload["predictedLoad"] in [
            "low",
            "medium",
            "high",
        ]

        assert 0 <= payload["confidence"] <= 1
        assert payload["probabilities"]
        assert payload["adaptation"]["actions"]