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
  { name: "Mon", tasks: 12, errors: 3 },
  { name: "Tue", tasks: 18, errors: 4 },
  { name: "Wed", tasks: 14, errors: 2 },
  { name: "Thu", tasks: 22, errors: 5 },
  { name: "Fri", tasks: 19, errors: 3 },
];

export const infoArticles = [
  {
    title: "System Usage Policy",
    category: "Policy",
    summary:
      "Users must follow access control and data handling rules when working with system information.",
    fullText:
      "Users must follow access control and data handling rules when working with system information. Sensitive actions should be reviewed carefully before submission. Users should avoid unnecessary data exposure and follow internal approval workflows.",
  },
  {
    title: "Dashboard Interpretation Guide",
    category: "Guide",
    summary:
      "Dashboard cards show important metrics, alerts, and progress indicators.",
    fullText:
      "Dashboard cards show important metrics, alerts, and progress indicators. Users should first review critical alerts, then analyse pending tasks and system health. Advanced filters can be used to narrow data by priority, owner, and due date.",
  },
  {
    title: "Task Completion Instructions",
    category: "Instruction",
    summary:
      "Required task fields should be completed before submission.",
    fullText:
      "Required task fields should be completed before submission. Users should enter a clear title, priority, category, and description. Optional fields can be used when additional detail is available, but they are not required for basic task completion.",
  },
  {
    title: "Cognitive Load Support",
    category: "Research",
    summary:
      "Adaptive interfaces can reduce mental effort by simplifying complex tasks.",
    fullText:
      "Adaptive interfaces can reduce mental effort by simplifying complex tasks. When the system detects signs of overload, it can hide secondary elements, provide hints, and highlight important actions. This supports better usability and task performance.",
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