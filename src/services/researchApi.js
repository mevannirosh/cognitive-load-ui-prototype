const DEFAULT_API_URL =
  "http://127.0.0.1:8000/api/v1";

const API_URL = (
  import.meta.env
    .VITE_ML_API_URL ||
  DEFAULT_API_URL
).replace(/\/$/, "");


export async function saveResearchTrialRemote(
  trial
) {
  const response =
    await fetch(
      `${API_URL}/research/trials`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(trial),
      }
    );

  const payload =
    await response.json();

  if (!response.ok) {
    throw new Error(
      payload?.detail ||
      "Unable to save research trial."
    );
  }

  return payload;
}


export async function getResearchTrialCount() {
  const response =
    await fetch(
      `${API_URL}/research/trials/count`
    );

  if (!response.ok) {
    throw new Error(
      "Unable to retrieve trial count."
    );
  }

  return response.json();
}