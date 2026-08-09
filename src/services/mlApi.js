const DEFAULT_API_URL = "http://127.0.0.1:8000/api/v1";

const ML_API_URL = (
  import.meta.env.VITE_ML_API_URL || DEFAULT_API_URL
).replace(/\/$/, "");

export class MlApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);

    this.name = "MlApiError";
    this.status = status;
    this.details = details;
  }
}

async function apiRequest(
  path,
  {
    method = "GET",
    body,
    signal,
    timeoutMs = 10000,
  } = {}
) {
  const controller = new AbortController();

  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const handleExternalAbort = () => {
    controller.abort();
  };

  if (signal) {
    signal.addEventListener(
      "abort",
      handleExternalAbort
    );
  }

  try {
    const response = await fetch(
      `${ML_API_URL}${path}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body:
          body !== undefined
            ? JSON.stringify(body)
            : undefined,
        signal: controller.signal,
      }
    );

    const rawText = await response.text();

    let payload = null;

    if (rawText) {
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = {
          detail: rawText,
        };
      }
    }

    if (!response.ok) {
      throw new MlApiError(
        payload?.detail ||
          `ML API request failed with status ${response.status}.`,
        response.status,
        payload
      );
    }

    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new MlApiError(
        "ML API request timed out or was cancelled.",
        0
      );
    }

    if (error instanceof MlApiError) {
      throw error;
    }

    throw new MlApiError(
      "Unable to connect to the ML inference API.",
      0,
      error
    );
  } finally {
    window.clearTimeout(timeoutId);

    if (signal) {
      signal.removeEventListener(
        "abort",
        handleExternalAbort
      );
    }
  }
}

export function checkMlApiHealth(options = {}) {
  return apiRequest("/health", options);
}

export function getMlModelInfo(options = {}) {
  return apiRequest("/model", options);
}

export function predictCognitiveLoad({
  sessionId,
  features,
  signal,
}) {
  return apiRequest("/predict", {
    method: "POST",
    signal,
    body: {
      sessionId,
      features,
    },
  });
}