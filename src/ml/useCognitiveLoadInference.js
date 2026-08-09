import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  checkMlApiHealth,
  predictCognitiveLoad,
} from "../services/mlApi";


const VALID_LOADS = [
  "low",
  "medium",
  "high",
];


function getMaximumProbability(probabilities = {}) {
  const values = Object.values(probabilities);

  if (values.length === 0) {
    return 0;
  }

  return Math.max(...values);
}


export default function useCognitiveLoadInference({
  sessionId,
  featureVector,
  enabled,
  predictionIntervalMs = 5000,
  minimumDurationSec = 15,
  confidenceThreshold = 0.6,
  requiredConsecutivePredictions = 2,
}) {
  const latestFeaturesRef = useRef(featureVector);
  const enabledRef = useRef(enabled);

  const inFlightRef = useRef(false);
  const requestControllerRef = useRef(null);

  const stableLoadRef = useRef(null);
  const candidateRef = useRef({
    label: null,
    count: 0,
  });

  const [apiHealth, setApiHealth] = useState({
    checked: false,
    healthy: false,
    modelName: null,
    modelVersion: null,
  });

  const [status, setStatus] = useState(
    enabled ? "warming-up" : "disabled"
  );

  const [stableLoad, setStableLoad] = useState(null);
  const [rawPrediction, setRawPrediction] = useState(null);

  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const [predictionCount, setPredictionCount] = useState(0);
  const [acceptedPredictionCount, setAcceptedPredictionCount] =
    useState(0);

  useEffect(() => {
    latestFeaturesRef.current = featureVector;
  }, [featureVector]);

  useEffect(() => {
    enabledRef.current = enabled;

    if (!enabled) {
      setStatus("disabled");
    } else if (!stableLoadRef.current) {
      setStatus("warming-up");
    }
  }, [enabled]);

  useEffect(() => {
    stableLoadRef.current = stableLoad;
  }, [stableLoad]);

  useEffect(() => {
    candidateRef.current = {
      label: null,
      count: 0,
    };

    stableLoadRef.current = null;

    setStableLoad(null);
    setRawPrediction(null);
    setLastUpdated(null);
    setError(null);
    setPredictionCount(0);
    setAcceptedPredictionCount(0);

    if (enabledRef.current) {
      setStatus("warming-up");
    }
  }, [sessionId]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;

    async function checkHealth() {
      try {
        const health = await checkMlApiHealth();

        if (cancelled) {
          return;
        }

        setApiHealth({
          checked: true,
          healthy:
            health.status === "healthy" &&
            health.modelLoaded,
          modelName: health.modelName,
          modelVersion: health.modelVersion,
        });

        setError(null);
      } catch (healthError) {
        if (cancelled) {
          return;
        }

        setApiHealth({
          checked: true,
          healthy: false,
          modelName: null,
          modelVersion: null,
        });

        setError(healthError.message);
        setStatus("error");
      }
    }

    checkHealth();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const applyPredictionStability = useCallback(
    (predictedLabel, confidence) => {
      if (!VALID_LOADS.includes(predictedLabel)) {
        return stableLoadRef.current;
      }

      if (confidence < confidenceThreshold) {
        candidateRef.current = {
          label: null,
          count: 0,
        };

        return stableLoadRef.current;
      }

      setAcceptedPredictionCount(
        (previous) => previous + 1
      );

      const currentStableLoad =
        stableLoadRef.current;

      if (!currentStableLoad) {
        stableLoadRef.current = predictedLabel;
        setStableLoad(predictedLabel);

        candidateRef.current = {
          label: null,
          count: 0,
        };

        return predictedLabel;
      }

      if (predictedLabel === currentStableLoad) {
        candidateRef.current = {
          label: null,
          count: 0,
        };

        return currentStableLoad;
      }

      if (
        candidateRef.current.label ===
        predictedLabel
      ) {
        candidateRef.current.count += 1;
      } else {
        candidateRef.current = {
          label: predictedLabel,
          count: 1,
        };
      }

      if (
        candidateRef.current.count >=
        requiredConsecutivePredictions
      ) {
        stableLoadRef.current = predictedLabel;
        setStableLoad(predictedLabel);

        candidateRef.current = {
          label: null,
          count: 0,
        };

        return predictedLabel;
      }

      return currentStableLoad;
    },
    [
      confidenceThreshold,
      requiredConsecutivePredictions,
    ]
  );

  const predictNow = useCallback(
    async (force = false) => {
      if (!enabledRef.current && !force) {
        setStatus("disabled");
        return null;
      }

      const features = latestFeaturesRef.current;

      if (!features) {
        setStatus("waiting-for-features");
        return null;
      }

      const duration = Number(
        features.durationSec || 0
      );

      if (
        !force &&
        duration < minimumDurationSec
      ) {
        setStatus("warming-up");
        return null;
      }

      if (inFlightRef.current) {
        return null;
      }

      inFlightRef.current = true;

      requestControllerRef.current?.abort();

      const controller = new AbortController();
      requestControllerRef.current = controller;

      setStatus("predicting");
      setError(null);

      try {
        const result =
          await predictCognitiveLoad({
            sessionId,
            features,
            signal: controller.signal,
          });

        const confidence =
          Number.isFinite(result.confidence)
            ? result.confidence
            : getMaximumProbability(
                result.probabilities
              );

        const normalizedResult = {
          ...result,
          confidence,
        };

        setRawPrediction(normalizedResult);
        setPredictionCount(
          (previous) => previous + 1
        );
        setLastUpdated(new Date());
        setApiHealth((previous) => ({
          ...previous,
          checked: true,
          healthy: true,
          modelName: result.modelName,
          modelVersion: result.modelVersion,
        }));

        if (
          confidence <
          confidenceThreshold
        ) {
          setStatus("low-confidence");

          applyPredictionStability(
            result.predictedLoad,
            confidence
          );

          return normalizedResult;
        }

        applyPredictionStability(
          result.predictedLoad,
          confidence
        );

        setStatus("ready");

        return normalizedResult;
      } catch (predictionError) {
        if (
          predictionError.message
            ?.toLowerCase()
            .includes("cancelled")
        ) {
          return null;
        }

        setError(predictionError.message);
        setStatus("error");

        setApiHealth((previous) => ({
          ...previous,
          checked: true,
          healthy: false,
        }));

        return null;
      } finally {
        inFlightRef.current = false;
      }
    },
    [
      applyPredictionStability,
      confidenceThreshold,
      minimumDurationSec,
      sessionId,
    ]
  );

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const initialTimeoutId = window.setTimeout(
      () => {
        predictNow(false);
      },
      1000
    );

    const intervalId = window.setInterval(
      () => {
        predictNow(false);
      },
      predictionIntervalMs
    );

    return () => {
      window.clearTimeout(initialTimeoutId);
      window.clearInterval(intervalId);

      requestControllerRef.current?.abort();
    };
  }, [
    enabled,
    predictionIntervalMs,
    predictNow,
  ]);

  return {
    apiHealth,
    status,

    stableLoad,
    rawPrediction,

    confidence:
      rawPrediction?.confidence || 0,

    probabilities:
      rawPrediction?.probabilities || {},

    adaptation:
      rawPrediction?.adaptation || null,

    lastUpdated,
    error,

    predictionCount,
    acceptedPredictionCount,

    predictNow,
  };
}