export const RESEARCH_TASKS = [
  // =========================================================
  // TASK SET A
  // =========================================================

  {
    id: "A1",
    set: "A",

    title: "Policy Information Search",

    expectedDifficulty: "low",

    startPage: "info",

    participantInstruction:
      "Open Information Search and find the System Usage Policy. Tell the researcher what should happen before a sensitive action is submitted.",

    correctOutcome:
      "The participant should identify that sensitive actions should be reviewed carefully before submission.",

    researcherCriteria:
      "Mark the task as completed when the participant correctly identifies the required review-before-submission rule.",

    errorCriteria: [
      "Incorrect final answer = 1 error.",
      "Unable to provide an answer = task failed.",
      "Navigation mistakes are not counted manually because they are captured by interaction tracking.",
    ],
  },

  {
    id: "A2",
    set: "A",

    title: "Pending Priority Review",

    expectedDifficulty: "medium",

    startPage: "dashboard",

    participantInstruction:
      "Review the Dashboard and find the item that is High priority, has Pending status, and is due Today. Open the Task Form and submit that item with its priority and a short reason for your selection.",

    correctOutcome:
      "Selected Item: User Access Review. Priority: High. The reason should indicate that the item is pending, high priority and/or due today.",

    researcherCriteria:
      "The participant should correctly identify User Access Review and submit it as High priority with an appropriate reason.",

    errorCriteria: [
      "Wrong selected item = 1 error.",
      "Wrong priority = 1 error.",
      "Missing or clearly incorrect reason = 1 error.",
      "Required field left incomplete = 1 error.",
      "Navigation or interaction mistakes are not counted manually.",
    ],
  },

  {
    id: "A3",
    set: "A",

    title: "Critical Item Prioritisation",

    expectedDifficulty: "high",

    startPage: "dashboard",

    participantInstruction:
      "The Dashboard contains two High-priority items that are due Today. Decide which one should be handled first. Use the Work Prioritisation Guide in Information Search to help make the decision. Then use the Task Form to submit the item you selected, its priority, the supporting guide, and a short reason for your decision.",

    correctOutcome:
      "Selected Item: System Alert Check. Priority: High. Supporting Information: Work Prioritisation Guide. The reason should explain that both High-priority items are due Today, but System Alert Check is marked Attention Needed and therefore takes precedence over the Pending item.",

    researcherCriteria:
      "The participant should compare User Access Review and System Alert Check, consult the Work Prioritisation Guide, select System Alert Check, and justify the decision using the Attention Needed rule.",

    errorCriteria: [
      "Wrong selected item = 1 error.",
      "Wrong priority = 1 error.",
      "Missing or incorrect supporting guide = 1 error.",
      "Reason does not apply the prioritisation rule = 1 error.",
      "Required field left incomplete = 1 error.",
      "Navigation or interaction mistakes are not counted manually.",
    ],
  },

  // =========================================================
  // TASK SET B
  // =========================================================

  {
    id: "B1",
    set: "B",

    title: "Submission Information Search",

    expectedDifficulty: "low",

    startPage: "info",

    participantInstruction:
      "Open Information Search and find the Task Completion Instructions. Tell the researcher which three pieces of information are required for a basic review submission.",

    correctOutcome:
      "Selected Item, Priority, and Reason for Selection.",

    researcherCriteria:
      "Mark the task as completed when the participant correctly identifies the three required fields.",

    errorCriteria: [
      "Each incorrectly identified required field may be counted as 1 error.",
      "Unable to provide the required information = task failed.",
      "Navigation mistakes are not counted manually.",
    ],
  },

  {
    id: "B2",
    set: "B",

    title: "Attention Required Review",

    expectedDifficulty: "medium",

    startPage: "dashboard",

    participantInstruction:
      "Review the Dashboard and find the item that is High priority, has Attention Needed status, and is due Today. Open the Task Form and submit that item with its priority and a short reason for your selection.",

    correctOutcome:
      "Selected Item: System Alert Check. Priority: High. The reason should indicate that the item requires attention, is high priority and/or is due today.",

    researcherCriteria:
      "The participant should correctly identify System Alert Check and submit it as High priority with an appropriate reason.",

    errorCriteria: [
      "Wrong selected item = 1 error.",
      "Wrong priority = 1 error.",
      "Missing or clearly incorrect reason = 1 error.",
      "Required field left incomplete = 1 error.",
      "Navigation or interaction mistakes are not counted manually.",
    ],
  },

  {
    id: "B3",
    set: "B",

    title: "Deadline-Based Prioritisation",

    expectedDifficulty: "high",

    startPage: "dashboard",

    participantInstruction:
      "Compare the two Medium-priority dashboard items. Use the Work Prioritisation Guide in Information Search to determine which one should be handled first. Then use the Task Form to submit your selected item, its priority, the supporting guide, and a short reason for your decision.",

    correctOutcome:
      "Selected Item: Monthly Analytics. Priority: Medium. Supporting Information: Work Prioritisation Guide. The reason should explain that both items have Medium priority but Monthly Analytics has the earlier due date.",

    researcherCriteria:
      "The participant should compare Monthly Analytics and User Feedback Review, consult the Work Prioritisation Guide, select Monthly Analytics, and justify the decision using the earlier-due-date rule.",

    errorCriteria: [
      "Wrong selected item = 1 error.",
      "Wrong priority = 1 error.",
      "Missing or incorrect supporting guide = 1 error.",
      "Reason does not apply the prioritisation rule = 1 error.",
      "Required field left incomplete = 1 error.",
      "Navigation or interaction mistakes are not counted manually.",
    ],
  },
];


export function getResearchTask(taskId) {
  return (
    RESEARCH_TASKS.find(
      (task) => task.id === taskId
    ) || null
  );
}


export function getTasksForSet(taskSet) {
  return RESEARCH_TASKS.filter(
    (task) => task.set === taskSet
  );
}