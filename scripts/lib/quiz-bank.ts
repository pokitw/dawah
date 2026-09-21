/**
 * Extra quiz questions, one small set per module.
 *
 * File 08 only gives 5 sample questions, but the learning path has 12
 * modules. Every question below only restates something that is already
 * written in /research files 01-05 - no new Islamic claims are invented.
 * `cites` points at the id in docs/knowledge-map.md it came from.
 */
import type { QuizQuestion } from './types.ts'

type Raw = {
  module: string
  question: string
  choices: [string, string, string, string]
  answer: 0 | 1 | 2 | 3
  explanation: string
  cites: string[]
}

const RAW: Raw[] = [
  // ---------------------------------------------------------- Module 1.1 --
  {
    module: '1.1',
    question: 'An argument is VALID when:',
    choices: [
      'All of its premises are true',
      'If the premises were true, the conclusion would have to be true',
      'Most people agree with it',
      'It quotes a famous scholar',
    ],
    answer: 1,
    explanation:
      'Valid is about the SHAPE. Sound is stronger: valid AND the premises are really true.',
    cites: ['guide-valid-vs-sound'],
  },
  {
    module: '1.1',
    question: 'What is a "contingent" thing?',
    choices: [
      'Something that must exist and cannot not exist',
      'Something that could have not existed, and depends on something else',
      'Something only scientists can measure',
      'Something that has no cause',
    ],
    answer: 1,
    explanation:
      'You, a tree and a star are contingent. A necessary being is the opposite: it must exist and depends on nothing.',
    cites: ['glossary-contingent', 'glossary-necessary-being'],
  },
  {
    module: '1.1',
    question: 'What does "steelman" mean?',
    choices: [
      'Twisting the other side into a weak version',
      'Saying the other side’s view in its strongest, fairest form first',
      'Refusing to listen to the other side',
      'Winning by shouting louder',
    ],
    answer: 1,
    explanation:
      'The opposite is a strawman, which is a fallacy. Steelmanning builds trust and is better dawah (16:125).',
    cites: ['glossary-steelman', 'guide-how-to-steelman'],
  },
  // ---------------------------------------------------------- Module 1.2 --
  {
    module: '1.2',
    question: 'Quran 52:35–36 gives three options. Which one does the verse leave standing?',
    choices: [
      'We came from nothing',
      'We created ourselves',
      'A Maker created us',
      'Nobody can know',
    ],
    answer: 2,
    explanation:
      '"From nothing" is impossible because nothing has no power. "Made ourselves" is impossible because a thing must exist before it can act.',
    cites: ['ARG-1'],
  },
  {
    module: '1.2',
    question: 'What is the best answer to "Who created God?"',
    choices: [
      'God created Himself',
      'Nobody knows, it is a mystery',
      'The principle is not "everything needs a cause" but "everything that BEGINS to exist needs a cause" — and God never began',
      'Science will answer this one day',
    ],
    answer: 2,
    explanation:
      'The question mixes up the principle. Fixing the principle answers it. The Prophet ﺳ also told us to seek refuge in Allah when this whisper comes (Bukhari 3276, Muslim 134).',
    cites: ['OBJ-6'],
  },
  {
    module: '1.2',
    question: 'An endless backwards chain of causes (infinite regress) is a problem because:',
    choices: [
      'It is too hard to imagine',
      'Many scholars argue a real, completed endless past chain is impossible, so the chain must stop at an uncaused First',
      'Science has measured the exact start',
      'The Quran forbids thinking about it',
    ],
    answer: 1,
    explanation:
      'This is the philosophical point behind both ARG-2 and OBJ-6. Do not claim science has settled the first instant.',
    cites: ['OBJ-6', 'ARG-2'],
  },
  // ---------------------------------------------------------- Module 1.3 --
  {
    module: '1.3',
    question: 'What should you do FIRST in a dawah conversation?',
    choices: [
      'Give your strongest argument straight away',
      'Find the ROOT of their doubt by asking kindly',
      'Quote as many hadith as you can',
      'Tell them they are wrong',
    ],
    answer: 1,
    explanation:
      'The three roots are: intellectual doubt, pain or bad experience, and no exposure. Matching the answer to the root is the whole game.',
    cites: ['guide-first-find-the-root-of-their-doubt'],
  },
  {
    module: '1.3',
    question: 'Quran 16:125 tells us to invite with:',
    choices: [
      'Wisdom, good preaching, and arguing in the best way',
      'Strong words so people fear',
      'Only silence and example',
      'Proof from science alone',
    ],
    answer: 0,
    explanation:
      '3:159 adds that harshness pushes people away, and 28:56 reminds us that only Allah guides.',
    cites: ['guide-the-golden-verses'],
  },
  {
    module: '1.3',
    question: 'What should you say when you do NOT know an answer?',
    choices: [
      'Make a good guess so you do not look weak',
      'Change the subject',
      'Say honestly that you do not know, and offer to find out or point to a scholar',
      'Say the question is not allowed',
    ],
    answer: 2,
    explanation:
      'This is honest and strong. Guessing or making up a hadith is a sin and destroys trust.',
    cites: ['guide-what-to-say-when-you-dont-know'],
  },
  // ---------------------------------------------------------- Module 2.1 --
  {
    module: '2.1',
    question: 'How should you present the Big Bang when giving the kalam argument?',
    choices: [
      'Science has PROVEN God with the Big Bang',
      'The evidence is consistent with a beginning, and the main weight is on the philosophical point',
      'The Big Bang never happened',
      'Physics has nothing to say about it',
    ],
    answer: 1,
    explanation:
      'File 01 marks "science has PROVEN God" as a weak version to AVOID. The science of the first instant is debated, so lean on the philosophy.',
    cites: ['ARG-2'],
  },
  {
    module: '2.1',
    question: 'An atheist says quantum particles appear without a cause. The best reply is:',
    choices: [
      'Quantum physics is fake',
      'A quantum vacuum is not "nothing" — it has fields and laws, so this is not something from nothing',
      'That proves God directly',
      'Scientists are lying',
    ],
    answer: 1,
    explanation:
      'Be honest that the physics is debated. Answer the real point instead of attacking science.',
    cites: ['OBJ-11'],
  },
  // ---------------------------------------------------------- Module 2.2 --
  {
    module: '2.2',
    question: 'Which atheist philosopher admitted objective values would make God more probable?',
    choices: ['Richard Dawkins', 'J.L. Mackie', 'Sam Harris', 'David Hume'],
    answer: 1,
    explanation:
      'Mackie wrote this in The Miracle of Theism (1982), then escaped the conclusion by denying that objective values exist (his "error theory").',
    cites: ['ARG-5'],
  },
  {
    module: '2.2',
    question: '"I can be good without God" is best answered by:',
    choices: [
      'Saying atheists are bad people',
      'Separating two questions: CAN an atheist act good (yes), and can atheism GROUND real right and wrong (the hard part)',
      'Ignoring it',
      'Saying only Muslims do good',
    ],
    answer: 1,
    explanation:
      'Never say atheists are bad people — that is a strawman and rude. Separate "living good" from "grounding good".',
    cites: ['OBJ-7'],
  },
  {
    module: '2.2',
    question: 'Which fallacy blocks getting morality from science alone?',
    choices: [
      'Ad hominem',
      'The is/ought fallacy — jumping from facts to values with no bridge',
      'Circular reasoning',
      'Moving the goalposts',
    ],
    answer: 1,
    explanation:
      'Wellbeing-based ethics still cannot cross from "is" to "ought". This is the key point against science-based morality.',
    cites: ['fallacy-is-ought-fallacy', 'ARG-5'],
  },
  // ---------------------------------------------------------- Module 2.3 --
  {
    module: '2.3',
    question: 'What is the fitrah?',
    choices: [
      'A type of prayer',
      'The inborn, natural feeling every human has that God is real',
      'A school of Islamic law',
      'A kind of proof from science',
    ],
    answer: 1,
    explanation:
      'Quran 30:30 and the hadith "every child is born upon the fitrah" (Bukhari 1358, Muslim 2658, agreed upon).',
    cites: ['ARG-4'],
  },
  {
    module: '2.3',
    question: 'An atheist says evolution gave us a "God instinct", so the fitrah proves nothing. Best reply:',
    choices: [
      'Evolution is false',
      'Explaining HOW we got a belief does not show the belief is FALSE — and fitrah is one sign among many, not the whole proof',
      'The fitrah is the only proof we need',
      'Stop talking to them',
    ],
    answer: 1,
    explanation:
      'Present fitrah together with the intellectual arguments (ARG-1, 2, 3), not on its own.',
    cites: ['ARG-4'],
  },
  {
    module: '2.3',
    question: 'The correct order when you steelman is:',
    choices: [
      'Answer first, then repeat their view',
      'Repeat their argument in your own words, make it as strong as you can, ask "did I get that right?", THEN answer',
      'Say their view is silly, then answer',
      'Only ask questions and never answer',
    ],
    answer: 1,
    explanation: 'This builds trust and is better dawah (Quran 16:125).',
    cites: ['guide-how-to-steelman'],
  },
  // ---------------------------------------------------------- Module 3.1 --
  {
    module: '3.1',
    question: 'The LOGICAL problem of evil is now widely seen as failing because:',
    choices: [
      'Evil does not really exist',
      'It assumes God can have NO good reason to allow any evil, which is not proven',
      'Suffering is always deserved',
      'Philosophers stopped caring',
    ],
    answer: 1,
    explanation:
      'Plantinga’s free-will defence broke the logical version. Islam adds: life is a test (Quran 67:2), free will, and limited human wisdom.',
    cites: ['OBJ-1'],
  },
  {
    module: '3.1',
    question: 'Rowe’s fawn example (an animal burning unseen in a forest fire) is best answered by:',
    choices: [
      'Saying the fawn deserved it',
      'Pointing out that "we see no reason" is not the same as "there is no reason", plus perfect compensation in the hereafter',
      'Saying animals do not feel pain',
      'Giving the exact reason God allowed it',
    ],
    answer: 1,
    explanation:
      'This is skeptical theism. File 02 warns that pretending to know the exact reason for one tragedy is a WEAK answer.',
    cites: ['OBJ-2'],
  },
  {
    module: '3.1',
    question: 'How should you talk about animal and infant suffering?',
    choices: [
      'Say it is an easy question',
      'Say clearly that it is one of the hardest questions, then show how Islam approaches it',
      'Refuse to discuss it',
      'Say the person is sinning for asking',
    ],
    answer: 1,
    explanation: 'Be gentle and honest. Never say "this is easy".',
    cites: ['OBJ-3'],
  },
  // ---------------------------------------------------------- Module 3.2 --
  {
    module: '3.2',
    question: 'Schellenberg’s hiddenness argument is best answered by:',
    choices: [
      'Saying every non-believer is secretly dishonest',
      'Showing that God is not fully hidden (signs, fitrah, the Quran) and that faith is meant to be a test',
      'Saying God does not want a relationship',
      'Refusing to answer',
    ],
    answer: 1,
    explanation:
      'Answer with humility. Do not accuse a specific person of secretly resisting.',
    cites: ['OBJ-5'],
  },
  {
    module: '3.2',
    question: 'On qadr and free will, the mainstream Islamic position is:',
    choices: [
      'Humans have no free will at all (Jabarites)',
      'Allah has no control over our acts (Qadarites)',
      'BOTH Allah’s decree AND real human choice — Allah’s knowledge does not force you',
      'The question is forbidden',
    ],
    answer: 2,
    explanation:
      'Both extremes are rejected. Say honestly that this is subtle, and even great scholars call it hard for the mind to fully grasp.',
    cites: ['OBJ-12'],
  },
  {
    module: '3.2',
    question: 'When someone says eternal hell is unfair, a careful answer includes:',
    choices: [
      'Punishment matches the person’s state and their rejection, Allah’s mercy is vast, and scholars differ on some details',
      'Everyone goes to hell anyway',
      'The topic should never be discussed',
      'Hell is only a metaphor',
    ],
    answer: 0,
    explanation:
      'File 02 says to keep to the mainstream and to flag honestly where scholars differ. Handle this gently, especially with someone in pain.',
    cites: ['OBJ-13'],
  },
  // ---------------------------------------------------------- Module 3.3 --
  {
    module: '3.3',
    question: 'An ex-Muslim says "Don’t lecture me." What is the first thing to do?',
    choices: [
      'Give the kalam argument',
      'Find the real root — intellectual doubt, pain, or no exposure — by asking, not lecturing',
      'Tell them they just want to sin',
      'End the conversation',
    ],
    answer: 1,
    explanation:
      'Ex-Muslim doubts are often a MIX of intellect and pain. Never say "you just want to sin". Separate bad Muslims from Islam itself.',
    cites: ['OBJ-17'],
  },
  {
    module: '3.3',
    question: 'With an emotional doubter you should mostly give:',
    choices: [
      'Long philosophy chains',
      'Comfort, presence, dua and patience — fewer arguments',
      'A list of hadith numbers',
      'A debate challenge',
    ],
    answer: 1,
    explanation:
      'Intellectual doubters need clear logic and honest sources. Many people are BOTH — watch their words and feelings.',
    cites: ['guide-emotional-vs-intellectual-doubters'],
  },
  {
    module: '3.3',
    question: 'What is the cure for waswas (repeating whispers of doubt)?',
    choices: [
      'Argue with the thought until it goes away',
      'Seek refuge in Allah, say "Amantu billah", stop engaging, and change what you are doing',
      'Read more philosophy',
      'Ignore your faith for a while',
    ],
    answer: 1,
    explanation:
      'Arguing with waswas feeds it (Bukhari 3276, Muslim 134). Note: the "Amantu billah" wording is a SEPARATE narration, not part of Bukhari 3276.',
    cites: ['guide-protecting-your-own-faith'],
  },
  // ---------------------------------------------------------- Module 4.1 --
  {
    module: '4.1',
    question: 'Who named the "hard problem of consciousness"?',
    choices: ['David Chalmers', 'Richard Dawkins', 'Graham Oppy', 'William Rowe'],
    answer: 0,
    explanation:
      'Chalmers, "Facing Up to the Problem of Consciousness", Journal of Consciousness Studies 2(3):200–219 (1995).',
    cites: ['ARG-6'],
  },
  {
    module: '4.1',
    question: 'Why is the hard problem argued to be MORE than a normal "gap"?',
    choices: [
      'Because scientists gave up',
      'Because many philosophers argue you cannot get first-person felt experience from third-person physical description even in principle',
      'Because the Quran says so',
      'Because brains are complicated',
    ],
    answer: 1,
    explanation:
      'Still present it humbly as a strong pointer, not a knockout proof. Do not say science will never explain anything about the brain.',
    cites: ['ARG-6', 'OBJ-9'],
  },
  {
    module: '4.1',
    question: 'The best reply to the multiverse answer to fine-tuning is:',
    choices: [
      'The multiverse is impossible',
      'It is unobserved, adds huge unproven machinery, and a universe-generator would itself need setup',
      'Physics is unreliable',
      'Fine-tuning proves God with certainty',
    ],
    answer: 1,
    explanation:
      'Present fine-tuning as a strong probability point, not a certainty.',
    cites: ['OBJ-10', 'ARG-7'],
  },
  {
    module: '4.1',
    question: 'Why is "only what science can test is real" self-refuting?',
    choices: [
      'Because science is wrong',
      'Because that statement itself cannot be tested by science — it is a philosophy claim',
      'Because the Quran forbids science',
      'It is not self-refuting',
    ],
    answer: 1,
    explanation:
      'Islam loves science: the Quran invites us to study nature (3:190–191). Avoid attacking evolution with bad science.',
    cites: ['OBJ-8'],
  },
  // ---------------------------------------------------------- Module 4.2 --
  {
    module: '4.2',
    question: 'Hume’s argument against miracles is best answered by:',
    choices: [
      'Saying laws of nature do not exist',
      'Showing his rule is too strong — it would reject any truly new event — and that the Quran’s main sign is a lasting, examinable text',
      'Saying Hume was not a real philosopher',
      'Giving more one-off miracle stories',
    ],
    answer: 1,
    explanation:
      'Probability should follow the quality and quantity of evidence, not rule miracles out in advance.',
    cites: ['OBJ-15'],
  },
  {
    module: '4.2',
    question: 'A nihilist says we invent our own meaning. The Islamic reply is:',
    choices: [
      'Life really has no meaning',
      'Invented meaning is fragile — if we invent it we can un-invent it — while Islam gives a real, given purpose (Quran 51:56)',
      'Nihilists are stupid',
      'Meaning comes from money',
    ],
    answer: 1,
    explanation:
      'Notice how much effort atheist thinkers spend TRYING to rebuild meaning. That hunger itself is a sign (fitrah). Avoid cheesy slogans.',
    cites: ['OBJ-16'],
  },
  {
    module: '4.2',
    question: 'Whoever makes a claim carries the:',
    choices: ['Burden of proof', 'Genetic fallacy', 'Steelman', 'Theodicy'],
    answer: 0,
    explanation:
      '"There is no God" is also a claim. "I am not convinced" is different. Ask which one they mean.',
    cites: ['guide-burden-of-proof'],
  },
  // ---------------------------------------------------------- Module 4.3 --
  {
    module: '4.3',
    question: 'The contingency argument concludes that there must be:',
    choices: [
      'A very old universe',
      'A Necessary Being that exists by itself and needs nothing',
      'Many gods',
      'A multiverse',
    ],
    answer: 1,
    explanation:
      'Ibn Sina called this the Necessary Existent (al-Wajib al-Wujud), in his Burhan al-Siddiqin.',
    cites: ['ARG-3'],
  },
  {
    module: '4.3',
    question: 'Is the contingency argument a composition fallacy?',
    choices: [
      'Yes, always',
      'No — the universe is made of changing, dependent parts, so it looks contingent rather than necessary',
      'Yes, because bricks are light',
      'The question makes no sense',
    ],
    answer: 1,
    explanation:
      'Calling the universe a "brute fact" just stops asking the question. The contingency argument keeps asking until it reaches something that truly needs nothing.',
    cites: ['ARG-3'],
  },
  {
    module: '4.3',
    question: 'Russell said "the universe is just there". Why is that a weak answer?',
    choices: [
      'Because Russell was an atheist',
      'Because it is a conversation-stopper, not an explanation',
      'Because the universe is not there',
      'Because it uses too many words',
    ],
    answer: 1,
    explanation: 'It stops the question rather than answering it.',
    cites: ['ARG-3'],
  },
]

const LETTERS = ['A', 'B', 'C', 'D']

export function derivedQuizzes(): QuizQuestion[] {
  return RAW.map((raw, i) => ({
    id: `qd-${i + 1}`,
    module: raw.module,
    question: raw.question,
    choices: raw.choices.map((text, n) => ({
      key: LETTERS[n],
      text,
      correct: n === raw.answer,
    })),
    explanation: raw.explanation,
    cites: raw.cites,
    origin: 'derived' as const,
  }))
}

/** Which module each file-08 sample question belongs to. */
export const SAMPLE_QUIZ_MODULES: Record<string, string> = {
  'q08-1': '2.1',
  'q08-2': '2.2',
  'q08-3': '3.3',
  'q08-4': '4.2',
  'q08-5': '2.1',
}
