export const dashboardMetrics = [
  {
    label: "Open Tasks",
    value: "24",
    description: "Tasks requiring attention",
    priority: "high",
  },
  {
    label: "Critical Alerts",
    value: "5",
    description: "Alerts that may affect workflow",
    priority: "high",
  },
  {
    label: "Pending Reviews",
    value: "12",
    description: "Items waiting for approval",
    priority: "medium",
  },
  {
    label: "System Health",
    value: "91%",
    description: "Overall system performance",
    priority: "low",
  },
];


export const dashboardRows = [
  {
    id: 1,
    module: "User Access Review",
    status: "Pending",
    priority: "High",
    owner: "Security Team",
    due: "Today",
  },

  {
    id: 2,
    module: "Monthly Analytics",
    status: "In Progress",
    priority: "Medium",
    owner: "Analytics Team",
    due: "2 Days",
  },

  {
    id: 3,
    module: "System Alert Check",
    status: "Attention Needed",
    priority: "High",
    owner: "Support Team",
    due: "Today",
  },

  {
    id: 4,
    module: "Report Validation",
    status: "Completed",
    priority: "Low",
    owner: "Operations",
    due: "Completed",
  },

  {
    id: 5,
    module: "User Feedback Review",
    status: "Pending",
    priority: "Medium",
    owner: "UX Team",
    due: "4 Days",
  },
];


export const chartData = [
  {
    name: "Mon",
    tasks: 12,
    errors: 3,
  },
  {
    name: "Tue",
    tasks: 18,
    errors: 4,
  },
  {
    name: "Wed",
    tasks: 14,
    errors: 2,
  },
  {
    name: "Thu",
    tasks: 22,
    errors: 5,
  },
  {
    name: "Fri",
    tasks: 19,
    errors: 3,
  },
];


export const infoArticles = [
  {
    title: "System Usage Policy",

    category: "Policy",

    summary:
      "Users must follow access-control and data-handling procedures. Sensitive actions should be reviewed carefully before submission.",

    fullText:
      "Users must follow the organisation's access-control and data-handling procedures when using the system. Sensitive actions should be reviewed carefully before submission. Users should avoid unnecessary data exposure and follow the appropriate approval process.",
  },

  {
    title: "Dashboard Interpretation Guide",

    category: "Guide",

    summary:
      "Dashboard cards and tables summarise important operational information, task status, priorities, alerts and deadlines.",

    fullText:
      "The dashboard provides an overview of operational information including task status, priority, ownership and deadlines. Users should examine both the priority and current status of an item rather than relying on a single dashboard value.",
  },

  {
    title: "Task Completion Instructions",

    category: "Instruction",

    summary:
      "A basic review submission requires a Selected Item, Priority and Reason for Selection.",

    fullText:
      "A basic review submission requires three pieces of information: Selected Item, Priority and Reason for Selection. Supporting Information may be provided when the decision depends on a policy or guidance document. Additional Notes are optional.",
  },

  {
    title: "Work Prioritisation Guide",

    category: "Guide",

    summary:
      "Prioritisation should consider priority level, current status and due date.",

    fullText:
      "When deciding which item should be handled first, consider its priority level, current status and due date. When two items have the same priority and due date, an item marked Attention Needed should be handled before an item marked Pending. When items have the same priority and neither requires immediate attention, the item with the earlier due date should normally be handled first.",
  },
];


export const adaptationRules = {
  low: [
    "Full dashboard enabled",
    "Advanced analytics visible",
    "Detailed table columns displayed",
    "Optional form fields available",
  ],

  medium: [
    "Important actions highlighted",
    "Light guidance enabled",
    "Interface remains mostly unchanged",
    "Helpful hints displayed",
  ],

  high: [
    "Interface simplified",
    "Secondary widgets hidden",
    "Optional form fields hidden",
    "Summaries and guidance shown",
    "Non-critical content reduced",
  ],
};