import {
  useCallback,
  useState,
} from "react";

import {
  getResearchTask,
} from "./researchTasks";

import {
  RESEARCH_CONFIG,
} from "./researchConfig";

import {
  saveTrialLocally,
} from "./researchStorage";

import {
  saveResearchTrialRemote,
} from "../services/researchApi";


function createId() {
  if (
    window.crypto?.randomUUID
  ) {
    return (
      window.crypto.randomUUID()
    );
  }

  return `trial-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}


function secondsBetween(
  start,
  end
) {
  return Number(
    (
      (
        new Date(end).getTime() -
        new Date(start).getTime()
      ) /
      1000
    ).toFixed(2)
  );
}


function summarisePredictions(
  predictions
) {
  const valid =
    predictions.filter(
      (prediction) =>
        [
          "low",
          "medium",
          "high",
        ].includes(
          prediction.predictedLoad
        )
    );

  const counts = {
    low: 0,
    medium: 0,
    high: 0,
  };

  let confidenceTotal = 0;

  valid.forEach(
    (prediction) => {
      counts[
        prediction.predictedLoad
      ] += 1;

      confidenceTotal +=
        Number(
          prediction.confidence ||
          0
        );
    }
  );

  const majority =
    Object.entries(counts)
      .sort(
        (a, b) =>
          b[1] - a[1]
      )[0];

  return {
    totalPredictions:
      valid.length,

    lowCount:
      counts.low,

    mediumCount:
      counts.medium,

    highCount:
      counts.high,

    majorityPrediction:
      valid.length
        ? majority[0]
        : null,

    averageConfidence:
      valid.length
        ? Number(
          (
            confidenceTotal /
            valid.length
          ).toFixed(4)
        )
        : null,
  };
}


function calculateRawNasaTlx(
  scores
) {
  const values = [
    scores.mentalDemand,
    scores.physicalDemand,
    scores.temporalDemand,
    scores.performance,
    scores.effort,
    scores.frustration,
  ];

  const total =
    values.reduce(
      (sum, value) =>
        sum + Number(value),
      0
    );

  return Number(
    (
      total /
      values.length
    ).toFixed(2)
  );
}


export default function useResearchEvaluation({
  tracker,
  inference,

  logs,

  setActivePage,

  setAdaptiveMode,
  setControlMode,
}) {
  const [
    phase,
    setPhase,
  ] = useState("idle");


  const [
    currentTrial,
    setCurrentTrial,
  ] = useState(null);


  const [
    pendingTrial,
    setPendingTrial,
  ] = useState(null);


  const [
    lastCompletedTrial,
    setLastCompletedTrial,
  ] = useState(null);


  const [
    saveStatus,
    setSaveStatus,
  ] = useState("idle");


  const [
    saveError,
    setSaveError,
  ] = useState(null);


  const startTrial =
    useCallback(
      ({
        participantId,
        taskId,
        condition,
      }) => {
        const cleanParticipantId =
          participantId
            .trim()
            .toUpperCase();

        if (!cleanParticipantId) {
          throw new Error(
            "Participant ID is required."
          );
        }

        const task =
          getResearchTask(
            taskId
          );

        if (!task) {
          throw new Error(
            "Invalid research task."
          );
        }

        if (
          ![
            "adaptive",
            "non_adaptive",
          ].includes(condition)
        ) {
          throw new Error(
            "Invalid study condition."
          );
        }

        const trackerSessionId =
          tracker.resetTracking();

        inference
          .resetInferenceSession();

        setControlMode(
          "automatic"
        );

        setAdaptiveMode(
          condition ===
          "adaptive"
        );

        const startedAt =
          new Date()
            .toISOString();

        const trial = {
          trialId:
            createId(),

          participantId:
            cleanParticipantId,

          taskId:
            task.id,

          taskSet:
            task.set,

          taskTitle:
            task.title,

          participantInstruction:
            task.participantInstruction,

          expectedDifficulty:
            task.expectedDifficulty,

          correctOutcome:
            task.correctOutcome,

          researcherCriteria:
            task.researcherCriteria,

          errorCriteria:
            task.errorCriteria,

          condition,

          trackerSessionId,

          startedAt,

          prototypeVersion:
            RESEARCH_CONFIG
              .prototypeVersion,

          studyVersion:
            RESEARCH_CONFIG
              .studyVersion,

          trackingVersion:
            RESEARCH_CONFIG
              .trackingVersion,

          featureExtractionVersion:
            RESEARCH_CONFIG
              .featureExtractionVersion,

          adaptationRulesVersion:
            RESEARCH_CONFIG
              .adaptationRulesVersion,

          nasaTlxVersion:
            RESEARCH_CONFIG
              .nasaTlxVersion,
        };

        tracker.recordCustomEvent(
          "research_trial_started",
          {
            trialId:
              trial.trialId,

            participantId:
              cleanParticipantId,

            taskId:
              task.id,

            condition,
          }
        );

        setPendingTrial(null);

        setCurrentTrial(
          trial
        );

        setSaveStatus("idle");
        setSaveError(null);

        setPhase("running");

        setActivePage(
          task.startPage
        );

        return trial;
      },
      [
        tracker,
        inference,
        setActivePage,
        setAdaptiveMode,
        setControlMode,
      ]
    );


  const finishTrial =
    useCallback(() => {
      if (!currentTrial) {
        return;
      }

      tracker.recordCustomEvent(
        "research_trial_finished",
        {
          trialId:
            currentTrial
              .trialId,
        }
      );

      const finalSnapshot =
        tracker.captureSnapshot();

      const interactionPayload =
        tracker.getExportPayload();

      const endedAt =
        new Date()
          .toISOString();

      const predictionHistory =
        [
          ...inference
            .predictionHistory,
        ];

      const predictionSummary =
        summarisePredictions(
          predictionHistory
        );

      const trialStartMs =
        new Date(
          currentTrial.startedAt
        ).getTime();

      const relevantLogs =
        logs.filter(
          (log) => {
            if (!log.timestamp) {
              return false;
            }

            return (
              new Date(
                log.timestamp
              ).getTime() >=
              trialStartMs
            );
          }
        );

      const completedTaskData = {
        ...currentTrial,

        endedAt,

        durationSec:
          secondsBetween(
            currentTrial
              .startedAt,
            endedAt
          ),

        model: {
          name:
            inference.apiHealth
              .modelName,

          version:
            inference.apiHealth
              .modelVersion,
        },

        interaction: {
          finalFeatureVector:
            finalSnapshot
              .featureVector,

          finalMetrics:
            finalSnapshot,

          events:
            interactionPayload
              .events,

          featureSnapshots:
            interactionPayload
              .featureSnapshots,
        },

        predictions: {
          summary:
            predictionSummary,

          history:
            predictionHistory,
        },

        adaptationEvents:
          relevantLogs,
      };

      setPendingTrial(
        completedTaskData
      );

      setCurrentTrial(null);

      setPhase(
        "outcome"
      );

      setActivePage(
        "research"
      );
    }, [
      currentTrial,
      tracker,
      inference,
      logs,
      setActivePage,
    ]);


  const submitOutcome =
    useCallback(
      ({
        taskSuccess,
        errorCount,
        researcherNotes,
      }) => {
        if (!pendingTrial) {
          return;
        }

        setPendingTrial(
          (previous) => ({
            ...previous,

            outcome: {
              taskSuccess,

              errorCount:
                Number(
                  errorCount
                ),

              researcherNotes:
                researcherNotes
                  ?.trim() || "",
            },
          })
        );

        setPhase("nasa");
      },
      [pendingTrial]
    );


  const submitNasaTlx =
    useCallback(
      async (scores) => {
        if (!pendingTrial) {
          return null;
        }

        const rawScore =
          calculateRawNasaTlx(
            scores
          );

        const finalRecord = {
          ...pendingTrial,

          nasaTlx: {
            ...scores,

            rawScore,

            method:
              RESEARCH_CONFIG
                .nasaTlxMethod,
          },

          status:
            "completed",

          completedAt:
            new Date()
              .toISOString(),
        };

        saveTrialLocally(
          finalRecord
        );

        setLastCompletedTrial(
          finalRecord
        );

        setPendingTrial(
          finalRecord
        );

        setSaveStatus(
          "saving"
        );

        setSaveError(null);

        try {
          await (
            saveResearchTrialRemote(
              finalRecord
            )
          );

          setSaveStatus(
            "saved"
          );
        } catch (error) {
          setSaveStatus(
            "local-only"
          );

          setSaveError(
            error.message
          );
        }

        setPhase(
          "complete"
        );

        return finalRecord;
      },
      [pendingTrial]
    );


  const startNextTrial =
    useCallback(() => {
      setCurrentTrial(null);
      setPendingTrial(null);

      setPhase("idle");

      setActivePage(
        "research"
      );
    }, [setActivePage]);


  const cancelTrial =
    useCallback(() => {
      tracker
        .resetTracking();

      inference
        .resetInferenceSession();

      setCurrentTrial(null);
      setPendingTrial(null);

      setPhase("idle");

      setActivePage(
        "research"
      );
    }, [
      tracker,
      inference,
      setActivePage,
    ]);


  const retryRemoteSave =
    useCallback(async () => {
      if (
        !lastCompletedTrial
      ) {
        return;
      }

      setSaveStatus(
        "saving"
      );

      setSaveError(null);

      try {
        await (
          saveResearchTrialRemote(
            lastCompletedTrial
          )
        );

        setSaveStatus(
          "saved"
        );
      } catch (error) {
        setSaveStatus(
          "local-only"
        );

        setSaveError(
          error.message
        );
      }
    }, [
      lastCompletedTrial,
    ]);


  return {
    phase,

    currentTrial,
    pendingTrial,

    lastCompletedTrial,

    saveStatus,
    saveError,

    startTrial,
    finishTrial,

    submitOutcome,
    submitNasaTlx,

    startNextTrial,
    cancelTrial,

    retryRemoteSave,
  };
}