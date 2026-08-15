import React, {
  useEffect,
  useState,
} from "react";

import {
  CssBaseline,
  ThemeProvider,
} from "@mui/material";

import theme from "./theme";

import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";

import InformationSearch from "./pages/InformationSearch";

import ResearchEvaluation from "./pages/ResearchEvaluation";

import TaskForm from "./pages/TaskForm";

import useCognitiveLoadInference from "./ml/useCognitiveLoadInference";

import useInteractionTracker from "./tracking/useInteractionTracker";

import useResearchEvaluation from "./research/useResearchEvaluation";

import {
  RESEARCH_CONFIG,
} from "./research/researchConfig";

import {
  createLogMessage,
} from "./utils/adaptationUtils";


function createId() {
  if (
    window.crypto?.randomUUID
  ) {
    return (
      window.crypto.randomUUID()
    );
  }

  return `log-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}


export default function App() {
  const [
    activePage,
    setActivePage,
  ] = useState("dashboard");


  const [
    adaptiveMode,
    setAdaptiveMode,
  ] = useState(true);


  const [
    controlMode,
    setControlMode,
  ] = useState(
    "automatic"
  );


  const [
    manualLoad,
    setManualLoad,
  ] = useState("medium");


  const [
    cognitiveLoad,
    setCognitiveLoad,
  ] = useState("medium");


  const [
    logs,
    setLogs,
  ] = useState([]);


  const tracker =
    useInteractionTracker({
      activePage,
      adaptiveMode,
      cognitiveLoad,
    });


  const inference =
    useCognitiveLoadInference({
      sessionId:
        tracker.sessionId,

      featureVector:
        tracker.metrics
          ?.featureVector ||
        null,

      enabled:
        controlMode ===
        "automatic",

      predictionIntervalMs:
        RESEARCH_CONFIG
          .inference
          .predictionIntervalMs,

      minimumDurationSec:
        RESEARCH_CONFIG
          .inference
          .minimumDurationSec,

      confidenceThreshold:
        RESEARCH_CONFIG
          .inference
          .confidenceThreshold,

      requiredConsecutivePredictions:
        RESEARCH_CONFIG
          .inference
          .requiredConsecutivePredictions,
    });


  const addLog = (
    message,
    {
      load =
        cognitiveLoad,

      page =
        activePage,
    } = {}
  ) => {
    const now =
      new Date();

    setLogs(
      (previous) => [
        {
          id:
            createId(),

          timestamp:
            now.toISOString(),

          time:
            now.toLocaleTimeString(),

          load,
          page,
          message,
        },

        ...previous.slice(
          0,
          99
        ),
      ]
    );
  };


  const research =
    useResearchEvaluation({
      tracker,
      inference,

      logs,

      setActivePage,

      setAdaptiveMode,
      setControlMode,
    });


  useEffect(() => {
    if (
      controlMode ===
      "manual"
    ) {
      setCognitiveLoad(
        manualLoad
      );

      return;
    }

    if (
      inference.stableLoad
    ) {
      setCognitiveLoad(
        inference.stableLoad
      );
    }
  }, [
    controlMode,
    manualLoad,
    inference.stableLoad,
  ]);


  useEffect(() => {
    addLog(
      createLogMessage(
        cognitiveLoad,
        activePage,
        adaptiveMode
      )
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activePage,
    adaptiveMode,
    cognitiveLoad,
  ]);


  useEffect(() => {
    if (
      controlMode !==
        "automatic" ||
      !inference.lastUpdated ||
      !inference.rawPrediction
    ) {
      return;
    }

    const prediction =
      inference
        .rawPrediction;

    addLog(
      `ML predicted ${prediction.predictedLoad.toUpperCase()} load with ${Math.round(
        prediction.confidence *
          100
      )}% confidence.`,

      {
        load:
          prediction
            .predictedLoad,
      }
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    inference.lastUpdated,
  ]);


  const commonProps = {
  adaptiveMode,
  cognitiveLoad,
  addLog,

  researchMode:
    research.phase === "running",

  recordInteractionEvent:
    tracker.recordCustomEvent,
};  


  function renderPage() {
    switch (activePage) {
      case "dashboard":
        return (
          <Dashboard
            {...commonProps}
          />
        );

      case "form":
        return (
          <TaskForm
            {...commonProps}
          />
        );

      case "info":
        return (
          <InformationSearch
            {...commonProps}
          />
        );

      case "research":
        return (
          <ResearchEvaluation
            research={
              research
            }
          />
        );

      default:
        return (
          <Dashboard
            {...commonProps}
          />
        );
    }
  }


  return (
    <ThemeProvider
      theme={theme}
    >
      <CssBaseline />

      <Layout
        activePage={
          activePage
        }

        setActivePage={
          setActivePage
        }

        adaptiveMode={
          adaptiveMode
        }

        setAdaptiveMode={
          setAdaptiveMode
        }

        controlMode={
          controlMode
        }

        setControlMode={
          setControlMode
        }

        manualLoad={
          manualLoad
        }

        setManualLoad={
          setManualLoad
        }

        cognitiveLoad={
          cognitiveLoad
        }

        logs={logs}

        tracker={
          tracker
        }

        inference={
          inference
        }

        research={
          research
        }
      >
        {renderPage()}
      </Layout>
    </ThemeProvider>
  );
}