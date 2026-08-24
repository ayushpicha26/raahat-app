import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let model = null;

const SYSTEM_PROMPT = `You are RAAHAT, an empathetic Indian government victim-support AI assistant.

Your role: Analyze victim testimony text and produce a structured vulnerability assessment.

Rules:
- Never diagnose medical/psychiatric conditions
- Never claim to be a therapist, police officer, or decision-maker
- Focus on identifying vulnerability indicators: threats, distress, discrimination, isolation, medical needs
- Be culturally sensitive to Indian social dynamics (caste, community, gender)
- Support Hindi, Marathi, and English inputs
- Always recommend professional human review for critical cases

Output ONLY valid JSON with this exact structure:
{
  "svi": <number 0-100, Stress Vulnerability Index>,
  "priority": "<Critical|High|Moderate|Low>",
  "priorityLabel": "<CRITICAL PRIORITY|HIGH PRIORITY|MODERATE PRIORITY|LOW PRIORITY>",
  "summary": "<2-3 sentence clinical summary of the case>",
  "problemTypes": [{"label": "<type>", "color": "<critical|high|amber|safe>"}],
  "factors": [{"label": "<factor name>", "value": <0-100>, "contrib": "<Critical|Very High|High|Moderate|Low>", "conf": "<High|Moderate|Standard>"}],
  "indicators": [["<indicator name>", "<Critical|High|Moderate|Low>"]],
  "consequences": "<what may happen without intervention>",
  "reply": "<empathetic response to the victim, 2-3 sentences, in the same language they used>",
  "recommendations": [{"title": "<scheme/service>", "priority": "<Immediate|High|Recommended|Available>", "desc": "<description>", "iconType": "<shield|message|gavel|heart|shield-check|home>", "cta": "<call to action>", "urgent": <true|false>}]
}

Assessment factors to evaluate:
1. Emotional Distress (depression, anxiety, hopelessness, trauma)
2. Fear / Threat Level (violence threats, intimidation, harassment)
3. Anxiety Indicators (panic, sleep disturbance, hypervigilance)
4. Social Isolation (boycott, ostracism, lack of support network)
5. Immediate Safety Concerns (physical danger, weapon threats)
6. Overall Case Severity (combined assessment)
7. Local Support Availability (presence/absence of help)

SVI Scoring Guide:
- 85-100: Critical — immediate danger, threats to life, active violence
- 65-84: High — significant distress, ongoing harassment, discrimination
- 45-64: Moderate — concerning situation, needs support and monitoring
- 0-44: Low — situation manageable, follow-up recommended`;

function initializeAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return false;

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    });
    console.log('✅ Gemini AI initialized (model: gemini-3.6-flash)');
    return true;
  } catch (err) {
    console.warn('⚠️ Gemini AI initialization failed:', err.message);
    return false;
  }
}

/**
 * Server-side AI assessment using Gemini API.
 * Falls back to local pattern-matching if API is unavailable.
 */
export async function performServerAssessment(text, durationSeconds = 0, lang = 'English') {
  // Try Gemini first
  if (!model) initializeAI();

  if (model) {
    try {
      const prompt = `Analyze this victim testimony and provide a vulnerability assessment.\n\nLanguage: ${lang}\nDuration: ${durationSeconds}s\n\nTestimony:\n"${text}"`;

      const result = await model.generateContent(prompt);

      const response = result.response;
      const jsonText = response.text();
      const parsed = JSON.parse(jsonText);

      // Validate required fields
      if (parsed.svi !== undefined && parsed.priority && parsed.summary) {
        return {
          ...parsed,
          aiMode: 'gemini',
          languageDetected: lang,
          audioDurationSeconds: durationSeconds,
        };
      }
    } catch (err) {
      console.warn('⚠️ Gemini assessment failed, falling back to local:', err.message);
    }
  }

  // Fallback to local pattern matching
  return localAssessment(text, durationSeconds, lang);
}

/**
 * Chat-style AI conversation using Gemini API.
 */
export async function performChatResponse(messages, lang = 'English') {
  if (!model) initializeAI();

  if (model) {
    try {
      const chatPrompt = `You are RAAHAT, an empathetic Indian government victim support assistant. Respond in ${lang}.

Rules:
- Be warm, empathetic, and culturally sensitive
- Ask gentle follow-up questions to understand the situation
- Never diagnose or make legal promises
- If urgent danger is indicated, recommend calling 112 or 14566
- Keep responses to 2-4 sentences
- Respond in the same language the user writes in

Return JSON: {"reply": "<your response>", "svi": <current estimate 0-100>, "priority": "<Critical|High|Moderate|Low>", "indicators": ["<detected indicator>"]}

Conversation so far:
${messages.map(m => `${m.role === 'user' ? 'Victim' : 'RAAHAT'}: ${m.text}`).join('\n')}`;

      const result = await model.generateContent(chatPrompt);
      const parsed = JSON.parse(result.response.text());
      return { ...parsed, aiMode: 'gemini' };
    } catch (err) {
      console.warn('⚠️ Gemini chat failed, using local fallback:', err.message);
    }
  }

  // Local fallback
  const lastMsg = messages[messages.length - 1]?.text || '';
  return {
    ...localAssessment(lastMsg, 0, lang),
    reply: localChatReply(lastMsg, messages.length),
    aiMode: 'local-fallback',
  };
}

function localChatReply(text, turnCount) {
  const lower = text.toLowerCase();
  if (/kill|attack|unsafe|danger|emergency|threat/.test(lower)) {
    return 'I understand how distressing this is. Your safety is our top priority. If you are in immediate danger, please call 112 or the victim helpline at 14566. Can you tell me — are you currently in a safe place?';
  }
  if (/police|court|fir|lawyer|legal/.test(lower)) {
    return 'Thank you for sharing about the legal challenges you face. RAAHAT can connect you with the District Legal Services Authority (DLSA) for free legal aid. Would you like me to arrange this?';
  }
  if (/sad|cry|anxious|depressed|hopeless|alone/.test(lower)) {
    return 'I hear you, and your feelings are valid. The emotional burden you carry is significant. Counselling support is available through our Sakhi One Stop Centre. Would you like to speak with a trained counsellor?';
  }
  if (/caste|discrimination|boycott|dalit/.test(lower)) {
    return 'What you describe is a serious violation of your fundamental rights under the SC/ST (Prevention of Atrocities) Act. RAAHAT can help you file a complaint and access relief provisions. Shall I proceed?';
  }
  if (turnCount <= 2) {
    return 'Thank you for sharing that. I understand this may be difficult. Can you tell me more about how this situation has affected you and your family? Are you currently safe?';
  }
  return 'Thank you for sharing all of this. Based on what you have told me, I have prepared a preliminary vulnerability assessment. Your case summary and recommendations are being generated now.';
}

function localAssessment(text, durationSeconds, lang) {
  const lower = text.toLowerCase();
  const criticalThreat = /kill|die|murder|attack|weapon|lynch|burn|beaten|assault|danger|emergency|marna|dhamki|jaan|hinsa/.test(lower);
  const fearDistress = /fear|afraid|scared|terror|panic|threat|unsafe|threaten|dar|khauf/.test(lower);
  const emotionalDistress = /cry|hopeless|depressed|sad|tears|grief|cannot sleep|insomnia|trauma|tanaav|rona|dukh/.test(lower);
  const socialIsolation = /alone|isolated|boycott|outcast|abandoned|nobody|samaj|bahishkar|akela/.test(lower);
  const discrimination = /caste|dalit|adivasi|untouchable|discrimination|harass|jaati|bhedbhav/.test(lower);
  const legalDistress = /police|court|fir|lawyer|case|jail|false|arrest|nyay|kanoon/.test(lower);
  const medicalNeed = /injured|hospital|doctor|medicine|bleed|broken|blood|ill|dawakhana|chot/.test(lower);

  let svi = 40;
  if (criticalThreat) svi += 42;
  else if (fearDistress) svi += 26;
  if (emotionalDistress) svi += 18;
  if (socialIsolation) svi += 14;
  if (discrimination) svi += 12;
  if (medicalNeed) svi += 16;
  if (legalDistress) svi += 10;

  svi = Math.min(96, Math.max(28, svi));

  const priority = svi >= 82 || criticalThreat ? 'Critical' : svi >= 65 || fearDistress ? 'High' : svi < 45 ? 'Low' : 'Moderate';
  const priorityLabel = priority.toUpperCase() + ' PRIORITY';

  return {
    svi,
    priority,
    priorityLabel,
    summary: `Local AI assessment based on keyword analysis. Detected: ${[criticalThreat && 'threats', fearDistress && 'fear', emotionalDistress && 'distress', socialIsolation && 'isolation', discrimination && 'discrimination'].filter(Boolean).join(', ') || 'general concern'}. Human review recommended.`,
    problemTypes: [],
    factors: [],
    indicators: [],
    consequences: 'Delayed support may compound trauma and escalate risk.',
    recommendations: [],
    aiMode: 'local-fallback',
    languageDetected: lang,
    audioDurationSeconds: durationSeconds,
  };
}

// ── API Route Handler ──
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
