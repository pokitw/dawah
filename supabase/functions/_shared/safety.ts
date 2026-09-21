/**
 * Faith-crisis check.
 *
 * The AI is told about this in every prompt, but a real cry for help should
 * never depend on the model noticing. This is a plain, boring keyword check
 * that runs FIRST, so a person in distress always gets a kind reply instead
 * of a debate — even if the AI call fails.
 *
 * It is deliberately cautious: it looks for first-person distress, not for
 * the topic. "Why does God allow suffering?" is a normal practice question.
 * "I can't believe any more and I'm scared" is not.
 *
 * This is a deliberate copy of `src/lib/safety.ts` so the browser can do the
 * same check instantly. `tests/safety.test.ts` fails if the two drift apart.
 */

const CRISIS_PATTERNS: RegExp[] = [
  // `I'm` is far more common than `I am`, and the apostrophe may be straight
  // or curly, so every first-person pattern below accepts all three forms.
  /\bi(?:'m|’m| am|m)\s+(?:really\s+)?(?:losing|loosing)\s+(?:my\s+)?(?:faith|iman|belief|religion)/i,
  /\bi\s+(?:don'?t|do not|can'?t|cannot)\s+believe\s+(?:in\s+)?(?:allah|god|islam|any\s+of\s+it)?\s*(?:any\s?more|anymore)\b/i,
  /\bi(?:'m|’m| am)?\s*(?:think|feel)?\s*i?(?:'m|’m| am)?\s*(?:becoming|turning into)\s+(?:an?\s+)?(?:atheist|ex-?muslim|non-?believer)/i,
  /\bi\s+(?:want to|wanna|might|am going to)\s+leave\s+(?:islam|the\s+deen|my\s+religion)\b/i,
  /\bi(?:'m|’m| am)\s+(?:scared|terrified|afraid)\s+(?:of|about|that)\s+(?:i(?:'m|’m| am)\s+)?(?:losing|loosing)?\s*(?:my\s+)?(?:faith|iman|belief)/i,
  /\bi\s+feel\s+(?:so\s+)?(?:empty|hopeless|alone|lost)\s+(?:about|with|in)\s+(?:my\s+)?(?:faith|deen|religion)/i,
  /\bmy\s+(?:faith|iman)\s+is\s+(?:gone|dying|breaking|slipping|disappearing)/i,
  /\bi\s+hate\s+(?:allah|god)\b/i,
  /\bwhat(?:'s|’s| is)\s+the\s+point\s+of\s+(?:living|life|anything)\b/i,
  /\bi\s+(?:want|wanna)\s+to\s+(?:die|end it|kill myself)\b/i,
  /\bi(?:'m|’m| am)\s+(?:having|getting|in)\s+a\s+(?:faith|religious)\s+crisis\b/i,
  /\bi\s+can'?t\s+(?:pray|make dua)\s+any\s?more\b/i,
  /\bthese\s+doubts\s+(?:are\s+)?(?:killing|destroying|eating)\s+me\b/i,
  /\bi(?:'m|’m| am)\s+(?:losing|loosing)\s+my\s+(?:religion|deen)\b/i,
]

/** Phrases that mean "I am practising", which cancel a false alarm. */
const PRACTICE_MARKERS: RegExp[] = [
  /\b(?:for )?(?:practice|practise|practicing|practising|roleplay|role-play)\b/i,
  /\bpretend(?:ing)?\b/i,
  /\bhow (?:do|should|would|can) i (?:answer|reply|respond|deal with)\b/i,
  /\bmy friend (?:says|asked|thinks|told)\b/i,
  /\bsomeone (?:told|asked|says to) me\b/i,
  /\bwhat (?:do|should) i say (?:to|when|if)\b/i,
]

export interface SafetyCheck {
  crisis: boolean
  /** The warm reply to send instead of a debate, when `crisis` is true. */
  reply: string
}

export const CRISIS_REPLY = `Let's pause the practice for a moment. 🤍

What you wrote sounds like it is coming from a real, heavy place, not from an exercise. That matters more than any debate.

**Please know:** having doubts does not make you a bad Muslim. Doubts are normal. Many strong believers have had them, and the Prophet ﷺ taught us what to do when they come — seek refuge in Allah and stop arguing with the whisper (Sahih al-Bukhari 3276, Sahih Muslim 134).

**Some gentle steps:**
- Talk to someone you trust — a family member, a friend, or a local imam.
- Bring the questions to a qualified scholar. You are allowed to ask. (islamqa.org 169537 is about exactly this.)
- Make dua, even short and tired ones. Keep good company.
- Be kind to yourself. You do not have to solve everything today.

**If you are thinking about hurting yourself, please reach out to someone right now** — a person you trust, or your local emergency number or crisis line. You should not carry that alone.

I am here whenever you want to go back to practising. There is no rush.`

export function checkSafety(text: string): SafetyCheck {
  const clean = (text ?? '').slice(0, 4000)
  if (PRACTICE_MARKERS.some((re) => re.test(clean))) return { crisis: false, reply: '' }
  const crisis = CRISIS_PATTERNS.some((re) => re.test(clean))
  return { crisis, reply: crisis ? CRISIS_REPLY : '' }
}
