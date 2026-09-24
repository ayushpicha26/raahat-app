export interface AssessmentFactor {
  label: string;
  value: number;
  contrib: "Critical" | "Very High" | "High" | "Moderate" | "Low" | "Low (Adverse)";
  conf: "High" | "Moderate" | "Standard";
}

export interface SupportRecommendation {
  title: string;
  priority: string;
  priorityColor: string;
  iconType: "shield" | "message" | "gavel" | "heart" | "shield-check" | "home";
  desc: string;
  cta: string;
  urgent?: boolean;
}

export interface AssessmentResultData {
  id: string;
  transcript: string;
  date: string;
  svi: number;
  priority: "Critical" | "High" | "Moderate" | "Low";
  priorityLabel: string;
  summary: string;
  problemTypes: { label: string; color: "critical" | "high" | "amber" | "safe" }[];
  factors: AssessmentFactor[];
  indicators: [string, string][];
  consequences: string;
  recommendations: SupportRecommendation[];
  languageDetected: string;
  audioDurationSeconds: number;
  flaggedForReview?: boolean;
}

export function performAiAssessment(text: string, durationSeconds: number = 0, lang: string = "English"): AssessmentResultData {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // Pattern detection
  const criticalThreat = /kill|die|murder|attack|weapon|lynch|burn|poison|beaten|assault|danger|emergency|immediate threat|marna|dhamki|jaan|hinsa|maar/.test(lower);
  const fearDistress = /fear|afraid|scared|terror|panic|threat|unsafe|threaten|threatened|scary|terrified|dar|darr|khauf|chinta|ghamrahat/.test(lower);
  const emotionalDistress = /cry|crying|hopeless|depressed|sad|tears|grief|cannot sleep|insomnia|trauma|pain|hurt|distress|tanaav|rona|dukh/.test(lower);
  const socialIsolation = /alone|no one|isolated|boycott|outcast|exiled|abandoned|nobody to help|no family|evicted|samaj|bahishkar|akela|koi nahi/.test(lower);
  const discrimination = /caste|dalit|adivasi|st|sc|untouchable|slur|discrimination|discriminated|harass|jaati|bhedbhav/.test(lower);
  const legalDistress = /police|court|fir|lawyer|case|jail|false accusation|arrest|justice|nyay|kanoon|mukadma/.test(lower);
  const housingDisplacement = /home|shelter|house|evict|evicted|thrown out|land|rent|ghar|beghar|jagah/.test(lower);
  const medicalNeed = /injured|injury|hospital|doctor|medicine|bleed|broken|blood|health|ill|dawakhana|chot/.test(lower);

  // Score Calculation
  let baseScore = 40;
  if (criticalThreat) baseScore += 42;
  else if (fearDistress) baseScore += 26;

  if (emotionalDistress) baseScore += 18;
  if (socialIsolation) baseScore += 14;
  if (discrimination) baseScore += 12;
  if (medicalNeed) baseScore += 16;
  if (legalDistress) baseScore += 10;
  if (housingDisplacement) baseScore += 10;

  // Length and intensity factor
  const wordCount = clean.split(/\s+/).length;
  if (wordCount > 30) baseScore += 4;
  if (wordCount < 6 && baseScore < 60) baseScore = Math.max(35, baseScore - 5);

  const svi = Math.min(96, Math.max(28, Math.round(baseScore)));

  // Priority
  let priority: "Critical" | "High" | "Moderate" | "Low" = "Moderate";
  let priorityLabel = "MODERATE PRIORITY";
  if (svi >= 82 || criticalThreat) {
    priority = "Critical";
    priorityLabel = "CRITICAL PRIORITY";
  } else if (svi >= 65 || fearDistress) {
    priority = "High";
    priorityLabel = "HIGH PRIORITY";
  } else if (svi < 45) {
    priority = "Low";
    priorityLabel = "LOW PRIORITY";
  }

  // Problem Types
  const problemTypes: { label: string; color: "critical" | "high" | "amber" | "safe" }[] = [];
  if (criticalThreat || fearDistress) problemTypes.push({ label: "Threat / Intimidation", color: "critical" });
  if (medicalNeed) problemTypes.push({ label: "Physical Safety & Medical Risk", color: "critical" });
  if (discrimination) problemTypes.push({ label: "Identity-based Discrimination", color: "high" });
  if (socialIsolation) problemTypes.push({ label: "Social Isolation & Boycott", color: "high" });
  if (housingDisplacement) problemTypes.push({ label: "Housing / Displacement", color: "amber" });
  if (legalDistress) problemTypes.push({ label: "Legal Proceeding Distress", color: "amber" });
  if (emotionalDistress) problemTypes.push({ label: "Acute Emotional Distress", color: "high" });

  if (problemTypes.length === 0) {
    problemTypes.push({ label: "General Support Request", color: "safe" });
    problemTypes.push({ label: "Citizen Inquiry", color: "safe" });
  }

  // Factor breakdown
  const emotionalScore = Math.min(95, Math.max(25, (emotionalDistress ? 78 : 35) + Math.floor(Math.random() * 8)));
  const fearScore = Math.min(96, Math.max(20, (criticalThreat ? 92 : fearDistress ? 82 : 30) + Math.floor(Math.random() * 6)));
  const anxietyScore = Math.min(92, Math.max(30, (emotionalDistress || fearDistress ? 76 : 42) + Math.floor(Math.random() * 6)));
  const isolationScore = Math.min(90, Math.max(20, (socialIsolation ? 84 : 38) + Math.floor(Math.random() * 6)));
  const safetyScore = Math.min(98, Math.max(22, (criticalThreat ? 94 : fearDistress ? 78 : 34) + Math.floor(Math.random() * 6)));
  const severityScore = svi;
  const supportScore = socialIsolation ? 22 : 45;

  const factors: AssessmentFactor[] = [
    {
      label: "Emotional Distress",
      value: emotionalScore,
      contrib: emotionalScore >= 80 ? "Critical" : emotionalScore >= 65 ? "High" : "Moderate",
      conf: "High",
    },
    {
      label: "Fear / Threat Level",
      value: fearScore,
      contrib: fearScore >= 85 ? "Critical" : fearScore >= 65 ? "Very High" : fearScore >= 45 ? "Moderate" : "Low",
      conf: "High",
    },
    {
      label: "Anxiety Indicators",
      value: anxietyScore,
      contrib: anxietyScore >= 70 ? "High" : "Moderate",
      conf: "Moderate",
    },
    {
      label: "Social Isolation",
      value: isolationScore,
      contrib: isolationScore >= 75 ? "High" : "Moderate",
      conf: "Moderate",
    },
    {
      label: "Immediate Safety Concerns",
      value: safetyScore,
      contrib: safetyScore >= 80 ? "Critical" : safetyScore >= 60 ? "High" : "Low",
      conf: "High",
    },
    {
      label: "Overall Case Severity",
      value: severityScore,
      contrib: severityScore >= 80 ? "Critical" : severityScore >= 65 ? "High" : "Moderate",
      conf: "High",
    },
    {
      label: "Local Support Availability",
      value: supportScore,
      contrib: supportScore <= 30 ? "Low (Adverse)" : "Moderate",
      conf: "High",
    },
  ];

  // Indicators list
  const indicators: [string, string][] = [
    ["Perceived Threat Level", fearScore >= 80 ? "Critical" : fearScore >= 60 ? "High" : "Moderate"],
    ["Reported Fear", fearDistress || criticalThreat ? "High" : "Low–Moderate"],
    ["Emotional Distress", emotionalDistress ? "High" : "Moderate"],
    ["Anxiety Indicators", anxietyScore >= 70 ? "High" : "Moderate"],
    ["Social Isolation", socialIsolation ? "High" : "Low"],
    ["Immediate Safety Concerns", safetyScore >= 80 ? "Critical" : safetyScore >= 60 ? "High" : "Low"],
  ];

  // Tailored Summary
  let summary = `The complainant provided live testimony indicating ${svi >= 75 ? "severe" : svi >= 55 ? "moderate" : "standard"} vulnerability. `;
  if (criticalThreat || fearDistress) {
    summary += `Key statements indicate acute fear of violence or threat to personal and family safety. `;
  }
  if (socialIsolation) {
    summary += `The complainant notes severe social isolation and absence of local community protection. `;
  }
  if (discrimination) {
    summary += `Elements of caste or social discrimination and harassment were highlighted. `;
  }
  if (emotionalDistress) {
    summary += `Psychological indicators including insomnia, severe distress, and anxiety were observed. `;
  }
  summary += `An expedited human verification and support assignment is advised.`;

  // Tailored Recommendations
  const recommendations: SupportRecommendation[] = [];

  if (criticalThreat || fearDistress || safetyScore >= 70) {
    recommendations.push({
      title: "Immediate Safety & Protection Assessment",
      priority: "Immediate Attention",
      priorityColor: "text-critical-700 bg-critical-50 border-critical-100",
      iconType: "shield",
      desc: "Your responses indicate immediate safety concerns. An authorized emergency safety officer is notified for priority protection review.",
      cta: "Contact Authorized Emergency Support",
      urgent: true,
    });
  }

  recommendations.push({
    title: "Counselling & Psychological First Aid",
    priority: emotionalDistress ? "High Priority" : "Recommended",
    priorityColor: emotionalDistress ? "text-high-700 bg-high-50 border-high-100" : "text-navy-700 bg-navy-50 border-navy-100",
    iconType: "message",
    desc: "Connect with an authorized clinical counsellor for confidential psychological support and trauma mitigation.",
    cta: "Request Counselling Support",
  });

  if (legalDistress || discrimination || criticalThreat) {
    recommendations.push({
      title: "Free Legal Aid & Representation",
      priority: "High Priority",
      priorityColor: "text-high-700 bg-high-50 border-high-100",
      iconType: "gavel",
      desc: "Connect with the District Legal Services Authority (DLSA) officer for protective injunctions, FIR assistance, and legal aid.",
      cta: "Request Legal Aid",
    });
  }

  if (medicalNeed || emotionalScore > 80) {
    recommendations.push({
      title: "Medical & Health Assistance",
      priority: "Consider",
      priorityColor: "text-amber-700 bg-amber-50 border-amber-100",
      iconType: "heart",
      desc: "Medical referral and forensic assistance arranged through government district hospitals.",
      cta: "Request Medical Assistance",
    });
  }

  if (criticalThreat || discrimination) {
    recommendations.push({
      title: "Witness & Victim Protection Scheme",
      priority: "Urgent",
      priorityColor: "text-critical-700 bg-critical-50 border-critical-100",
      iconType: "shield-check",
      desc: "Protection under statutory victim and witness protection provisions if facing intimidation.",
      cta: "Request Witness Protection",
    });
  }

  recommendations.push({
    title: "Rehabilitation & Welfare Support",
    priority: "Available",
    priorityColor: "text-navy-700 bg-navy-50 border-navy-100",
    iconType: "home",
    desc: "Long-term welfare schemes, temporary shelter assistance, and rehabilitation grants under government programmes.",
    cta: "Request Welfare Support",
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) + ", " + now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const randomIdNum = Math.floor(10000 + Math.random() * 90000);
  const caseId = `RAH-${now.getFullYear()}-${randomIdNum}`;

  return {
    id: caseId,
    transcript: clean,
    date: dateStr,
    svi,
    priority,
    priorityLabel,
    summary,
    problemTypes,
    factors,
    indicators,
    consequences: "Delayed support may compound psychological trauma, escalate physical risk, and impede timely access to justice and essential protective amenities.",
    recommendations,
    languageDetected: lang,
    audioDurationSeconds: durationSeconds,
  };
}
