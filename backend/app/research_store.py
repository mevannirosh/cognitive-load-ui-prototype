from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import json


def utc_now_iso() -> str:
    return datetime.now(
        timezone.utc
    ).isoformat()


class ResearchTrialStore:
    def __init__(
        self,
        data_directory: Path,
    ):
        self.data_directory = (
            data_directory
        )

        self.trials_directory = (
            self.data_directory
            / "trials"
        )

        self.trials_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

    def save_trial(
        self,
        trial: dict[str, Any],
    ) -> dict[str, Any]:
        trial_id = trial["trialId"]

        file_path = (
            self.trials_directory
            / f"{trial_id}.json"
        )

        stored_record = {
            **trial,

            "serverSavedAt":
                utc_now_iso(),
        }

        temporary_path = (
            file_path.with_suffix(
                ".json.tmp"
            )
        )

        with temporary_path.open(
            "w",
            encoding="utf-8",
        ) as file:
            json.dump(
                stored_record,
                file,
                indent=2,
                ensure_ascii=False,
            )

        temporary_path.replace(
            file_path
        )

        return {
            "trialId": trial_id,

            "savedAt":
                stored_record[
                    "serverSavedAt"
                ],
        }

    def count_trials(self) -> int:
        return len(
            list(
                self.trials_directory
                .glob("*.json")
            )
        )