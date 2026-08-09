export function getLoadLabel(load) {
  if (load === "low") return "Low Cognitive Load";
  if (load === "medium") return "Medium Cognitive Load";
  return "High Cognitive Load";
}

export function getLoadColor(load) {
  if (load === "low") return "success";
  if (load === "medium") return "warning";
  return "error";
}

export function getLoadReason(load) {
  if (load === "low") {
    return "User behaviour appears smooth, confident, and efficient.";
  }

  if (load === "medium") {
    return "User may need light guidance due to moderate hesitation or processing effort.";
  }

  return "User may be overloaded due to hesitation, repeated actions, or complex navigation.";
}

export function getAdaptationSummary(load, adaptiveMode) {
  if (!adaptiveMode) {
    return "Adaptive mode is OFF. The interface remains static.";
  }

  if (load === "low") {
    return "Adaptive mode is ON. Full interface and advanced options are available.";
  }

  if (load === "medium") {
    return "Adaptive mode is ON. Important actions are highlighted and light guidance is shown.";
  }

  return "Adaptive mode is ON. The interface is simplified to reduce cognitive overload.";
}

export function createLogMessage(load, page, adaptiveMode) {
  if (!adaptiveMode) {
    return `Static interface shown on ${page}. No adaptation applied.`;
  }

  if (load === "low") {
    return `Low load on ${page}: rich interface and advanced options enabled.`;
  }

  if (load === "medium") {
    return `Medium load on ${page}: guidance and key highlights enabled.`;
  }

  return `High load on ${page}: simplified UI and reduced clutter enabled.`;
}