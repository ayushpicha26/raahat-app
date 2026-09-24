export const DEMO_CASES = [
  { id: "RAH-2026-00124", holder: "Priya S.", district: "Nagpur", state: "Maharashtra", svi: 91, priority: "Critical", problem: "Threat / Intimidation", status: "Human Review Required", date: "2026-08-22", assigned: "—" },
  { id: "RAH-2026-00125", holder: "Ravi M.", district: "Nashik", state: "Maharashtra", svi: 84, priority: "High", problem: "Social Boycott", status: "Counsellor Assigned", date: "2026-08-22", assigned: "Counselling" },
  { id: "RAH-2026-00126", holder: "Savita B.", district: "Pune", state: "Maharashtra", svi: 78, priority: "High", problem: "Caste-based Discrimination", status: "Legal Aid Requested", date: "2026-08-21", assigned: "Legal Aid" },
  { id: "RAH-2026-00127", holder: "Dinesh K.", district: "Solapur", state: "Maharashtra", svi: 72, priority: "High", problem: "Violence / Physical Assault", status: "Under Review", date: "2026-08-21", assigned: "Medical + Legal" },
  { id: "RAH-2026-00128", holder: "Meena R.", district: "Amravati", state: "Maharashtra", svi: 68, priority: "High", problem: "Displacement", status: "Support Assigned", date: "2026-08-20", assigned: "Counselling" },
  { id: "RAH-2026-00129", holder: "Ashok T.", district: "Aurangabad", state: "Maharashtra", svi: 57, priority: "Moderate", problem: "Legal Proceeding Distress", status: "In Progress", date: "2026-08-20", assigned: "Legal Aid" },
  { id: "RAH-2026-00130", holder: "Lakshmi P.", district: "Latur", state: "Maharashtra", svi: 52, priority: "Moderate", problem: "Social Boycott", status: "Assessment Pending", date: "2026-08-19", assigned: "—" },
  { id: "RAH-2026-00131", holder: "Suresh N.", district: "Kolhapur", state: "Maharashtra", svi: 48, priority: "Moderate", problem: "Caste-based Discrimination", status: "Counsellor Assigned", date: "2026-08-19", assigned: "Counselling" },
  { id: "RAH-2026-00132", holder: "Gita V.", district: "Jalgaon", state: "Maharashtra", svi: 44, priority: "Moderate", problem: "Threat / Intimidation", status: "Under Review", date: "2026-08-18", assigned: "—" },
  { id: "RAH-2026-00133", holder: "Ramesh D.", district: "Satara", state: "Maharashtra", svi: 38, priority: "Low", problem: "Legal Proceeding Distress", status: "Support Assigned", date: "2026-08-18", assigned: "Legal Aid" },
  { id: "RAH-2026-00134", holder: "Anita G.", district: "Sangli", state: "Maharashtra", svi: 32, priority: "Low", problem: "Social Boycott", status: "Resolved", date: "2026-08-17", assigned: "Counselling" },
  { id: "RAH-2026-00135", holder: "Mohan S.", district: "Raigad", state: "Maharashtra", svi: 28, priority: "Low", problem: "Caste-based Discrimination", status: "Closed", date: "2026-08-17", assigned: "Counselling" },
];

export const MONTHLY_DATA = [
  { month: "Mar", cases: 89, high: 24, critical: 8 },
  { month: "Apr", cases: 104, high: 31, critical: 12 },
  { month: "May", cases: 118, high: 35, critical: 15 },
  { month: "Jun", cases: 132, high: 42, critical: 18 },
  { month: "Jul", cases: 156, high: 51, critical: 21 },
  { month: "Aug", cases: 178, high: 58, critical: 24 },
];

export const PROBLEM_TYPE_DATA = [
  { name: "Threat/Intimidation", value: 312, color: "#c2410c" },
  { name: "Caste Discrimination", value: 284, color: "#1e4a75" },
  { name: "Social Boycott", value: 201, color: "#b45309" },
  { name: "Legal Distress", value: 178, color: "#235a8e" },
  { name: "Violence", value: 143, color: "#9b1c1c" },
  { name: "Displacement", value: 130, color: "#2e7d52" },
];

export const GEO_CLUSTERS = [
  { region: "Mumbai", lat: 19.08, lng: 72.88, cases: 84, avgSvi: 72, dominant: "Threat / Intimidation", highRisk: 43 },
  { region: "Nashik", lat: 19.99, lng: 73.79, cases: 57, avgSvi: 65, dominant: "Social Boycott", highRisk: 31 },
  { region: "Nagpur", lat: 21.15, lng: 79.09, cases: 41, avgSvi: 51, dominant: "Legal Proceeding Distress", highRisk: 22 },
  { region: "Pune", lat: 18.52, lng: 73.86, cases: 68, avgSvi: 69, dominant: "Caste Discrimination", highRisk: 38 },
  { region: "Aurangabad", lat: 19.88, lng: 75.34, cases: 33, avgSvi: 58, dominant: "Displacement", highRisk: 28 },
  { region: "Solapur", lat: 17.68, lng: 75.90, cases: 29, avgSvi: 61, dominant: "Threat / Intimidation", highRisk: 34 },
];

export const PRIORITY_DIST = [
  { name: "Critical", value: 46, color: "#9b1c1c" },
  { name: "High", value: 218, color: "#c2410c" },
  { name: "Moderate", value: 531, color: "#b45309" },
  { name: "Low", value: 453, color: "#2e7d52" },
];
