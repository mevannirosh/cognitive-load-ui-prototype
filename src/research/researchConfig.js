import {
  FEATURE_SET_VERSION,
} from "../ml/featureExtractor";

export const RESEARCH_CONFIG = {
  prototypeVersion: "1.0.0-pre-pilot",
  studyVersion: "pre-pilot",

  trackingVersion: "1.0.0",
  featureExtractionVersion:
    FEATURE_SET_VERSION,

  adaptationRulesVersion: "1.0.0",

  nasaTlxVersion: "RTLX-1.0",
  nasaTlxMethod:
    "Raw NASA-TLX unweighted mean",

  inference: {
    predictionIntervalMs: 5000,
    minimumDurationSec: 15,
    confidenceThreshold: 0.6,
    requiredConsecutivePredictions: 2,
  },
};