import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  DATASET_COLUMNS,
  rowsToCsv,
} from "../src/ml/featureExtractor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.resolve(__dirname, "../datasets");

function randomFloat(min, max, decimals = 2) {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createSessionId(label, index) {
  return `synthetic-${label}-${String(index).padStart(4, "0")}`;
}

function createLowLoadFeatures() {
  return {
    clickRatePerMin: randomFloat(5, 16),
    repeatedClickCount: randomInt(0, 1),
    scrollCount: randomInt(1, 8),
    scrollDirectionChanges: randomInt(0, 2),
    avgPointerSpeed: randomFloat(350, 750),
    keyPressCount: randomInt(5, 35),
    navigationCount: randomInt(0, 1),
    avgHesitationMs: randomFloat(250, 900),
    maxHesitationMs: randomFloat(900, 2500),
    durationSec: randomFloat(25, 75),
  };
}

function createMediumLoadFeatures() {
  return {
    clickRatePerMin: randomFloat(14, 34),
    repeatedClickCount: randomInt(1, 4),
    scrollCount: randomInt(6, 18),
    scrollDirectionChanges: randomInt(2, 7),
    avgPointerSpeed: randomFloat(200, 550),
    keyPressCount: randomInt(20, 70),
    navigationCount: randomInt(1, 4),
    avgHesitationMs: randomFloat(900, 2500),
    maxHesitationMs: randomFloat(2500, 6500),
    durationSec: randomFloat(70, 150),
  };
}

function createHighLoadFeatures() {
  return {
    clickRatePerMin: randomFloat(28, 65),
    repeatedClickCount: randomInt(4, 14),
    scrollCount: randomInt(16, 45),
    scrollDirectionChanges: randomInt(7, 20),
    avgPointerSpeed: randomFloat(80, 900),
    keyPressCount: randomInt(40, 120),
    navigationCount: randomInt(3, 10),
    avgHesitationMs: randomFloat(2500, 7000),
    maxHesitationMs: randomFloat(7000, 18000),
    durationSec: randomFloat(140, 330),
  };
}

function createSyntheticRow(label, index) {
  let featureVector;

  if (label === "low") {
    featureVector = createLowLoadFeatures();
  } else if (label === "medium") {
    featureVector = createMediumLoadFeatures();
  } else {
    featureVector = createHighLoadFeatures();
  }

  return {
    sessionId: createSessionId(label, index),
    source: "synthetic",
    label,
    ...featureVector,
  };
}

function generateDataset(rowsPerClass = 300) {
  const rows = [];

  ["low", "medium", "high"].forEach((label) => {
    for (let i = 1; i <= rowsPerClass; i += 1) {
      rows.push(createSyntheticRow(label, i));
    }
  });

  return rows.sort(() => Math.random() - 0.5);
}

function main() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const dataset = generateDataset(300);

  const jsonPath = path.join(outputDir, "synthetic_interaction_dataset.json");
  const csvPath = path.join(outputDir, "synthetic_interaction_dataset.csv");

  fs.writeFileSync(jsonPath, JSON.stringify(dataset, null, 2));
  fs.writeFileSync(csvPath, rowsToCsv(dataset, DATASET_COLUMNS));

  console.log("Synthetic dataset generated successfully.");
  console.log(`Rows: ${dataset.length}`);
  console.log(`JSON: ${jsonPath}`);
  console.log(`CSV: ${csvPath}`);
}

main();