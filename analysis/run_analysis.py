from __future__ import annotations

import json
import math
import re
import shutil
from pathlib import Path
from typing import Iterable

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from scipy.stats import (
    friedmanchisquare,
    rankdata,
    spearmanr,
    wilcoxon,
)

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
)


# ============================================================
# CONFIGURATION
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]

SOURCE_TRIAL_DIR = (
    PROJECT_ROOT
    / "research_data"
    / "trials"
)

RAW_FINAL_DIR = (
    PROJECT_ROOT
    / "research_data"
    / "raw"
    / "final_study"
)

PROCESSED_DIR = (
    PROJECT_ROOT
    / "research_data"
    / "processed"
)

ANALYSIS_DIR = (
    PROJECT_ROOT
    / "research_data"
    / "analysis"
)

FIGURES_DIR = (
    ANALYSIS_DIR
    / "figures"
)

TABLES_DIR = (
    ANALYSIS_DIR
    / "tables"
)

RESULTS_DIR = (
    ANALYSIS_DIR
    / "results"
)

EXCLUSIONS_FILE = (
    PROJECT_ROOT
    / "research_data"
    / "exclusions.json"
)


EXPECTED_PARTICIPANT_COUNT = 12

PARTICIPANT_PATTERN = re.compile(
    r"^P\d{3}$",
    re.IGNORECASE,
)

EXPECTED_TASKS = {
    "A1",
    "A2",
    "A3",
    "B1",
    "B2",
    "B3",
}

TASK_DIFFICULTY = {
    "A1": "low",
    "A2": "medium",
    "A3": "high",
    "B1": "low",
    "B2": "medium",
    "B3": "high",
}

DIFFICULTY_ORDER = [
    "low",
    "medium",
    "high",
]

CONDITION_ORDER = [
    "non_adaptive",
    "adaptive",
]

LOAD_TO_NUMBER = {
    "low": 1,
    "medium": 2,
    "high": 3,
}

SUCCESS_TO_NUMBER = {
    "failed": 0,
    "partial": 1,
    "partially_completed": 1,
    "completed": 2,
}


# ============================================================
# DIRECTORY SETUP
# ============================================================

def create_directories():
    for directory in [
        RAW_FINAL_DIR,
        PROCESSED_DIR,
        FIGURES_DIR,
        TABLES_DIR,
        RESULTS_DIR,
    ]:
        directory.mkdir(
            parents=True,
            exist_ok=True,
        )


# ============================================================
# HELPERS
# ============================================================
def load_excluded_trial_ids():
    if not EXCLUSIONS_FILE.exists():
        return set()

    with EXCLUSIONS_FILE.open(
        "r",
        encoding="utf-8",
    ) as file:
        data = json.load(file)

    return set(
        data.get(
            "excludedTrialIds",
            []
        )
    )

def normalize_condition(value):
    if value is None:
        return None

    value = (
        str(value)
        .strip()
        .lower()
        .replace("-", "_")
        .replace(" ", "_")
    )

    if value in {
        "nonadaptive",
        "non_adaptive",
    }:
        return "non_adaptive"

    if value == "adaptive":
        return "adaptive"

    return value


def normalize_load(value):
    if value is None:
        return None

    value = str(value).strip().lower()

    if value in LOAD_TO_NUMBER:
        return value

    return value


def safe_number(value):
    if value is None:
        return np.nan

    try:
        return float(value)
    except (TypeError, ValueError):
        return np.nan


def safe_int(value):
    number = safe_number(value)

    if np.isnan(number):
        return np.nan

    return int(number)


def read_json(path: Path):
    with path.open(
        "r",
        encoding="utf-8",
    ) as file:
        return json.load(file)


# ============================================================
# FLATTEN ONE TRIAL
# ============================================================

def flatten_trial(
    trial: dict,
    source_file: Path,
):
    participant_id = (
        str(
            trial.get(
                "participantId",
                "",
            )
        )
        .strip()
        .upper()
    )

    task_id = (
        str(
            trial.get(
                "taskId",
                "",
            )
        )
        .strip()
        .upper()
    )

    expected_difficulty = normalize_load(
        trial.get(
            "expectedDifficulty"
        )
        or TASK_DIFFICULTY.get(
            task_id
        )
    )

    condition = normalize_condition(
        trial.get("condition")
    )


    # --------------------------------------------------------
    # OUTCOME
    # --------------------------------------------------------

    outcome = (
        trial.get("outcome")
        or {}
    )

    task_success = (
        str(
            outcome.get(
                "taskSuccess",
                "",
            )
        )
        .strip()
        .lower()
    )

    success_score = (
        SUCCESS_TO_NUMBER.get(
            task_success,
            np.nan,
        )
    )


    # --------------------------------------------------------
    # NASA-TLX
    # --------------------------------------------------------

    nasa = (
        trial.get("nasaTlx")
        or {}
    )


    # --------------------------------------------------------
    # INTERACTION FEATURES
    # --------------------------------------------------------

    interaction = (
        trial.get("interaction")
        or {}
    )

    features = (
        interaction.get(
            "finalFeatureVector"
        )
        or {}
    )


    # --------------------------------------------------------
    # PREDICTIONS
    # --------------------------------------------------------

    predictions = (
        trial.get("predictions")
        or {}
    )

    prediction_summary = (
        predictions.get("summary")
        or {}
    )

    majority_prediction = normalize_load(
        prediction_summary.get(
            "majorityPrediction"
        )
    )


    # --------------------------------------------------------
    # MODEL
    # --------------------------------------------------------

    model = (
        trial.get("model")
        or {}
    )


    return {
        "sourceFile":
            source_file.name,

        "trialId":
            trial.get(
                "trialId",
                source_file.stem,
            ),

        "participantId":
            participant_id,

        "taskId":
            task_id,

        "taskSet":
            trial.get("taskSet"),

        "expectedDifficulty":
            expected_difficulty,

        "condition":
            condition,

        "status":
            trial.get("status"),

        "prototypeVersion":
            trial.get(
                "prototypeVersion"
            ),

        "studyVersion":
            trial.get(
                "studyVersion"
            ),

        "modelName":
            model.get("name"),

        "modelVersion":
            model.get("version"),

        "startedAt":
            trial.get("startedAt"),

        "endedAt":
            trial.get("endedAt"),

        "durationSec":
            safe_number(
                trial.get(
                    "durationSec"
                )
            ),

        # TASK OUTCOME
        "taskSuccess":
            task_success,

        "successScore":
            success_score,

        "errorCount":
            safe_number(
                outcome.get(
                    "errorCount"
                )
            ),

        # NASA
        "mentalDemand":
            safe_number(
                nasa.get(
                    "mentalDemand"
                )
            ),

        "physicalDemand":
            safe_number(
                nasa.get(
                    "physicalDemand"
                )
            ),

        "temporalDemand":
            safe_number(
                nasa.get(
                    "temporalDemand"
                )
            ),

        "performance":
            safe_number(
                nasa.get(
                    "performance"
                )
            ),

        "effort":
            safe_number(
                nasa.get(
                    "effort"
                )
            ),

        "frustration":
            safe_number(
                nasa.get(
                    "frustration"
                )
            ),

        "rawNasaTlx":
            safe_number(
                nasa.get(
                    "rawScore"
                )
            ),

        # ML PREDICTION
        "totalPredictions":
            safe_number(
                prediction_summary.get(
                    "totalPredictions"
                )
            ),

        "predictionLowCount":
            safe_number(
                prediction_summary.get(
                    "lowCount"
                )
            ),

        "predictionMediumCount":
            safe_number(
                prediction_summary.get(
                    "mediumCount"
                )
            ),

        "predictionHighCount":
            safe_number(
                prediction_summary.get(
                    "highCount"
                )
            ),

        "taskLevelPrediction":
            majority_prediction,

        "averagePredictionConfidence":
            safe_number(
                prediction_summary.get(
                    "averageConfidence"
                )
            ),

        # BEHAVIOURAL FEATURES
        "clickRatePerMin":
            safe_number(
                features.get(
                    "clickRatePerMin"
                )
            ),

        "repeatedClickCount":
            safe_number(
                features.get(
                    "repeatedClickCount"
                )
            ),

        "scrollCount":
            safe_number(
                features.get(
                    "scrollCount"
                )
            ),

        "scrollDirectionChanges":
            safe_number(
                features.get(
                    "scrollDirectionChanges"
                )
            ),

        "avgPointerSpeed":
            safe_number(
                features.get(
                    "avgPointerSpeed"
                )
            ),

        "keyPressCount":
            safe_number(
                features.get(
                    "keyPressCount"
                )
            ),

        "navigationCount":
            safe_number(
                features.get(
                    "navigationCount"
                )
            ),

        "avgHesitationMs":
            safe_number(
                features.get(
                    "avgHesitationMs"
                )
            ),

        "maxHesitationMs":
            safe_number(
                features.get(
                    "maxHesitationMs"
                )
            ),
    }


# ============================================================
# LOAD ALL TRIALS
# ============================================================

def load_trials():
    if not SOURCE_TRIAL_DIR.exists():
        raise FileNotFoundError(
            f"Trial directory not found: "
            f"{SOURCE_TRIAL_DIR}"
        )

    # --------------------------------------------------------
    # LOAD EXPLICITLY EXCLUDED TRIAL IDS
    # --------------------------------------------------------

    excluded_trial_ids = (
        load_excluded_trial_ids()
    )

    print(
        f"\nExplicitly excluded trial IDs: "
        f"{len(excluded_trial_ids)}"
    )

    valid_rows = []
    excluded_rows = []

    files = sorted(
        SOURCE_TRIAL_DIR.glob(
            "*.json"
        )
    )

    print(
        f"\nFound {len(files)} "
        f"JSON files."
    )


    # --------------------------------------------------------
    # PROCESS EACH JSON FILE
    # --------------------------------------------------------

    for path in files:

        # ----------------------------------------------------
        # READ JSON
        # ----------------------------------------------------

        try:
            trial = read_json(path)

        except Exception as error:
            excluded_rows.append({
                "sourceFile":
                    path.name,

                "participantId":
                    "",

                "trialId":
                    "",

                "reason":
                    f"Invalid JSON: {error}",
            })

            continue


        # ----------------------------------------------------
        # PARTICIPANT ID
        # ----------------------------------------------------

        participant_id = (
            str(
                trial.get(
                    "participantId",
                    "",
                )
            )
            .strip()
            .upper()
        )


        # ----------------------------------------------------
        # TRIAL ID
        # ----------------------------------------------------

        trial_id = (
            str(
                trial.get(
                    "trialId",
                    path.stem,
                )
            )
            .strip()
        )


        # ----------------------------------------------------
        # EXCLUDE TEST / PILOT PARTICIPANTS
        # ----------------------------------------------------

        if not PARTICIPANT_PATTERN.match(
            participant_id
        ):
            excluded_rows.append({
                "sourceFile":
                    path.name,

                "participantId":
                    participant_id,

                "trialId":
                    trial_id,

                "reason":
                    "Not a final participant ID",
            })

            continue


        # ----------------------------------------------------
        # EXPLICITLY EXCLUDE INVALID TRIALS
        # ----------------------------------------------------

        if trial_id in excluded_trial_ids:
            excluded_rows.append({
                "sourceFile":
                    path.name,

                "participantId":
                    participant_id,

                "trialId":
                    trial_id,

                "reason":
                    (
                        "Explicitly excluded "
                        "from final analysis"
                    ),
            })

            print(
                f"Excluded trial: "
                f"{participant_id} | "
                f"{trial.get('taskId')} | "
                f"{trial.get('condition')} | "
                f"{trial_id}"
            )

            continue


        # ----------------------------------------------------
        # FLATTEN VALID FINAL TRIAL
        # ----------------------------------------------------

        row = flatten_trial(
            trial,
            path,
        )

        valid_rows.append(
            row
        )


    # --------------------------------------------------------
    # CREATE DATAFRAMES
    # --------------------------------------------------------

    df = pd.DataFrame(
        valid_rows
    )

    excluded_df = pd.DataFrame(
        excluded_rows
    )


    # --------------------------------------------------------
    # SAVE EXCLUSION REPORT
    # --------------------------------------------------------

    if not excluded_df.empty:
        excluded_df.to_csv(
            TABLES_DIR
            / "excluded_trials.csv",

            index=False,
        )


    print(
        f"\nTrials retained for analysis: "
        f"{len(df)}"
    )

    print(
        f"Trials/files excluded: "
        f"{len(excluded_df)}"
    )


    return df

# ============================================================
# DATA QUALITY VALIDATION
# ============================================================

def expected_condition(
    participant_id,
    task_id,
):
    """
    Counterbalancing used in this study:

    Odd participant:
        A = non-adaptive
        B = adaptive

    Even participant:
        A = adaptive
        B = non-adaptive
    """

    number = int(
        participant_id[1:]
    )

    task_set = task_id[0]

    odd = number % 2 == 1

    if odd:
        return (
            "non_adaptive"
            if task_set == "A"
            else "adaptive"
        )

    return (
        "adaptive"
        if task_set == "A"
        else "non_adaptive"
    )


def validate_dataset(df):
    issues = []

    participants = sorted(
        df[
            "participantId"
        ]
        .dropna()
        .unique()
    )


    print(
        "\nFinal participant IDs:"
    )

    print(participants)

    print(
        f"\nParticipant count: "
        f"{len(participants)}"
    )

    print(
        f"Trial count: "
        f"{len(df)}"
    )


    if (
        len(participants)
        != EXPECTED_PARTICIPANT_COUNT
    ):
        issues.append({
            "type":
                "participant_count",

            "participantId":
                "",

            "taskId":
                "",

            "message":
                (
                    f"Expected "
                    f"{EXPECTED_PARTICIPANT_COUNT} "
                    f"participants but found "
                    f"{len(participants)}."
                ),
        })


    # --------------------------------------------------------
    # DUPLICATE PARTICIPANT + TASK
    # --------------------------------------------------------

    duplicate_mask = (
        df.duplicated(
            subset=[
                "participantId",
                "taskId",
            ],

            keep=False,
        )
    )

    duplicates = df[
        duplicate_mask
    ]

    if not duplicates.empty:
        duplicates.to_csv(
            TABLES_DIR
            / "duplicate_trials.csv",

            index=False,
        )

        issues.append({
            "type":
                "duplicates",

            "participantId":
                "",

            "taskId":
                "",

            "message":
                (
                    "Duplicate participant/task "
                    "records were found. "
                    "See duplicate_trials.csv."
                ),
        })


    # --------------------------------------------------------
    # PER PARTICIPANT VALIDATION
    # --------------------------------------------------------

    for participant in participants:
        participant_df = df[
            df[
                "participantId"
            ]
            == participant
        ]

        tasks = set(
            participant_df[
                "taskId"
            ]
        )

        missing = (
            EXPECTED_TASKS
            - tasks
        )

        extra = (
            tasks
            - EXPECTED_TASKS
        )

        if missing:
            issues.append({
                "type":
                    "missing_tasks",

                "participantId":
                    participant,

                "taskId":
                    "",

                "message":
                    (
                        "Missing tasks: "
                        + ", ".join(
                            sorted(missing)
                        )
                    ),
            })

        if extra:
            issues.append({
                "type":
                    "unexpected_tasks",

                "participantId":
                    participant,

                "taskId":
                    "",

                "message":
                    (
                        "Unexpected tasks: "
                        + ", ".join(
                            sorted(extra)
                        )
                    ),
            })


        for _, row in (
            participant_df
            .iterrows()
        ):
            task_id = row[
                "taskId"
            ]

            expected = (
                expected_condition(
                    participant,
                    task_id,
                )
            )

            if (
                row["condition"]
                != expected
            ):
                issues.append({
                    "type":
                        "counterbalancing",

                    "participantId":
                        participant,

                    "taskId":
                        task_id,

                    "message":
                        (
                            f"Expected "
                            f"{expected}, found "
                            f"{row['condition']}."
                        ),
                })


            if pd.isna(
                row["rawNasaTlx"]
            ):
                issues.append({
                    "type":
                        "missing_nasa",

                    "participantId":
                        participant,

                    "taskId":
                        task_id,

                    "message":
                        "NASA-TLX is missing.",
                })


            if not row[
                "taskLevelPrediction"
            ]:
                issues.append({
                    "type":
                        "missing_prediction",

                    "participantId":
                        participant,

                    "taskId":
                        task_id,

                    "message":
                        (
                            "Task-level ML "
                            "prediction is missing."
                        ),
                })


            if pd.isna(
                row["durationSec"]
            ):
                issues.append({
                    "type":
                        "missing_duration",

                    "participantId":
                        participant,

                    "taskId":
                        task_id,

                    "message":
                        (
                            "Task duration "
                            "is missing."
                        ),
                })


    issues_df = pd.DataFrame(
        issues
    )

    issues_df.to_csv(
        TABLES_DIR
        / "data_quality_issues.csv",

        index=False,
    )


    if issues:
        print(
            "\nWARNING: Data quality "
            "issues were detected."
        )

        print(
            issues_df.to_string(
                index=False
            )
        )

    else:
        print(
            "\nDATA QUALITY CHECK PASSED."
        )

        print(
            "12 participants × 6 tasks "
            "= 72 valid trials expected."
        )


    return issues_df


# ============================================================
# COPY FINAL RAW FILES
# ============================================================

def freeze_final_raw_data(df):
    """
    Copies only the valid final-participant
    JSON files.

    Source files are never moved or modified.
    """

    for path in (
        RAW_FINAL_DIR.glob(
            "*.json"
        )
    ):
        path.unlink()


    for filename in df[
        "sourceFile"
    ]:
        source = (
            SOURCE_TRIAL_DIR
            / filename
        )

        destination = (
            RAW_FINAL_DIR
            / filename
        )

        shutil.copy2(
            source,
            destination,
        )


    print(
        f"\nCopied {len(df)} "
        f"final-study JSON files to:"
    )

    print(
        RAW_FINAL_DIR
    )


# ============================================================
# DESCRIPTIVE STATISTICS
# ============================================================

def describe_numeric(series):
    series = pd.to_numeric(
        series,
        errors="coerce",
    ).dropna()

    if len(series) == 0:
        return {
            "n": 0,
            "mean": np.nan,
            "sd": np.nan,
            "median": np.nan,
            "q1": np.nan,
            "q3": np.nan,
            "min": np.nan,
            "max": np.nan,
        }

    return {
        "n":
            len(series),

        "mean":
            series.mean(),

        "sd":
            series.std(ddof=1),

        "median":
            series.median(),

        "q1":
            series.quantile(0.25),

        "q3":
            series.quantile(0.75),

        "min":
            series.min(),

        "max":
            series.max(),
    }


def descriptive_by_group(
    df,
    group_column,
    metrics,
):
    rows = []

    for group, subset in df.groupby(
        group_column
    ):
        for metric in metrics:
            result = describe_numeric(
                subset[metric]
            )

            rows.append({
                group_column:
                    group,

                "metric":
                    metric,

                **result,
            })

    return pd.DataFrame(rows)


# ============================================================
# HOLM MULTIPLE-COMPARISON CORRECTION
# ============================================================

def holm_adjust(p_values):
    """
    Holm-Bonferroni corrected p-values.
    """

    p_values = np.asarray(
        p_values,
        dtype=float,
    )

    count = len(p_values)

    order = np.argsort(
        p_values
    )

    adjusted = np.empty(
        count
    )

    running_max = 0

    for rank, index in enumerate(
        order
    ):
        multiplier = (
            count - rank
        )

        value = min(
            p_values[index]
            * multiplier,
            1.0,
        )

        running_max = max(
            running_max,
            value,
        )

        adjusted[index] = (
            running_max
        )

    return adjusted


# ============================================================
# WILCOXON EFFECT SIZE
# ============================================================

def rank_biserial_effect(
    first,
    second,
):
    """
    Paired rank-biserial correlation.

    Difference = first - second.
    """

    first = np.asarray(
        first,
        dtype=float,
    )

    second = np.asarray(
        second,
        dtype=float,
    )

    differences = (
        first - second
    )

    differences = (
        differences[
            differences != 0
        ]
    )

    if len(differences) == 0:
        return 0.0

    ranks = rankdata(
        np.abs(differences)
    )

    positive = ranks[
        differences > 0
    ].sum()

    negative = ranks[
        differences < 0
    ].sum()

    total = (
        positive + negative
    )

    if total == 0:
        return 0.0

    return float(
        (
            positive - negative
        )
        / total
    )


def paired_wilcoxon(
    wide_df,
    first_column,
    second_column,
):
    pair = wide_df[
        [
            first_column,
            second_column,
        ]
    ].dropna()

    first = pair[
        first_column
    ].to_numpy(
        dtype=float
    )

    second = pair[
        second_column
    ].to_numpy(
        dtype=float
    )

    differences = (
        first - second
    )

    if np.allclose(
        differences,
        0,
    ):
        statistic = 0.0
        p_value = 1.0

    else:
        result = wilcoxon(
            first,
            second,

            alternative="two-sided",

            zero_method="wilcox",
        )

        statistic = float(
            result.statistic
        )

        p_value = float(
            result.pvalue
        )


    effect = rank_biserial_effect(
        first,
        second,
    )


    return {
        "n":
            len(pair),

        "firstMean":
            np.mean(first),

        "secondMean":
            np.mean(second),

        "firstMedian":
            np.median(first),

        "secondMedian":
            np.median(second),

        "wilcoxonW":
            statistic,

        "pValue":
            p_value,

        "rankBiserial":
            effect,
    }


# ============================================================
# 7.8 COGNITIVE LOAD MANIPULATION
# ============================================================

def analyze_task_difficulty(df):
    print(
        "\n================================"
    )

    print(
        "NASA-TLX BY TASK DIFFICULTY"
    )

    print(
        "================================"
    )


    descriptive = (
        descriptive_by_group(
            df,
            "expectedDifficulty",
            ["rawNasaTlx"],
        )
    )

    descriptive.to_csv(
        TABLES_DIR
        / "nasa_by_difficulty_descriptive.csv",

        index=False,
    )


    participant_means = (
        df.groupby(
            [
                "participantId",
                "expectedDifficulty",
            ]
        )[
            "rawNasaTlx"
        ]
        .mean()
        .unstack()
    )


    participant_means = (
        participant_means
        .reindex(
            columns=
                DIFFICULTY_ORDER
        )
    )


    participant_means.to_csv(
        TABLES_DIR
        / "participant_nasa_by_difficulty.csv"
    )


    complete = (
        participant_means
        .dropna()
    )


    if len(complete) >= 3:
        friedman = (
            friedmanchisquare(
                complete["low"],
                complete["medium"],
                complete["high"],
            )
        )

        friedman_result = {
            "test":
                "Friedman",

            "nParticipants":
                len(complete),

            "statistic":
                float(
                    friedman.statistic
                ),

            "pValue":
                float(
                    friedman.pvalue
                ),
        }


        with (
            RESULTS_DIR
            / "nasa_difficulty_friedman.json"
        ).open(
            "w",
            encoding="utf-8",
        ) as file:
            json.dump(
                friedman_result,
                file,
                indent=2,
            )


        comparisons = [
            (
                "low",
                "medium",
            ),
            (
                "medium",
                "high",
            ),
            (
                "low",
                "high",
            ),
        ]

        rows = []

        for first, second in comparisons:
            result = paired_wilcoxon(
                complete,
                first,
                second,
            )

            rows.append({
                "comparison":
                    f"{first} vs {second}",

                **result,
            })


        pairwise = pd.DataFrame(
            rows
        )

        pairwise[
            "holmAdjustedP"
        ] = holm_adjust(
            pairwise[
                "pValue"
            ].values
        )


        pairwise.to_csv(
            TABLES_DIR
            / "nasa_difficulty_pairwise_tests.csv",

            index=False,
        )


        print(
            "\nFriedman Test:"
        )

        print(
            friedman_result
        )


    # --------------------------------------------------------
    # FIGURE
    # --------------------------------------------------------

    fig, ax = plt.subplots(
        figsize=(7, 5)
    )

    values = [
        complete["low"],
        complete["medium"],
        complete["high"],
    ]

    ax.boxplot(
        values,
        tick_labels=[
            "Low",
            "Medium",
            "High",
        ],
    )

    ax.set_ylabel(
        "Raw NASA-TLX Score"
    )

    ax.set_xlabel(
        "Experimental Task Difficulty"
    )

    ax.set_title(
        "Subjective Workload by Task Difficulty"
    )

    fig.tight_layout()

    fig.savefig(
        FIGURES_DIR
        / "nasa_by_task_difficulty.png",

        dpi=300,
        bbox_inches="tight",
    )

    plt.close(fig)


# ============================================================
# 7.9 HUMAN MODEL VALIDATION
# ============================================================

def analyze_ml_performance(df):
    print(
        "\n================================"
    )

    print(
        "HUMAN ML VALIDATION"
    )

    print(
        "================================"
    )


    model_df = df[
        df[
            "expectedDifficulty"
        ].isin(
            DIFFICULTY_ORDER
        )
        &
        df[
            "taskLevelPrediction"
        ].isin(
            DIFFICULTY_ORDER
        )
    ].copy()


    y_true = model_df[
        "expectedDifficulty"
    ]

    y_pred = model_df[
        "taskLevelPrediction"
    ]


    accuracy = accuracy_score(
        y_true,
        y_pred,
    )


    (
        precision,
        recall,
        f1,
        support,
    ) = (
        precision_recall_fscore_support(
            y_true,
            y_pred,

            labels=
                DIFFICULTY_ORDER,

            zero_division=0,
        )
    )


    macro_precision = float(
        np.mean(precision)
    )

    macro_recall = float(
        np.mean(recall)
    )

    macro_f1 = float(
        np.mean(f1)
    )


    overall = {
        "numberOfTrials":
            len(model_df),

        "accuracy":
            float(accuracy),

        "macroPrecision":
            macro_precision,

        "macroRecall":
            macro_recall,

        "macroF1":
            macro_f1,
    }


    with (
        RESULTS_DIR
        / "human_ml_metrics.json"
    ).open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            overall,
            file,
            indent=2,
        )


    report = (
        classification_report(
            y_true,
            y_pred,

            labels=
                DIFFICULTY_ORDER,

            target_names=[
                "Low",
                "Medium",
                "High",
            ],

            output_dict=True,

            zero_division=0,
        )
    )


    report_df = (
        pd.DataFrame(
            report
        )
        .transpose()
    )


    report_df.to_csv(
        TABLES_DIR
        / "human_ml_classification_report.csv"
    )


    # --------------------------------------------------------
    # CONFUSION MATRIX
    # --------------------------------------------------------

    cm = confusion_matrix(
        y_true,
        y_pred,

        labels=
            DIFFICULTY_ORDER,
    )


    cm_df = pd.DataFrame(
        cm,

        index=[
            "Actual Low",
            "Actual Medium",
            "Actual High",
        ],

        columns=[
            "Predicted Low",
            "Predicted Medium",
            "Predicted High",
        ],
    )


    cm_df.to_csv(
        TABLES_DIR
        / "human_ml_confusion_matrix.csv"
    )


    fig, ax = plt.subplots(
        figsize=(6, 5)
    )

    image = ax.imshow(cm)

    ax.set_xticks(
        range(3),

        labels=[
            "Low",
            "Medium",
            "High",
        ],
    )

    ax.set_yticks(
        range(3),

        labels=[
            "Low",
            "Medium",
            "High",
        ],
    )

    ax.set_xlabel(
        "Predicted Cognitive Load"
    )

    ax.set_ylabel(
        "Experimental Task Level"
    )

    ax.set_title(
        "Human Validation Confusion Matrix"
    )


    for row in range(
        cm.shape[0]
    ):
        for column in range(
            cm.shape[1]
        ):
            ax.text(
                column,
                row,
                str(
                    cm[
                        row,
                        column,
                    ]
                ),

                ha="center",
                va="center",
            )


    fig.colorbar(
        image,
        ax=ax,
    )

    fig.tight_layout()

    fig.savefig(
        FIGURES_DIR
        / "human_ml_confusion_matrix.png",

        dpi=300,
        bbox_inches="tight",
    )

    plt.close(fig)


    print(
        "\nHuman validation metrics:"
    )

    print(
        json.dumps(
            overall,
            indent=2,
        )
    )


# ============================================================
# 7.10 ML PREDICTION VS NASA-TLX
# ============================================================

def participant_cluster_bootstrap_spearman(
    df,
    iterations=2000,
    seed=42,
):
    rng = np.random.default_rng(
        seed
    )

    participants = (
        df[
            "participantId"
        ]
        .unique()
    )

    correlations = []

    for _ in range(
        iterations
    ):
        sampled = rng.choice(
            participants,

            size=len(
                participants
            ),

            replace=True,
        )

        chunks = []

        for index, participant in enumerate(
            sampled
        ):
            chunk = df[
                df[
                    "participantId"
                ]
                == participant
            ].copy()

            # Give repeated bootstrap
            # clusters unique IDs.
            chunk[
                "bootstrapParticipant"
            ] = index

            chunks.append(
                chunk
            )

        bootstrap_df = pd.concat(
            chunks,
            ignore_index=True,
        )

        result = spearmanr(
            bootstrap_df[
                "predictionOrdinal"
            ],

            bootstrap_df[
                "rawNasaTlx"
            ],
        )

        if not np.isnan(
            result.statistic
        ):
            correlations.append(
                result.statistic
            )


    if not correlations:
        return (
            np.nan,
            np.nan,
        )


    return (
        float(
            np.percentile(
                correlations,
                2.5,
            )
        ),

        float(
            np.percentile(
                correlations,
                97.5,
            )
        ),
    )


def analyze_prediction_vs_nasa(
    df
):
    print(
        "\n================================"
    )

    print(
        "ML PREDICTION VS NASA-TLX"
    )

    print(
        "================================"
    )


    correlation_df = df.copy()

    correlation_df[
        "predictionOrdinal"
    ] = (
        correlation_df[
            "taskLevelPrediction"
        ]
        .map(
            LOAD_TO_NUMBER
        )
    )


    correlation_df = (
        correlation_df[
            [
                "participantId",
                "predictionOrdinal",
                "rawNasaTlx",
            ]
        ]
        .dropna()
    )


    result = spearmanr(
        correlation_df[
            "predictionOrdinal"
        ],

        correlation_df[
            "rawNasaTlx"
        ],
    )


    lower_ci, upper_ci = (
        participant_cluster_bootstrap_spearman(
            correlation_df
        )
    )


    output = {
        "nTaskObservations":
            len(
                correlation_df
            ),

        "spearmanRho":
            float(
                result.statistic
            ),

        "pValue":
            float(
                result.pvalue
            ),

        "clusterBootstrap95CILower":
            lower_ci,

        "clusterBootstrap95CIUpper":
            upper_ci,

        "note":
            (
                "Task-level observations are "
                "repeated within participants. "
                "The bootstrap confidence interval "
                "resamples participants as clusters."
            ),
    }


    with (
        RESULTS_DIR
        / "prediction_nasa_spearman.json"
    ).open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            output,
            file,
            indent=2,
        )


    print(
        json.dumps(
            output,
            indent=2,
        )
    )


# ============================================================
# 7.11 ADAPTIVE VS NON-ADAPTIVE
# ============================================================

def analyze_conditions(df):
    print(
        "\n================================"
    )

    print(
        "ADAPTIVE VS NON-ADAPTIVE"
    )

    print(
        "================================"
    )


    metrics = [
        "rawNasaTlx",
        "durationSec",
        "errorCount",
        "successScore",
    ]


    participant_condition = (
        df.groupby(
            [
                "participantId",
                "condition",
            ]
        )[
            metrics
        ]
        .mean()
        .reset_index()
    )


    participant_condition.to_csv(
        TABLES_DIR
        / "participant_condition_means.csv",

        index=False,
    )


    result_rows = []


    for metric in metrics:
        wide = (
            participant_condition
            .pivot(
                index=
                    "participantId",

                columns=
                    "condition",

                values=
                    metric,
            )
        )


        if not {
            "adaptive",
            "non_adaptive",
        }.issubset(
            wide.columns
        ):
            continue


        result = paired_wilcoxon(
            wide,

            "adaptive",
            "non_adaptive",
        )


        result_rows.append({
            "metric":
                metric,

            **result,
        })


    statistical_results = (
        pd.DataFrame(
            result_rows
        )
    )


    # Primary measures:
    # NASA, duration, errors.
    primary_mask = (
        statistical_results[
            "metric"
        ].isin(
            [
                "rawNasaTlx",
                "durationSec",
                "errorCount",
            ]
        )
    )


    adjusted = holm_adjust(
        statistical_results.loc[
            primary_mask,
            "pValue",
        ].values
    )


    statistical_results[
        "holmAdjustedP"
    ] = np.nan


    statistical_results.loc[
        primary_mask,
        "holmAdjustedP",
    ] = adjusted


    statistical_results.to_csv(
        TABLES_DIR
        / "adaptive_vs_nonadaptive_tests.csv",

        index=False,
    )


    # --------------------------------------------------------
    # COMPLETION RATE
    # --------------------------------------------------------

    completion = (
        df.assign(
            completed=
                df[
                    "taskSuccess"
                ].eq(
                    "completed"
                )
                .astype(int)
        )
        .groupby(
            "condition"
        )[
            "completed"
        ]
        .agg(
            [
                "count",
                "sum",
                "mean",
            ]
        )
        .reset_index()
    )


    completion[
        "completionPercent"
    ] = (
        completion[
            "mean"
        ]
        * 100
    )


    completion.to_csv(
        TABLES_DIR
        / "task_completion_by_condition.csv",

        index=False,
    )


    print(
        statistical_results
        .to_string(
            index=False
        )
    )


    # --------------------------------------------------------
    # FIGURES
    # --------------------------------------------------------

    create_paired_condition_figure(
        participant_condition,
        "rawNasaTlx",
        "Raw NASA-TLX Score",
        "Subjective Workload by Interface Condition",
        "nasa_adaptive_vs_nonadaptive.png",
    )


    create_paired_condition_figure(
        participant_condition,
        "durationSec",
        "Task Completion Time (seconds)",
        "Task Completion Time by Interface Condition",
        "completion_time_adaptive_vs_nonadaptive.png",
    )


    create_paired_condition_figure(
        participant_condition,
        "errorCount",
        "Mean Error Count",
        "Task Errors by Interface Condition",
        "errors_adaptive_vs_nonadaptive.png",
    )


def create_paired_condition_figure(
    participant_condition,
    metric,
    ylabel,
    title,
    filename,
):
    wide = (
        participant_condition
        .pivot(
            index=
                "participantId",

            columns=
                "condition",

            values=
                metric,
        )
        .dropna()
    )


    if not {
        "adaptive",
        "non_adaptive",
    }.issubset(
        wide.columns
    ):
        return


    x = [0, 1]

    fig, ax = plt.subplots(
        figsize=(7, 5)
    )


    for _, row in (
        wide.iterrows()
    ):
        ax.plot(
            x,

            [
                row[
                    "non_adaptive"
                ],

                row[
                    "adaptive"
                ],
            ],

            marker="o",
            alpha=0.65,
        )


    ax.set_xticks(
        x,

        labels=[
            "Non-Adaptive",
            "Adaptive",
        ],
    )

    ax.set_ylabel(
        ylabel
    )

    ax.set_title(
        title
    )

    fig.tight_layout()

    fig.savefig(
        FIGURES_DIR
        / filename,

        dpi=300,
        bbox_inches="tight",
    )

    plt.close(fig)


# ============================================================
# 7.12 BEHAVIOURAL INTERACTION ANALYSIS
# ============================================================

def analyze_behaviour(df):
    print(
        "\n================================"
    )

    print(
        "BEHAVIOURAL INTERACTION ANALYSIS"
    )

    print(
        "================================"
    )


    behavioural_metrics = [
        "repeatedClickCount",
        "navigationCount",
        "avgHesitationMs",
        "scrollDirectionChanges",
    ]


    participant_condition = (
        df.groupby(
            [
                "participantId",
                "condition",
            ]
        )[
            behavioural_metrics
        ]
        .mean()
        .reset_index()
    )


    rows = []


    for metric in (
        behavioural_metrics
    ):
        wide = (
            participant_condition
            .pivot(
                index=
                    "participantId",

                columns=
                    "condition",

                values=
                    metric,
            )
        )


        if not {
            "adaptive",
            "non_adaptive",
        }.issubset(
            wide.columns
        ):
            continue


        result = paired_wilcoxon(
            wide,

            "adaptive",
            "non_adaptive",
        )


        rows.append({
            "metric":
                metric,

            **result,
        })


    results = pd.DataFrame(
        rows
    )


    if not results.empty:
        results[
            "holmAdjustedP"
        ] = holm_adjust(
            results[
                "pValue"
            ].values
        )


    results.to_csv(
        TABLES_DIR
        / "behaviour_adaptive_vs_nonadaptive.csv",

        index=False,
    )


    print(
        results.to_string(
            index=False
        )
    )


# ============================================================
# DESCRIPTIVE OUTPUTS
# ============================================================

def create_general_descriptives(df):
    metrics = [
        "rawNasaTlx",
        "durationSec",
        "errorCount",
        "clickRatePerMin",
        "repeatedClickCount",
        "scrollCount",
        "scrollDirectionChanges",
        "avgPointerSpeed",
        "keyPressCount",
        "navigationCount",
        "avgHesitationMs",
        "maxHesitationMs",
        "averagePredictionConfidence",
    ]


    by_condition = (
        descriptive_by_group(
            df,
            "condition",
            metrics,
        )
    )

    by_condition.to_csv(
        TABLES_DIR
        / "descriptive_statistics_by_condition.csv",

        index=False,
    )


    by_difficulty = (
        descriptive_by_group(
            df,
            "expectedDifficulty",
            metrics,
        )
    )

    by_difficulty.to_csv(
        TABLES_DIR
        / "descriptive_statistics_by_difficulty.csv",

        index=False,
    )


# ============================================================
# MAIN
# ============================================================

def main():
    print(
        "\nCognitive Load Adaptive UI"
        "\nFinal Empirical Analysis"
        "\n=========================\n"
    )


    create_directories()


    # --------------------------------------------------------
    # LOAD
    # --------------------------------------------------------

    df = load_trials()


    if df.empty:
        raise RuntimeError(
            "No final participant "
            "trial data were found."
        )


    # --------------------------------------------------------
    # SORT
    # --------------------------------------------------------

    df["taskOrder"] = (
        df["taskId"]
        .map({
            "A1": 1,
            "A2": 2,
            "A3": 3,
            "B1": 4,
            "B2": 5,
            "B3": 6,
        })
    )


    df = df.sort_values(
        [
            "participantId",
            "taskOrder",
        ]
    ).reset_index(
        drop=True
    )


    df = df.drop(
        columns=[
            "taskOrder"
        ]
    )


    # --------------------------------------------------------
    # SAVE FLATTENED DATASET FIRST
    # --------------------------------------------------------

    dataset_path = (
        PROCESSED_DIR
        / "evaluation_dataset.csv"
    )


    df.to_csv(
        dataset_path,
        index=False,
    )


    print(
        f"\nProcessed dataset saved:"
        f"\n{dataset_path}"
    )


    # --------------------------------------------------------
    # DATA QUALITY
    # --------------------------------------------------------

    issues = validate_dataset(
        df
    )


    # Critical issues that should be
    # resolved before statistical analysis.
    critical_types = {
        "duplicates",
        "missing_tasks",
        "participant_count",
        "missing_nasa",
        "missing_duration",
    }


    critical = (
        issues[
            issues["type"].isin(
                critical_types
            )
        ]
        if not issues.empty
        else pd.DataFrame()
    )


    if not critical.empty:
        print(
            "\nCRITICAL DATA QUALITY "
            "ISSUES FOUND."
        )

        print(
            "Review:"
        )

        print(
            TABLES_DIR
            / "data_quality_issues.csv"
        )

        print(
            "\nStatistical analysis "
            "has been stopped to avoid "
            "using an invalid dataset."
        )

        return


    # --------------------------------------------------------
    # FREEZE FINAL RAW DATA
    # --------------------------------------------------------

    freeze_final_raw_data(
        df
    )


    # --------------------------------------------------------
    # DESCRIPTIVES
    # --------------------------------------------------------

    create_general_descriptives(
        df
    )


    # --------------------------------------------------------
    # ANALYSES
    # --------------------------------------------------------

    analyze_task_difficulty(
        df
    )

    analyze_ml_performance(
        df
    )

    analyze_prediction_vs_nasa(
        df
    )

    analyze_conditions(
        df
    )

    analyze_behaviour(
        df
    )


    print(
        "\n================================"
    )

    print(
        "ANALYSIS COMPLETE"
    )

    print(
        "================================"
    )

    print(
        "\nProcessed dataset:"
    )

    print(
        PROCESSED_DIR
        / "evaluation_dataset.csv"
    )

    print(
        "\nTables:"
    )

    print(
        TABLES_DIR
    )

    print(
        "\nFigures:"
    )

    print(
        FIGURES_DIR
    )

    print(
        "\nStatistical results:"
    )

    print(
        RESULTS_DIR
    )


if __name__ == "__main__":
    main()