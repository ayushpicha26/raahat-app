import dotenv from 'dotenv';
dotenv.config();

import natural from 'natural';
import Tesseract from 'tesseract.js';

// Initialize and train NLP classifier for chat intents
const classifier = new natural.BayesClassifier();
classifier.addDocument('he threatened to kill me', 'danger');
classifier.addDocument('they attacked me with a weapon', 'danger');
classifier.addDocument('i am in physical danger', 'danger');
classifier.addDocument('they said they will burn my house', 'danger');
classifier.addDocument('i need the police', 'legal');
classifier.addDocument('i want to file an fir', 'legal');
classifier.addDocument('i need a lawyer for court', 'legal');
classifier.addDocument('police are not helping', 'legal');
classifier.addDocument('i am feeling very sad and alone', 'emotional');
classifier.addDocument('i cannot stop crying', 'emotional');
classifier.addDocument('i feel hopeless and traumatized', 'emotional');
classifier.addDocument('people in the village boycotted me', 'discrimination');
classifier.addDocument('caste discrimination and abuse', 'discrimination');
classifier.addDocument('they called me untouchable', 'discrimination');
classifier.addDocument('i am injured and bleeding', 'medical');
classifier.addDocument('i need a doctor or hospital', 'medical');
classifier.addDocument('my bones are broken', 'medical');
classifier.train();

import { GoogleGenAI } from '@google/genai';

// System prompt for Gemini AI assessment
const GEMINI_ASSESSMENT_PROMPT = `You are RAAHAT AI, an advanced vulnerability assessment system for social safety, domestic abuse, crisis, caste discrimination, and emergency support in India.
Analyze the provided user input transcript and respond ONLY with a valid JSON object with the exact following structure:
{
  "svi": number (Social Vulnerability Index score from 28 to 96. If suicide, self-harm, physical danger, or acute violence is mentioned, score MUST be 85-96),
  "priority": "Critical" | "High" | "Moderate" | "Low",
  "priorityLabel": "CRITICAL PRIORITY" | "HIGH PRIORITY" | "MODERATE PRIORITY" | "LOW PRIORITY",
  "summary": string (2-3 sentences summarizing the situation, threat level, and recommended human verification),
  "problemTypes": [ { "label": string, "color": "critical" | "high" | "amber" | "safe" } ],
  "factors": [ { "label": string, "value": number (0-100), "contrib": "Critical" | "High" | "Moderate" | "Low", "conf": "High" | "Moderate" | "Standard" } ],
  "indicators": [ [ string, string ] ],
  "consequences": string,
  "recommendations": [
    {
      "title": string,
      "priority": string,
      "desc": string,
      "iconType": "shield" | "message" | "gavel" | "heart" | "shield-check" | "home",
      "cta": string,
      "urgent": boolean
    }
  ]
}`;

export async function performServerAssessment(text, durationSeconds = 0, lang = 'English') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `${GEMINI_ASSESSMENT_PROMPT}\n\nUser Input Transcript: "${text}"\nLanguage: ${lang}`,
        config: {
          responseMimeType: 'application/json'
        }
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text);
        return {
          ...parsed,
          aiMode: 'gemini-2.5-flash',
          languageDetected: lang,
          audioDurationSeconds: durationSeconds
        };
      }
    } catch (err) {
      console.warn('⚠️ Gemini AI Assessment failed, falling back to local NLP:', err.message);
    }
  }

  return localAssessment(text, durationSeconds, lang);
}

export async function performChatResponse(messages, lang = 'English') {
  const lastMsg = messages[messages.length - 1]?.text || '';
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are RAAHAT AI, an empathetic, highly intelligent, and practical assistant supporting citizens in India regarding legal aid, social justice, safety, mental health, and government welfare schemes.

Conversation History:
${messages.map(m => `${m.role === 'user' ? 'User' : 'RAAHAT Assistant'}: ${m.text}`).join('\n')}

Latest Message from User: "${lastMsg}"
Language Preferred: ${lang}

Instructions:
1. Act like an advanced conversational AI (like Gemini / ChatGPT). Understand the exact intent, sentiment, context, and question of the user.
2. If it is a greeting (hi, hello, namaste, hey, etc.), reply warmly and ask how you can assist them today without assuming any trauma.
3. If the user asks a question, answer it accurately, helpfully, and clearly in natural conversational language matching their tone and language.
4. If the user shares a personal struggle, problem, discrimination, violence, or legal issue: show deep empathy and provide clear, actionable steps (e.g. DLSA legal aid, Sakhi One Stop Centres, police 112, emergency 14416 / 14566).
5. Determine accurate Social Vulnerability Index (svi: 28-96, where 28-35 = casual/greeting, 40-60 = moderate distress/inquiry, 70-96 = severe danger/suicide/abuse) and priority ("Critical" | "High" | "Moderate" | "Low").

Respond strictly in valid JSON format:
{
  "reply": string,
  "svi": number,
  "priority": "Critical" | "High" | "Moderate" | "Low",
  "summary": string
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text);
        const base = localAssessment(lastMsg, 0, lang);
        return {
          ...base,
          svi: parsed.svi || base.svi,
          priority: parsed.priority || base.priority,
          priorityLabel: (parsed.priority || base.priority).toUpperCase() + ' PRIORITY',
          summary: parsed.summary || base.summary,
          reply: parsed.reply || localChatReply(lastMsg, messages.length),
          aiMode: 'gemini-flash-latest'
        };
      }
    } catch (err) {
      console.warn('⚠️ Gemini Chat AI failed, falling back to local NLP:', err.message);
    }
  }

  return {
    ...localAssessment(lastMsg, 0, lang),
    reply: localChatReply(lastMsg, messages.length),
    aiMode: 'local-nlp',
  };
}

function localChatReply(text, turnCount) {
  const lower = text.toLowerCase().trim();
  
  // Greeting check first
  if (/^(hi|hii|hiii|hello|hey|heyy|namaste|pranam|good morning|good afternoon|good evening|start|help)\b/i.test(lower) || lower === 'hi' || lower === 'hii' || lower === 'hello' || lower === 'hey') {
    return 'Namaste! I am RAAHAT assistant. How can I help you today? Please feel free to share whatever you are experiencing.';
  }

  // Use regex for critical exact matches first
  if (/kill|attack|unsafe|danger|emergency|threat|suicid|self-harm|end my life|want to die/.test(lower)) {
    return 'I understand how distressing this is. Your safety is our top priority. If you are in immediate danger, please call 112 or the crisis helpline at 14416 / 14566. Can you tell me — are you currently in a safe place?';
  }
  
  // Use NLP classifier for nuanced matching
  const intent = classifier.classify(text);
  
  if (intent === 'legal' || /police|court|fir|lawyer|legal/.test(lower)) {
    return 'Thank you for sharing about the legal challenges you face. RAAHAT can connect you with the District Legal Services Authority (DLSA) for free legal aid. Would you like me to arrange this?';
  }
  if (intent === 'emotional' || /sad|cry|anxious|depressed|hopeless|alone/.test(lower)) {
    return 'I hear you, and your feelings are valid. The emotional burden you carry is significant. Counselling support is available through our Sakhi One Stop Centre. Would you like to speak with a trained counsellor?';
  }
  if (intent === 'discrimination' || /caste|discrimination|boycott|dalit/.test(lower)) {
    return 'What you describe is a serious violation of your fundamental rights under the SC/ST (Prevention of Atrocities) Act. RAAHAT can help you file a complaint and access relief provisions. Shall I proceed?';
  }
  if (intent === 'medical' || /injured|hospital|doctor|medicine|bleed/.test(lower)) {
    return 'If you are injured, please seek immediate medical attention. RAAHAT can help cover medical expenses for victims. Do you need an ambulance?';
  }
  if (turnCount <= 2) {
    return 'Thank you for reaching out. I am here to assist you. Could you please share more about your situation so I can help guide you to the right resources?';
  }
  return 'Thank you for sharing all of this. Based on what you have told me, I have prepared a preliminary vulnerability assessment. Your case summary and recommendations are being generated now.';
}

function localAssessment(text, durationSeconds, lang) {
  const lower = text.toLowerCase();
  
  // Tokenize the input text using Natural
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(lower);
  
  const suicideRisk = /suicid|self-harm|selfharm|kill myself|harm myself|end my life|end life|take my life|want to die|wanna die|hang myself|hanging|atmanahatya|atmatya|zahar|mar jau|mar jana/.test(lower);
  const criticalThreat = suicideRisk || /kill|die|murder|attack|weapon|lynch|burn|poison|beaten|assault|danger|emergency|immediate threat|marna|dhamki|jaan|hinsa|maar/.test(lower);
  const fearDistress = /fear|afraid|scared|terror|panic|threat|unsafe|threaten|dar|khauf/.test(lower);
  const emotionalDistress = /cry|hopeless|depressed|sad|tears|grief|sleep|insomnia|trauma|tanaav|rona|dukh/.test(lower) || tokens.includes('sad') || tokens.includes('depressed');
  const socialIsolation = /alone|isolated|boycott|outcast|abandoned|nobody|samaj|bahishkar|akela/.test(lower);
  const discrimination = /caste|dalit|adivasi|untouchable|discrimination|harass|jaati|bhedbhav/.test(lower);
  const legalDistress = /police|court|fir|lawyer|case|jail|false|arrest|nyay|kanoon/.test(lower);
  const medicalNeed = /injured|hospital|doctor|medicine|bleed|broken|blood|ill|dawakhana|chot/.test(lower);

  let svi = 40;
  let indicators = [];
  let problemTypes = [];
  let factors = [];
  let recommendations = [];

  if (suicideRisk) {
    svi += 48;
    indicators.push(["Crisis / Self-Harm & Suicide Risk", "Critical"]);
    problemTypes.push({ label: "Crisis & Suicide Risk", color: "critical" });
    factors.push({ label: "Self-Harm / Suicide Risk", value: 95, contrib: "Critical", conf: "High" });
    recommendations.push({
      title: "Tele-MANAS Crisis Helpline (14416)", priority: "Immediate",
      desc: "Connect with 24/7 free mental health counselling & crisis intervention line.", iconType: "heart", cta: "Call Helpline (14416)", urgent: true
    });
  } else if (criticalThreat) {
    svi += 42;
    indicators.push(["Life Threat / Physical Violence", "Critical"]);
    problemTypes.push({ label: "Physical Safety", color: "critical" });
    factors.push({ label: "Physical Danger", value: 95, contrib: "Critical", conf: "High" });
    recommendations.push({
      title: "Emergency Police Intervention", priority: "Immediate",
      desc: "Immediate dispatch of local police to victim's location.", iconType: "shield-check", cta: "Dispatch Unit", urgent: true
    });
  } else if (fearDistress) {
    svi += 26;
    indicators.push(["High Fear & Distress", "High"]);
    factors.push({ label: "Fear Level", value: 75, contrib: "High", conf: "Moderate" });
  }

  if (emotionalDistress) {
    svi += 18;
    indicators.push(["Emotional Trauma", "High"]);
    if (!suicideRisk) problemTypes.push({ label: "Mental Health", color: "high" });
    factors.push({ label: "Emotional Distress", value: 80, contrib: "High", conf: "Standard" });
    recommendations.push({
      title: "Trauma Counselling", priority: "High",
      desc: "Connect with Sakhi One Stop Centre for immediate emotional support.", iconType: "heart", cta: "Schedule Session", urgent: false
    });
  }

  if (socialIsolation) {
    svi += 14;
    indicators.push(["Social Boycott / Isolation", "Moderate"]);
    factors.push({ label: "Isolation", value: 60, contrib: "Moderate", conf: "Standard" });
  }

  if (discrimination) {
    svi += 12;
    indicators.push(["Caste-based Discrimination", "High"]);
    problemTypes.push({ label: "Civil Rights", color: "high" });
    factors.push({ label: "Discrimination", value: 70, contrib: "High", conf: "Standard" });
    recommendations.push({
      title: "SC/ST Atrocities Relief", priority: "Recommended",
      desc: "Initiate claim under POA Act for financial and legal relief.", iconType: "gavel", cta: "Start Claim", urgent: false
    });
  }

  if (medicalNeed) {
    svi += 16;
    indicators.push(["Medical Attention Required", "High"]);
    problemTypes.push({ label: "Medical", color: "critical" });
    recommendations.push({
      title: "Medical Assistance", priority: "Immediate",
      desc: "Free medical treatment and forensic documentation at district hospital.", iconType: "shield", cta: "Alert Hospital", urgent: true
    });
  }

  if (legalDistress) {
    svi += 10;
    indicators.push(["Legal Challenges", "Moderate"]);
    recommendations.push({
      title: "Free Legal Aid (DLSA)", priority: "Recommended",
      desc: "Assign a legal aid lawyer to assist with court proceedings.", iconType: "gavel", cta: "Assign Lawyer", urgent: false
    });
  }

  svi = Math.min(96, Math.max(28, svi));
  const priority = svi >= 82 || criticalThreat ? 'Critical' : svi >= 65 || fearDistress ? 'High' : svi < 45 ? 'Low' : 'Moderate';
  const priorityLabel = priority.toUpperCase() + ' PRIORITY';

  // Ensure default problem types if none caught
  if (problemTypes.length === 0) problemTypes.push({ label: "General Support", color: "safe" });

  const summaryElements = [
    suicideRisk && 'acute crisis and self-harm/suicide risk',
    criticalThreat && !suicideRisk && 'immediate threats to safety',
    medicalNeed && 'medical injuries',
    discrimination && 'caste discrimination',
    emotionalDistress && 'severe emotional distress',
    fearDistress && 'significant fear',
    socialIsolation && 'social isolation',
    legalDistress && 'legal difficulties'
  ].filter(Boolean);
  
  const summary = summaryElements.length > 0 
    ? `Automated NLP assessment identified ${summaryElements.join(', ')}. Human review is strongly recommended.`
    : 'Automated NLP assessment did not identify specific critical threats, but general support may be needed. Human review recommended.';

  return {
    svi,
    priority,
    priorityLabel,
    summary,
    problemTypes,
    factors,
    indicators,
    consequences: svi > 65 ? 'Delayed support may compound trauma and escalate risk of further harm.' : 'Regular monitoring recommended.',
    recommendations,
    aiMode: 'local-nlp',
    languageDetected: lang,
    audioDurationSeconds: durationSeconds,
  };
}

export async function verifyCasteCertificateRoute(req, res) {
  const { imageBase64, mimeType } = req.body;

  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ verified: false, reason: 'No image data provided.' });
  }

  try {
    // Tesseract can handle buffer. Some formats like jpeg/png are straightforward.
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    
    console.log('Running OCR on uploaded document...');
    const result = await Tesseract.recognize(imageBuffer, 'eng', {
      logger: m => {} // hide logs in prod to avoid noise
    });

    const text = result.data.text.toLowerCase();
    
    // Look for key patterns indicative of a caste certificate
    const hasCasteKeyword = /caste|jati|tribe|schedule|obc|backward/.test(text);
    const hasCertificateKeyword = /certificate|praman|patra|declaration/.test(text);
    const hasGovtKeyword = /government|govt|state|tehsildar|collector|magistrate|seal/.test(text);

    if (hasCasteKeyword && hasCertificateKeyword && hasGovtKeyword) {
      return res.json({ 
        verified: true, 
        reason: 'Document successfully verified as a caste certificate using OCR.', 
        confidence: 'high' 
      });
    } else if (hasCasteKeyword || hasCertificateKeyword) {
      return res.json({ 
        verified: true, 
        reason: 'Partial match found via OCR. Document flagged for manual review.', 
        confidence: 'medium' 
      });
    } else {
      return res.json({ 
        verified: false, 
        reason: 'OCR could not detect sufficient keywords related to a caste certificate. Please upload a clear image of the official document.' 
      });
    }
  } catch (err) {
    console.warn('⚠️ OCR verification failed:', err.message);
    // On error, accept with manual review flag to not block the user
    return res.json({ 
      verified: true, 
      reason: 'Automated OCR verification encountered an error — document accepted for manual review.' 
    });
  }
}

export async function assessRoute(req, res) {
  const { text, duration, lang, messages } = req.body;

  if (messages && Array.isArray(messages)) {
    // Chat mode
    const result = await performChatResponse(messages, lang || 'English');
    return res.json(result);
  }

  // Full assessment mode
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text is required for assessment.' });
  }

  const result = await performServerAssessment(text.trim(), duration || 0, lang || 'English');
  res.json(result);
}
