# Cognitive Load–Aware Adaptive UI Framework

A research prototype developed for an MSc Software Engineering dissertation:

**“Cognitive Load–Aware Adaptive UI Framework Using Machine Learning for Enhancing User Experience in Web Applications.”**

The project investigates whether non-intrusive web interaction behaviour can be used to estimate cognitive load and whether an adaptive user interface can reduce perceived workload and improve task efficiency.

---

## Overview

Modern web applications can expose users to large amounts of information, complex navigation, and competing interface elements. This prototype implements an end-to-end adaptive UI pipeline that:

1. captures user interaction behaviour,
2. extracts behavioural features,
3. sends the feature vector to a machine learning prediction service,
4. estimates cognitive load as **Low**, **Medium**, or **High**, and
5. applies rule-driven interface adaptations during interaction.

The system also includes a dedicated research evaluation mode for controlled participant studies, NASA-TLX workload collection, task outcome recording, and research-data storage.

---

## System Architecture

```text
User Interaction
       ↓
Interaction Tracking
       ↓
Feature Extraction
       ↓
Machine Learning Prediction
       ↓
Cognitive Load Estimation
       ↓
Rule-Driven UI Adaptation
```

The frontend and machine learning service are separated so that the prediction model can be retrained or replaced without redesigning the application UI.

---

## Technology Stack

### Frontend
- React
- Vite
- JavaScript
- Material UI
- Recharts

### Backend / Machine Learning
- Python
- FastAPI
- scikit-learn
- Random Forest classifier
- Joblib

### Research / Analysis
- Raw NASA-TLX
- pandas
- NumPy
- SciPy
- scikit-learn metrics
- Matplotlib

---

## Behavioural Features

The model uses the following interaction features:

- Click rate per minute
- Repeated click count
- Scroll count
- Scroll-direction changes
- Average pointer speed
- Keyboard activity
- Navigation count
- Average hesitation
- Maximum hesitation
- Task/session duration

These signals are collected without requiring specialist physiological sensing hardware.

---

## Cognitive Load Prediction

The frontend sends behavioural features to the FastAPI endpoint:

```http
POST /api/v1/predict
```

Example request:

```json
{
  "sessionId": "TEST-001",
  "features": {
    "clickRatePerMin": 18.5,
    "repeatedClickCount": 3,
    "scrollCount": 14,
    "scrollDirectionChanges": 6,
    "avgPointerSpeed": 420.7,
    "keyPressCount": 12,
    "navigationCount": 5,
    "avgHesitationMs": 2850,
    "maxHesitationMs": 6100,
    "durationSec": 75
  }
}
```

The API returns a cognitive-load category together with prediction information such as confidence/probabilities and an adaptation recommendation.

Predictions are generated after an initial warm-up period and then periodically during an active task.

---

## Adaptive Interface Behaviour

The adaptation layer is separated from the machine learning model.

Typical behaviours include:

- **Low load:** full interface presentation
- **Medium load:** additional emphasis and contextual guidance
- **High load:** reduced secondary content, prioritised task-relevant information, simplified presentation, and guidance

This separation allows application-specific adaptation rules to be changed without retraining the cognitive-load model.

---

## Research Evaluation Mode

The prototype includes a controlled evaluation workflow supporting:

- Anonymous participant IDs
- Adaptive and Non-Adaptive experimental conditions
- Matched Task Sets A and B
- Low-, Medium-, and High-demand tasks
- Trial timing
- Continuous behavioural tracking
- Periodic ML predictions
- Task outcome and error recording
- Raw NASA-TLX after each task
- Research trial persistence
- JSON/CSV analysis workflows

In the **Non-Adaptive** condition, behavioural tracking and ML inference continue to run, but UI adaptation is disabled.

In the **Adaptive** condition, tracking, inference, and UI adaptation are enabled.

---

## Research Study

The final empirical evaluation used:

- **12 participants**
- **72 valid experimental trials**
- Within-subject Adaptive vs Non-Adaptive comparison
- Counterbalanced task-set allocation
- Raw NASA-TLX
- Task completion time
- Task outcomes/errors
- Behavioural interaction measures
- Post-study usability feedback

### Key Evaluation Findings

- Human validation accuracy of the synthetic-trained classifier: **30.56%**
- Macro F1-score: **26.80%**
- No significant relationship between ML prediction and Raw NASA-TLX
- Mean Raw NASA-TLX:
  - Adaptive: **9.98**
  - Non-Adaptive: **52.36**
- Mean task completion time:
  - Adaptive: **109.15 s**
  - Non-Adaptive: **203.50 s**
- Navigation activity and scroll-direction changes were significantly lower in the Adaptive condition
- Participant feedback showed strong preference for the adaptive interface during complex tasks

These results demonstrate strong potential for the **adaptive interface strategy**, while also showing that the current machine learning model requires calibration or retraining using representative human interaction data.

---

## Project Structure

```text
src/
├── components/
├── data/
├── ml/
│   ├── featureExtractor.js
│   └── useCognitiveLoadInference.js
├── pages/
├── research/
│   ├── researchConfig.js
│   ├── researchTasks.js
│   ├── researchStorage.js
│   └── useResearchEvaluation.js
├── services/
│   ├── mlApi.js
│   └── researchApi.js
└── tracking/
    └── useInteractionTracker.js

backend/
└── app/
    ├── config.py
    ├── main.py
    ├── model_service.py
    ├── research_store.py
    └── schemas.py

ml_training/
└── model_artifacts/
    ├── cognitive_load_model.joblib
    ├── model_metadata.json
    ├── model_report.json
    ├── classification_report.txt
    ├── confusion_matrix.png
    └── feature_importance.csv

analysis/
├── run_analysis.py
├── analyze_post_study.py
└── analyze_feedback_themes.py

research_data/
├── trials/
├── raw/
├── processed/
└── analysis/
```

> Some generated research-data folders or participant records may be excluded from the public repository for privacy and research-integrity reasons.

---

## Getting Started

### Prerequisites

Install:

- Node.js and npm
- Python 3.10+ recommended
- Git

---

## Frontend Setup

From the project root:

```bash
npm install
npm run dev
```

The Vite development server will normally run at:

```text
http://localhost:5173
```

---

## Backend Setup

Create and activate a Python virtual environment.

### Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install the Python dependencies using the requirements file used by the project, for example:

```bash
pip install -r requirements.txt
```

Start the FastAPI backend:

```bash
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

FastAPI Swagger documentation will then be available at:

```text
http://127.0.0.1:8000/docs
```

> If the repository stores `requirements.txt` inside a subdirectory, adjust the installation path accordingly.

---

## Running the Complete Prototype

1. Start the FastAPI backend.
2. Start the React/Vite frontend.
3. Open the frontend in the browser.
4. Use the prototype normally or open **Research Evaluation Mode** for controlled trials.
5. Confirm that the prediction API is available before beginning an experimental session.

---

## Machine Learning Development

The initial classifier was developed using a synthetic dataset of **900 observations**:

- 300 Low
- 300 Medium
- 300 High

The dataset was split into:

- 80% training data
- 20% test data
- Stratified by class
- `random_state = 42`

Candidate classifiers included:

- Random Forest
- Gradient Boosting
- Support Vector Machine
- Logistic Regression

The selected model was persisted using Joblib and loaded by the FastAPI prediction service.

### Important Research Note

High performance on the synthetic development dataset should **not** be interpreted as evidence of real-world cognitive-load accuracy.

The human evaluation demonstrated a substantial synthetic-to-real generalisation gap. The synthetic dataset was therefore useful for initial prototype development and pipeline verification, while representative human-labelled data is required for reliable real-world cognitive-load estimation.

---

## Data Analysis

The main empirical analysis can be executed with:

```bash
python analysis/run_analysis.py
```

The script performs:

- Final participant/trial validation
- Raw NASA-TLX analysis by task difficulty
- Human ML validation
- Accuracy, precision, recall, macro F1
- Confusion matrix generation
- Spearman correlation with NASA-TLX
- Adaptive vs Non-Adaptive paired analysis
- Behavioural interaction analysis
- Dissertation-ready tables and figures

Post-study questionnaire analysis can be run using:

```bash
python analysis/analyze_post_study.py
```

Generated outputs are written under:

```text
research_data/analysis/
├── figures/
├── tables/
└── results/
```

---

## Research Data and Privacy

The study uses anonymous participant identifiers such as `P001`, `P002`, etc.

No participant-identifying information should be committed to a public repository. Before publishing or sharing the repository, verify that it does **not** contain:

- Signed consent forms
- Participant names or contact details
- Private research records containing identifying information
- API keys, passwords, tokens, or other secrets
- Local environment files such as `.env`

Raw participant data should be managed according to the applicable university ethics and research-data requirements.

---

## Limitations

Key limitations identified during the study include:

- Initial model training relied on synthetic behavioural data
- The human validation sample was limited to 12 participants
- Interaction behaviour varies considerably between users
- Experimentally assigned workload levels are not direct measurements of cognitive state
- Raw NASA-TLX is subjective and post-task
- The current model does not use personalised behavioural baselines
- The prototype was evaluated in a controlled research environment rather than long-term production use

---

## Future Work

Future development should prioritise:

- Training with larger human-labelled interaction datasets
- Participant-grouped model validation
- Personalised behavioural calibration
- Improved prediction robustness
- Smoother and more controllable UI adaptations
- Additional behavioural or physiological signals where appropriate
- Evaluation across different web application domains and larger participant groups

---

## Academic Context

This repository contains the prototype developed as part of an MSc Software Engineering research dissertation.

The system is intended as a **research prototype**, not as a production-ready cognitive-state diagnostic system. Cognitive-load predictions produced by the current model should not be interpreted as clinical, psychological, or medical assessments.

---

## Repository Use

This repository is provided primarily for academic demonstration, reproducibility, and further research. If the project is to be distributed under a specific open-source licence, add the appropriate `LICENSE` file and update this section accordingly.
