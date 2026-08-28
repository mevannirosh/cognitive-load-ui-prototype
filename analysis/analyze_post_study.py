from __future__ import annotations

import json
import re
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


# ============================================================
# CONFIGURATION
# ============================================================

PROJECT_ROOT = (
    Path(__file__)
    .resolve()
    .parents[1]
)

INPUT_FILE = (
    PROJECT_ROOT
    / "research_data"
    / "post_study"
    / "raw"
    / "post_study_responses.csv"
)

PROCESSED_DIR = (
    PROJECT_ROOT
    / "research_data"
    / "post_study"
    / "processed"
)

TABLES_DIR = (
    PROJECT_ROOT
    / "research_data"
    / "analysis"
    / "tables"
)

FIGURES_DIR = (
    PROJECT_ROOT
    / "research_data"
    / "analysis"
    / "figures"
)

RESULTS_DIR = (
    PROJECT_ROOT
    / "research_data"
    / "analysis"
    / "results"
)


EXPECTED_PARTICIPANTS = {
    f"P{i:03d}"
    for i in range(1, 13)
}


# ============================================================
# QUESTION DEFINITIONS
# ============================================================

QUESTION_DEFINITIONS = [
    {
        "id": "Q1",
        "shortLabel": "Focus",
        "search":
            "helped me focus",
    },
    {
        "id": "Q2",
        "shortLabel": "Reduced information",
        "search":
            "reduced unnecessary information",
    },
    {
        "id": "Q3",
        "shortLabel": "Understandable",
        "search":
            "easy to understand",
    },
    {
        "id": "Q4",
        "shortLabel": "Appropriate timing",
        "search":
            "appropriate moments",
    },
    {
        "id": "Q5",
        "shortLabel": "Non-interruptive",
        "search":
            "did not unnecessarily interrupt",
    },
    {
        "id": "Q6",
        "shortLabel": "Complex tasks easier",
        "search":
            "made complex tasks easier",
    },
    {
        "id": "Q7",
        "shortLabel": "Comfort",
        "search":
            "felt comfortable",
    },
    {
        "id": "Q8",
        "shortLabel": "Preference",
        "search":
            "preferred the adaptive interface",
    },
]


OPEN_ENDED_DEFINITIONS = [
    {
        "id": "Q9",
        "shortLabel":
            "Most Useful Adaptation",
        "search":
            "most useful",
    },
    {
        "id": "Q10",
        "shortLabel":
            "Confusing or Unhelpful",
        "search":
            "confusing",
    },
]


# Optional question if you added it
PREFERENCE_SEARCH_PHRASE = (
    "which interface"
)


# ============================================================
# SETUP
# ============================================================

def create_directories():
    for directory in [
        PROCESSED_DIR,
        TABLES_DIR,
        FIGURES_DIR,
        RESULTS_DIR,
    ]:
        directory.mkdir(
            parents=True,
            exist_ok=True,
        )


# ============================================================
# COLUMN HELPERS
# ============================================================

def normalize_text(value):
    return (
        str(value)
        .strip()
        .lower()
    )


def find_column(
    columns,
    search_text,
):
    search_text = (
        search_text
        .strip()
        .lower()
    )

    for column in columns:
        if (
            search_text
            in column.lower()
        ):
            return column

    return None


def find_participant_column(
    columns,
):
    possible_phrases = [
        "participant id",
        "participantid",
        "participant",
    ]

    for phrase in possible_phrases:
        column = find_column(
            columns,
            phrase,
        )

        if column:
            return column

    return None


# ============================================================
# LIKERT PARSING
# ============================================================

LIKERT_TEXT_MAP = {
    "strongly disagree": 1,
    "disagree": 2,
    "neither agree nor disagree": 3,
    "neither agree nor disagree.": 3,
    "neutral": 3,
    "agree": 4,
    "strongly agree": 5,
}


def parse_likert(value):
    """
    Handles:
        1
        4
        "4 - Agree"
        "4 – Agree"
        "Agree"
        "Strongly Agree"
    """

    if pd.isna(value):
        return np.nan

    if isinstance(
        value,
        (int, float),
    ):
        number = int(value)

        if 1 <= number <= 5:
            return number

    text = (
        str(value)
        .strip()
    )

    numeric_match = re.search(
        r"(?<!\d)([1-5])(?!\d)",
        text,
    )

    if numeric_match:
        return int(
            numeric_match.group(1)
        )

    normalized = (
        text.lower()
        .strip()
    )

    return LIKERT_TEXT_MAP.get(
        normalized,
        np.nan,
    )


# ============================================================
# CRONBACH'S ALPHA
# ============================================================

def cronbach_alpha(
    dataframe,
):
    """
    Internal-consistency estimate for Q1-Q8.

    All questionnaire items are positively
    worded, so no reverse scoring is required.
    """

    item_scores = (
        dataframe
        .dropna()
        .astype(float)
    )

    number_of_items = (
        item_scores.shape[1]
    )

    if (
        number_of_items < 2
        or len(item_scores) < 2
    ):
        return np.nan

    item_variances = (
        item_scores.var(
            axis=0,
            ddof=1,
        )
    )

    total_score = (
        item_scores.sum(
            axis=1
        )
    )

    total_variance = (
        total_score.var(
            ddof=1
        )
    )

    if total_variance == 0:
        return np.nan

    alpha = (
        number_of_items
        / (
            number_of_items - 1
        )
    ) * (
        1
        -
        item_variances.sum()
        / total_variance
    )

    return float(alpha)


# ============================================================
# DATA QUALITY
# ============================================================

def validate_participants(
    df,
    participant_column,
):
    issues = []

    participant_ids = (
        df[participant_column]
        .astype(str)
        .str.strip()
        .str.upper()
    )

    df[
        "participantId"
    ] = participant_ids


    found = set(
        participant_ids
    )

    missing = (
        EXPECTED_PARTICIPANTS
        - found
    )

    unexpected = (
        found
        - EXPECTED_PARTICIPANTS
    )


    duplicates = (
        df[
            df.duplicated(
                subset=[
                    "participantId"
                ],
                keep=False,
            )
        ]
    )


    if missing:
        issues.append(
            {
                "type":
                    "missing_participants",

                "message":
                    (
                        "Missing participant IDs: "
                        + ", ".join(
                            sorted(missing)
                        )
                    ),
            }
        )


    if unexpected:
        issues.append(
            {
                "type":
                    "unexpected_participants",

                "message":
                    (
                        "Unexpected participant IDs: "
                        + ", ".join(
                            sorted(unexpected)
                        )
                    ),
            }
        )


    if not duplicates.empty:
        duplicated_ids = (
            sorted(
                duplicates[
                    "participantId"
                ]
                .unique()
            )
        )

        issues.append(
            {
                "type":
                    "duplicate_responses",

                "message":
                    (
                        "Duplicate responses found for: "
                        + ", ".join(
                            duplicated_ids
                        )
                    ),
            }
        )


    return (
        issues,
        duplicates,
    )


# ============================================================
# QUESTION EXTRACTION
# ============================================================

def extract_likert_questions(
    df,
):
    clean = pd.DataFrame()

    clean[
        "participantId"
    ] = df[
        "participantId"
    ]


    question_mapping = {}


    for question in (
        QUESTION_DEFINITIONS
    ):
        column = find_column(
            df.columns,
            question["search"],
        )

        if not column:
            raise ValueError(
                f"Could not find Google Forms "
                f"column for {question['id']} "
                f"using phrase: "
                f"{question['search']}"
            )


        question_mapping[
            question["id"]
        ] = column


        clean[
            question["id"]
        ] = (
            df[column]
            .apply(
                parse_likert
            )
        )


    return (
        clean,
        question_mapping,
    )


# ============================================================
# LIKERT DESCRIPTIVE STATISTICS
# ============================================================

def analyze_likert(
    clean_df,
):
    rows = []


    for question in (
        QUESTION_DEFINITIONS
    ):
        question_id = (
            question["id"]
        )

        scores = (
            clean_df[
                question_id
            ]
            .dropna()
            .astype(float)
        )


        counts = (
            scores
            .value_counts()
            .reindex(
                [1, 2, 3, 4, 5],
                fill_value=0,
            )
        )


        rows.append(
            {
                "question":
                    question_id,

                "shortLabel":
                    question[
                        "shortLabel"
                    ],

                "n":
                    len(scores),

                "mean":
                    scores.mean(),

                "sd":
                    scores.std(
                        ddof=1
                    ),

                "median":
                    scores.median(),

                "min":
                    scores.min(),

                "max":
                    scores.max(),

                "stronglyDisagreeN":
                    counts[1],

                "disagreeN":
                    counts[2],

                "neutralN":
                    counts[3],

                "agreeN":
                    counts[4],

                "stronglyAgreeN":
                    counts[5],

                "negativePercent":
                    (
                        scores
                        .le(2)
                        .mean()
                        * 100
                    ),

                "neutralPercent":
                    (
                        scores
                        .eq(3)
                        .mean()
                        * 100
                    ),

                "positivePercent":
                    (
                        scores
                        .ge(4)
                        .mean()
                        * 100
                    ),
            }
        )


    summary = (
        pd.DataFrame(
            rows
        )
    )


    summary.to_csv(
        TABLES_DIR
        / "post_study_likert_summary.csv",

        index=False,
    )


    return summary


# ============================================================
# RESPONSE DISTRIBUTION TABLE
# ============================================================

def create_distribution_table(
    clean_df,
):
    rows = []


    for question in (
        QUESTION_DEFINITIONS
    ):
        question_id = (
            question["id"]
        )

        scores = (
            clean_df[
                question_id
            ]
            .dropna()
        )

        total = len(scores)

        row = {
            "question":
                question_id,

            "shortLabel":
                question[
                    "shortLabel"
                ],
        }


        for score in range(
            1,
            6,
        ):
            count = int(
                (
                    scores
                    == score
                ).sum()
            )

            percent = (
                (
                    count / total
                )
                * 100
                if total
                else np.nan
            )

            row[
                f"score{score}Count"
            ] = count

            row[
                f"score{score}Percent"
            ] = percent


        rows.append(row)


    distribution = (
        pd.DataFrame(
            rows
        )
    )


    distribution.to_csv(
        TABLES_DIR
        / "post_study_likert_distribution.csv",

        index=False,
    )


    return distribution


# ============================================================
# OVERALL QUESTIONNAIRE SCORE
# ============================================================

def analyze_overall_score(
    clean_df,
):
    question_columns = [
        question["id"]
        for question
        in QUESTION_DEFINITIONS
    ]


    clean_df[
        "overallAdaptiveUXScore"
    ] = (
        clean_df[
            question_columns
        ]
        .mean(
            axis=1
        )
    )


    scores = (
        clean_df[
            "overallAdaptiveUXScore"
        ]
        .dropna()
    )


    summary = {
        "n":
            int(
                len(scores)
            ),

        "mean":
            float(
                scores.mean()
            ),

        "sd":
            float(
                scores.std(
                    ddof=1
                )
            ),

        "median":
            float(
                scores.median()
            ),

        "min":
            float(
                scores.min()
            ),

        "max":
            float(
                scores.max()
            ),
    }


    with (
        RESULTS_DIR
        / "post_study_overall_score.json"
    ).open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            summary,
            file,
            indent=2,
        )


    return summary


# ============================================================
# RELIABILITY
# ============================================================

def analyze_reliability(
    clean_df,
):
    question_columns = [
        question["id"]
        for question
        in QUESTION_DEFINITIONS
    ]


    alpha = cronbach_alpha(
        clean_df[
            question_columns
        ]
    )


    result = {
        "numberOfItems":
            len(
                question_columns
            ),

        "numberOfParticipants":
            len(
                clean_df
            ),

        "cronbachAlpha":
            (
                float(alpha)
                if not np.isnan(alpha)
                else None
            ),

        "note":
            (
                "Cronbach's alpha is reported "
                "as an exploratory estimate of "
                "internal consistency for the "
                "eight positively worded "
                "adaptive-interface items."
            ),
    }


    with (
        RESULTS_DIR
        / "post_study_reliability.json"
    ).open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            result,
            file,
            indent=2,
        )


    return result


# ============================================================
# OPEN-ENDED RESPONSES
# ============================================================

def extract_open_ended(
    df,
):
    rows = []


    for question in (
        OPEN_ENDED_DEFINITIONS
    ):
        column = find_column(
            df.columns,
            question["search"],
        )

        if not column:
            print(
                f"WARNING: Could not find "
                f"{question['id']} "
                f"using phrase "
                f"'{question['search']}'."
            )

            continue


        for _, row in (
            df.iterrows()
        ):
            response = row[
                column
            ]

            if (
                pd.isna(response)
                or not str(
                    response
                ).strip()
            ):
                continue


            rows.append(
                {
                    "participantId":
                        row[
                            "participantId"
                        ],

                    "question":
                        question["id"],

                    "questionLabel":
                        question[
                            "shortLabel"
                        ],

                    "response":
                        str(
                            response
                        ).strip(),

                    # Fill this manually
                    # during thematic coding.
                    "themes":
                        "",
                }
            )


    open_df = pd.DataFrame(
        rows
    )


    open_df.to_csv(
        TABLES_DIR
        / "post_study_open_ended_responses.csv",

        index=False,
    )


    return open_df


# ============================================================
# OPTIONAL INTERFACE PREFERENCE
# ============================================================

def analyze_interface_preference(
    df,
):
    column = find_column(
        df.columns,
        PREFERENCE_SEARCH_PHRASE,
    )


    if not column:
        print(
            "\nNo separate interface "
            "preference question detected."
        )

        return None


    responses = (
        df[column]
        .dropna()
        .astype(str)
        .str.strip()
    )


    summary = (
        responses
        .value_counts()
        .rename_axis(
            "response"
        )
        .reset_index(
            name="count"
        )
    )


    summary[
        "percent"
    ] = (
        summary["count"]
        / summary["count"].sum()
        * 100
    )


    summary.to_csv(
        TABLES_DIR
        / "interface_preference_summary.csv",

        index=False,
    )


    return summary


# ============================================================
# FIGURE 1 - ITEM MEANS
# ============================================================

def create_mean_figure(
    summary,
):
    plot_df = (
        summary
        .copy()
        .sort_values(
            "question",
            ascending=False,
        )
    )


    fig, ax = plt.subplots(
        figsize=(9, 6)
    )


    positions = np.arange(
        len(plot_df)
    )


    ax.barh(
        positions,
        plot_df["mean"],
    )


    ax.set_yticks(
        positions,

        labels=[
            (
                f"{row.question} – "
                f"{row.shortLabel}"
            )
            for row in
            plot_df.itertuples()
        ],
    )


    ax.set_xlim(
        1,
        5,
    )


    ax.set_xlabel(
        "Mean Likert Score (1–5)"
    )


    ax.set_title(
        "Participant Evaluation of the Adaptive Interface"
    )


    ax.axvline(
        3,
        linestyle="--",
        linewidth=1,
    )


    fig.tight_layout()


    fig.savefig(
        FIGURES_DIR
        / "post_study_likert_means.png",

        dpi=300,
        bbox_inches="tight",
    )


    plt.close(fig)


# ============================================================
# FIGURE 2 - RESPONSE DISTRIBUTION
# ============================================================

def create_distribution_figure(
    distribution,
):
    plot_df = (
        distribution
        .copy()
        .sort_values(
            "question",
            ascending=False,
        )
    )


    fig, ax = plt.subplots(
        figsize=(10, 6)
    )


    positions = np.arange(
        len(plot_df)
    )


    left = np.zeros(
        len(plot_df)
    )


    labels = [
        "Strongly Disagree",
        "Disagree",
        "Neutral",
        "Agree",
        "Strongly Agree",
    ]


    for score, label in zip(
        range(1, 6),
        labels,
    ):
        values = (
            plot_df[
                f"score{score}Percent"
            ]
            .to_numpy()
        )


        ax.barh(
            positions,
            values,
            left=left,
            label=label,
        )


        left += values


    ax.set_yticks(
        positions,

        labels=[
            (
                f"{row.question} – "
                f"{row.shortLabel}"
            )
            for row in
            plot_df.itertuples()
        ],
    )


    ax.set_xlim(
        0,
        100,
    )


    ax.set_xlabel(
        "Percentage of Responses"
    )


    ax.set_title(
        "Distribution of Post-Study Questionnaire Responses"
    )


    ax.legend(
        loc="upper center",
        bbox_to_anchor=(
            0.5,
            -0.12,
        ),
        ncol=3,
    )


    fig.tight_layout()


    fig.savefig(
        FIGURES_DIR
        / "post_study_likert_distribution.png",

        dpi=300,
        bbox_inches="tight",
    )


    plt.close(fig)


# ============================================================
# MAIN
# ============================================================

def main():
    print(
        "\nPost-Study Questionnaire Analysis"
        "\n=================================\n"
    )


    create_directories()


    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"Google Forms CSV not found:\n"
            f"{INPUT_FILE}"
        )


    # --------------------------------------------------------
    # LOAD ORIGINAL RESPONSE FILE
    # --------------------------------------------------------

    df = pd.read_csv(
        INPUT_FILE
    )


    print(
        f"Google Forms responses found: "
        f"{len(df)}"
    )


    # --------------------------------------------------------
    # PARTICIPANT ID
    # --------------------------------------------------------

    participant_column = (
        find_participant_column(
            df.columns
        )
    )


    if not participant_column:
        raise ValueError(
            "Could not locate the "
            "Participant ID column."
        )


    issues, duplicates = (
        validate_participants(
            df,
            participant_column,
        )
    )


    print(
        "\nParticipant IDs:"
    )

    print(
        sorted(
            df[
                "participantId"
            ].unique()
        )
    )


    if issues:
        print(
            "\nDATA QUALITY WARNINGS:"
        )

        for issue in issues:
            print(
                f"- {issue['message']}"
            )


        pd.DataFrame(
            issues
        ).to_csv(
            TABLES_DIR
            / "post_study_data_quality_issues.csv",

            index=False,
        )


    else:
        print(
            "\nPOST-STUDY DATA QUALITY CHECK PASSED."
        )


    # --------------------------------------------------------
    # EXTRACT / CLEAN LIKERT ITEMS
    # --------------------------------------------------------

    clean_df, mapping = (
        extract_likert_questions(
            df
        )
    )


    print(
        "\nDetected Google Forms columns:"
    )

    for question_id, column in (
        mapping.items()
    ):
        print(
            f"{question_id}: {column}"
        )


    # Check missing questionnaire values
    question_columns = [
        question["id"]
        for question
        in QUESTION_DEFINITIONS
    ]


    missing_count = int(
        clean_df[
            question_columns
        ]
        .isna()
        .sum()
        .sum()
    )


    print(
        f"\nMissing Likert responses: "
        f"{missing_count}"
    )


    # --------------------------------------------------------
    # DESCRIPTIVE ANALYSIS
    # --------------------------------------------------------

    summary = analyze_likert(
        clean_df
    )


    distribution = (
        create_distribution_table(
            clean_df
        )
    )


    overall = (
        analyze_overall_score(
            clean_df
        )
    )


    reliability = (
        analyze_reliability(
            clean_df
        )
    )


    # --------------------------------------------------------
    # SAVE CLEAN DATASET
    # --------------------------------------------------------

    clean_df.to_csv(
        PROCESSED_DIR
        / "post_study_cleaned.csv",

        index=False,
    )


    # --------------------------------------------------------
    # OPEN ENDED
    # --------------------------------------------------------

    open_df = (
        extract_open_ended(
            df
        )
    )


    # --------------------------------------------------------
    # OPTIONAL PREFERENCE
    # --------------------------------------------------------

    preference = (
        analyze_interface_preference(
            df
        )
    )


    # --------------------------------------------------------
    # FIGURES
    # --------------------------------------------------------

    create_mean_figure(
        summary
    )


    create_distribution_figure(
        distribution
    )


    # --------------------------------------------------------
    # CONSOLE RESULTS
    # --------------------------------------------------------

    print(
        "\n================================"
    )

    print(
        "LIKERT RESULTS"
    )

    print(
        "================================\n"
    )


    display_columns = [
        "question",
        "shortLabel",
        "n",
        "mean",
        "sd",
        "median",
        "positivePercent",
    ]


    print(
        summary[
            display_columns
        ].round(
            2
        ).to_string(
            index=False
        )
    )


    print(
        "\nOverall Adaptive UX Score:"
    )

    print(
        json.dumps(
            overall,
            indent=2,
        )
    )


    print(
        "\nCronbach's Alpha:"
    )

    print(
        json.dumps(
            reliability,
            indent=2,
        )
    )


    if preference is not None:
        print(
            "\nInterface Preference:"
        )

        print(
            preference.to_string(
                index=False
            )
        )


    print(
        f"\nOpen-ended responses found: "
        f"{len(open_df)}"
    )


    print(
        "\n================================"
    )

    print(
        "POST-STUDY ANALYSIS COMPLETE"
    )

    print(
        "================================"
    )


    print(
        "\nCleaned responses:"
    )

    print(
        PROCESSED_DIR
        / "post_study_cleaned.csv"
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
        "\nResults:"
    )

    print(
        RESULTS_DIR
    )


if __name__ == "__main__":
    main()