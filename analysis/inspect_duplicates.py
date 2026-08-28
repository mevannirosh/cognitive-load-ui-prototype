from pathlib import Path
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]

DUPLICATE_FILE = (
    PROJECT_ROOT
    / "research_data"
    / "analysis"
    / "tables"
    / "duplicate_trials.csv"
)


def main():
    if not DUPLICATE_FILE.exists():
        raise FileNotFoundError(
            f"Duplicate file not found: {DUPLICATE_FILE}"
        )

    df = pd.read_csv(DUPLICATE_FILE)

    columns = [
        "participantId",
        "taskId",
        "condition",
        "sourceFile",
        "trialId",
        "startedAt",
        "endedAt",
        "durationSec",
        "taskSuccess",
        "errorCount",
        "rawNasaTlx",
        "taskLevelPrediction",
        "averagePredictionConfidence",
    ]

    available_columns = [
        column
        for column in columns
        if column in df.columns
    ]

    print("\nDuplicate Trials")
    print("================\n")

    print(
        df[available_columns]
        .to_string(index=False)
    )


if __name__ == "__main__":
    main()