/**
 * Faith-crisis check, browser copy.
 *
 * This is a deliberate copy of `supabase/functions/_shared/safety.ts`.
 * Having it in the browser too means a person writing something heavy gets a
 * kind reply immediately — even if the network is slow, or the AI is not set
 * up at all. `tests/safety.test.ts` fails if the two copies drift apart.
 *
 * It is deliberately cautious: it looks for first-person distress, not for
 * the topic. "Why does God allow suffering?" is a normal practice question.
 * "I can't believe any more and I'm scared" is not.
 */

export const CRISIS_PATTERNS: RegExp[] = [
  /\bi (?:am|'m|m) (?:really )?(?:losing|loosing) (?:my )?(?:faith|iman|belief)/i,
  /\bi (?:don'?t|do not|can'?t) believe (?:in )?(?:allah|god|islam)? ?(?:any ?more|anymore)\b/i,
  /\bi (?:think|feel)? ?i(?:'m| am) (?:becoming|turning into) (?:an )?(?:atheist|ex-?muslim)/i,
  /\bi (?:want to|wanna|might) leave islam\b/i,
  /\bi(?:'m| am) (?:scared|terrified|afraid) (?:of|about|that) (?:losing|my) ?(?:my )?(?:faith|iman|belief)/i,
  /\bi feel (?:so )?(?:empty|hopeless|alone|lost) (?:about|with|in) (?:my )?(?:faith|deen|religion)/i,
  /\bmy (?:faith|iman) is (?:gone|dying|breaking|slipping)/i,
  /\bi hate (?:allah|god)\b/i,
  /\bwhat(?:'s| is) the point of (?:living|life)\b/i,
  /\bi (?:want|wanna) to (?:die|end it|kill myself)\b/i,
  /\bi(?:'m| am) (?:having|getting) a (?:faith|religious) crisis\b/i,
  /\bi can'?t (?:pray|make dua) any ?more\b/i,
  /\bthese doubts (?:are )?(?:killing|destroying|eating) me\b/i,
]

export const PRACTICE_MARKERS: RegExp[] = [
  /\b(?:for )?(?:practice|practise|practicing|practising|roleplay|role-play)\b/i,
  /\bpretend(?:ing)?\b/i,
  /\bhow (?:do|should|would) i (?:answer|reply|respond)\b/i,
  /\bmy friend (?:says|asked|thinks)\b/i,
  /\bsomeone (?:told|asked) me\b/i,
]

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

export interface SafetyCheck {
  crisis: boolean
  reply: string
}

export function checkSafetyLocal(text: string): SafetyCheck {
  const clean = (text ?? '').slice(0, 4000)
  if (PRACTICE_MARKERS.some((re) => re.test(clean))) return { crisis: false, reply: '' }
  const crisis = CRISIS_PATTERNS.some((re) => re.test(clean))
  return { crisis, reply: crisis ? CRISIS_REPLY : '' }
}
