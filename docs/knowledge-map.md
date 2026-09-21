# Knowledge Map

This file is the **index of every id** in `/research`. The app and the AI use these
ids to point at real content. If an id is not on this page, it does not exist.

**Simple words used here**
- **id** — a short name for one piece of content, like `ARG-2`. The app uses ids to find things.
- **slug** — the id in lowercase with dashes, like `arg-kalam`. The database uses slugs.
- **ARG** — an argument FOR God (from file 01).
- **OBJ** — an objection FROM an atheist, plus the Islamic answer (from file 02).
- **P** — a persona: a pretend person the AI plays in debate practice (from file 06).
- **QA** — a question with a short model answer (from file 07).

---

## 1. Files in /research

| File | What it holds | Used by |
| --- | --- | --- |
| `00-index.md` | Map + simple-English glossary | Glossary page, all AI modes |
| `01-arguments-for-god.md` | ARG-1 … ARG-7 | Argument Library, maps, debate, Q&A |
| `02-atheist-objections.md` | OBJ-1 … OBJ-17 | Debate personas, Spot-the-Weak-Answer, Q&A |
| `03-islamic-sources.md` | **The only source of truth for citations** | Every AI mode, Source Library |
| `04-philosophy-basics.md` | Logic, fallacies, steelman, Socratic | Fallacy Trainer, Steelman Trainer |
| `05-dawah-method.md` | Adab, roots of doubt, protecting your faith | Safety prompt, lessons |
| `06-roleplay-personas.md` | P1 … P12 + scoring rubric | Debate mode, scorecards |
| `07-qa-bank.md` | QA-1 … QA-62 | Q&A seeds, Rapid-Fire, Daily Challenge |
| `08-learning-path.md` | Levels 1–4, quizzes, flashcards, SRS rules | Learning Path, quizzes, flashcards |
| `09-feature-spec.md` | Feature list | Product scope |

---

## 2. Arguments for God (ARG) — file 01

| id | slug | Title | Difficulty | Key sources | Main objection |
| --- | --- | --- | --- | --- | --- |
| ARG-1 | `arg-quran-5235` | The Quran's Own Argument (Quran 52:35) | Easy | Quran 52:35–36; islamqa 26745, 13532; Yaqeen "Case for Allah's Existence" | False trilemma / quantum |
| ARG-2 | `arg-kalam` | Kalam Cosmological Argument (al-Ghazali) | Medium | al-Ghazali *Tahafut al-Falasifa*; SEP cosmological-argument | OBJ-11 |
| ARG-3 | `arg-contingency` | Contingency Argument (Ibn Sina) | Hard | Ibn Sina *al-Najat*, *al-Isharat*; Cambridge Core; Wikipedia Seddiqin | Composition fallacy / brute fact |
| ARG-4 | `arg-fitrah` | The Fitrah Argument (Quran 30:30) | Easy | Quran 30:30; Bukhari 1358; Muslim 2658; islamqa 248517 | Evolutionary debunking |
| ARG-5 | `arg-morality` | The Moral Argument | Medium | J.L. Mackie *The Miracle of Theism* (1982) | Harris wellbeing / Euthyphro (OBJ-4) |
| ARG-6 | `arg-consciousness` | Consciousness (The Hard Problem) | Hard | Chalmers 1995, JCS 2(3):200–219; IEP hard-problem | God of the gaps (OBJ-9) |
| ARG-7 | `arg-finetuning` | Fine-Tuning / Design | Medium | SEP fine-tuning | Multiverse (OBJ-10) |

**Marked "weak / avoid" inside file 01**
- ARG-2: do **not** say "science has PROVEN God with the Big Bang." Say "consistent with a beginning."
- ARG-6: do **not** say "science will NEVER explain anything about the brain." Only the felt, first-person part is the hard problem.

---

## 3. Atheist objections (OBJ) — file 02

| id | slug | Title | Who says it | Difficulty | Linked ARG |
| --- | --- | --- | --- | --- | --- |
| OBJ-1 | `obj-evil-logical` | Problem of Evil — Logical Form | Epicurus, J.L. Mackie | Medium | — |
| OBJ-2 | `obj-evil-evidential` | Problem of Evil — Evidential Form | William Rowe, Paul Draper | Hard | — |
| OBJ-3 | `obj-animal-suffering` | Animal and Infant Suffering | — | Hard | — |
| OBJ-4 | `obj-euthyphro` | Euthyphro Dilemma | Plato (Socrates) | Medium | ARG-5 |
| OBJ-5 | `obj-hiddenness` | Divine Hiddenness | J.L. Schellenberg | Hard | ARG-4 |
| OBJ-6 | `obj-who-created-god` | Who Created God? | Richard Dawkins | Easy | ARG-2, ARG-3 |
| OBJ-7 | `obj-good-without-god` | I Can Be Good Without God | — | Easy | ARG-5 |
| OBJ-8 | `obj-science` | Science Explains Everything / Naturalism | — | Medium | ARG-6 |
| OBJ-9 | `obj-gaps` | Consciousness Is Just a Gap | — | Hard | ARG-6 |
| OBJ-10 | `obj-multiverse` | Fine-Tuning Explained by Multiverse | — | Medium | ARG-7 |
| OBJ-11 | `obj-kalam` | Kalam Objections (Quantum / Eternal) | Graham Oppy | Hard | ARG-2 |
| OBJ-12 | `obj-qadr` | Qadr vs Free Will | — | Hard | — |
| OBJ-13 | `obj-hell` | Hell and Justice | — | Medium | — |
| OBJ-14 | `obj-why-islam` | Why Islam and Not Another Religion? | — | Medium | — |
| OBJ-15 | `obj-miracles` | Hume on Miracles | David Hume | Hard | — |
| OBJ-16 | `obj-nihilism` | Meaning of Life / Nihilism | Camus, Sartre, Nietzsche | Medium | — |
| OBJ-17 | `obj-exmuslim` | Common Ex-Muslim Objections | — | Mixed | — |

**Strong vs weak answers (file 02 says this directly)**
- OBJ-1 — STRONG for man-made evil: free-will defence. Move to OBJ-3 for natural suffering.
- OBJ-2 — STRONG: skeptical theism + hereafter. WEAK: pretending to know the exact reason for one tragedy.
- OBJ-4 — STRONG: goodness flows from God's nature (third option).
- OBJ-6 — STRONG and simple: fix the false principle ("begins to exist").
- OBJ-7 — Never say atheists are bad people. That is a strawman.
- OBJ-8 — STRONG. WEAK: bad anti-evolution science, "scientific miracles" as knockout proofs.
- OBJ-12 — Say honestly this is subtle; great scholars call it hard.
- OBJ-13 — Scholars differ on some details of eternity. Say so.
- OBJ-17 — Most sensitive. Safety and gentleness over "winning."

---

## 4. Personas (P) — file 06

| id | slug | Name | Difficulty | Favourite objections | Sensitive? |
| --- | --- | --- | --- | --- | --- |
| P1 | `p1-sara` | Curious Agnostic Student ("Sara") | easy | OBJ-6, OBJ-7 | no |
| P2 | `p2-rick` | New Atheist Debater ("Rick") | medium | OBJ-1, OBJ-6, OBJ-8 | no |
| P3 | `p3-vance` | Analytic Philosophy Professor ("Dr. Vance") | expert | OBJ-2, OBJ-5, OBJ-11, OBJ-4 | no |
| P4 | `p4-chen` | Scientist / Naturalist ("Dr. Chen") | hard | OBJ-8, OBJ-10, OBJ-9 | no |
| P5 | `p5-adnan` | Ex-Muslim With Pain ("Adnan") | hard | OBJ-13, OBJ-17, OBJ-1 | **yes** |
| P6 | `p6-leo` | Existentialist / Nihilist ("Leo") | medium | OBJ-16 | no |
| P7 | `p7-maria` | Person Hurt by Suffering ("Maria") | hard | OBJ-3, OBJ-1 | **yes** |
| P8 | `p8-james` | Polite Skeptic ("James") | easy–medium | OBJ-8, OBJ-6 | no |
| P9 | `p9-grace` | "Why Islam Not Christianity?" ("Grace") | medium | OBJ-14 | no |
| P10 | `p10-anon` | Online Troll ("Anon") | easy (patience test) | — | no |
| P11 | `p11-omar` | Deist ("Omar") | medium | OBJ-14, OBJ-15 | no |
| P12 | `p12-yusuf` | Sincere Seeker Near Belief ("Yusuf") | easy | — | no |

### Scoring rubric (file 06) — 0–5 each, total /30
1. `logic` — valid / sound? avoided fallacies?
2. `sources` — correct verses, hadith, fatwas? (invented ones are punished hard)
3. `understanding` — did they steelman and hit the real point?
4. `clarity` — simple, clear, organised?
5. `adab` — gentle, respectful, no mocking (16:125, 3:159)?
6. `overclaim` — did they avoid exaggerating ("proven!", "scientific miracle")?

**Bands:** 26–30 Excellent · 20–25 Strong · 14–19 Okay · 8–13 Weak · 0–7 Needs work.

---

## 5. Sources — file 03 (THE ONLY SOURCE OF TRUTH FOR CITATIONS)

The AI may cite **only** what is listed below. If a verse, hadith or fatwa number is
not here, the AI must say "I'm not fully sure, please check with a scholar."

### Quran verses allowed
`52:35–36`, `30:30`, `67:2`, `51:56`, `16:125`, `3:159`, `28:56`, `41:34`,
`3:190–191`, `41:53`, `4:82`.

### Hadith allowed (collection + number + grade)
| Topic | Citation | Grade | URL |
| --- | --- | --- | --- |
| "Who created your Lord?" (Shaytan's whisper) | Sahih al-Bukhari **3276**; Sahih Muslim **134** | agreed upon | https://sunnah.com/bukhari:3276 · https://sunnah.com/muslim:134 |
| "Amantu billah" response to waswas | Sahih al-Jami' **6587** (Ibn al-Sunni via 'Aishah), graded Sahih by al-Albani | sahih | — |
| "Every child is born upon the fitrah" | Sahih al-Bukhari **1358** (also 1385; Tafsir 4775); Sahih Muslim **2658** | agreed upon | https://sunnah.com/bukhari:1358 · https://sunnah.com/muslim:2658 |
| "Nothing repels the decree except dua" | Sunan al-Tirmidhi **2139** (Salman al-Farisi) | hasan (al-Albani) | https://sunnah.com/tirmidhi:2139 |
| "If Allah guides one man through you…" (red camels) | al-Bukhari and Muslim (cited in islamqa 26745) | agreed upon | https://islamqa.info/en/answers/26745 |

### Fatwa / Q&A answers allowed
islamqa.info: **13532**, **26745**, **6660**, **9414**, **88184**, **99983**, **248517**, **12376**, **264354**, **129219**.
islamqa.org (SeekersGuidance): Hanafi **31676**, Shafi'i **169537**.

### Yaqeen Institute papers allowed
- The Case for Allah's Existence
- The Problem of Evil: A Multifaceted Islamic Solution (Suleiman Hani)
- Why Do People Suffer? God's Existence & the Problem of Evil (Elshinawy)
- The Divine Wisdom in Allowing Evil to Exist: Ibn al-Qayyim (Zeni)
- Predestination vs. Free Will: Understanding Allah's Qadr

### Sapience Institute / Hamza Tzortzis
- *The Divine Reality* (free PDF)
- *Divine Certainty* (essay)

### Neutral / academic (for the fair atheist side)
SEP: problem of evil, cosmological argument, divine hiddenness, fine-tuning, miracles.
IEP: evidential problem of evil, divine command theory, hard problem of consciousness, divine hiddenness.

### Classical books
al-Ghazali *Tahafut al-Falasifa* · Ibn Sina *al-Najat* / *al-Isharat* ·
Ibn Taymiyyah *Dar' Ta'arud al-'Aql wa'l-Naql* · Ibn al-Qayyim (on evil) ·
al-Razi *al-Matalib al-'Aliya* · al-Sanusi *Umm al-Barahin*.

### Honesty flags (must be obeyed)
1. "Amantu billah" is a **separate** narration from Bukhari 3276 / Muslim 134. Do not merge them.
2. Do **not** present "scientific miracles in the Quran" as knockout proofs.
3. The exact science at the universe's first instant is debated. Lean on philosophy for kalam.

---

## 6. Glossary — file 00

`atheist`, `agnostic`, `theism`, `naturalism`, `materialism`, `premise`, `conclusion`,
`valid-argument`, `sound-argument`, `fallacy`, `cause`, `contingent`, `necessary-being`,
`infinite-regress`, `epistemology`, `ontology`, `objective`, `subjective`, `steelman`,
`strawman`, `burden-of-proof`, `theodicy`, `fitrah`, `qadr`, `kalam`, `empiricism`,
`divine-command-theory`, `contingency-argument`.

---

## 7. Fallacies — file 04

`strawman`, `ad-hominem`, `god-of-the-gaps`, `genetic-fallacy`, `false-dilemma`,
`circular-reasoning`, `composition-fallacy`, `is-ought-fallacy`,
`appeal-to-authority-misused`, `moving-the-goalposts`.

Also in file 04: valid vs sound, the 4-step steelman method, the Socratic questions,
and burden of proof.

---

## 8. Dawah method — file 05

Golden verses `16:125`, `3:159`, `28:56`, `41:34`.
Three roots of doubt: **intellectual**, **pain / bad experience**, **no exposure**.
Waswas cure: seek refuge, say "Amantu billah", stop arguing with it, change activity.
Six common mistakes of young du'at. Eight-step dawah flow.

---

## 9. Q&A bank — file 07 (QA-1 … QA-62)

Ids are `QA-1` … `QA-62` in file order. Groups:

| Group | Question numbers |
| --- | --- |
| Existence of God | 1–12 |
| Problem of Evil / Suffering | 13–17 |
| Morality | 18–23 |
| Science / Consciousness | 24–27 |
| Qadr / Free Will / Hell | 28–30 |
| Why Islam / Prophethood / Miracles | 31–33 |
| Meaning / Hiddenness / Doubts | 34–37 |
| Method / Adab | 38–42 |
| Logic | 43–48 |
| Harder / Expert | 49–62 |

---

## 10. Learning path — file 08

| Level | Name | Modules | Checkpoint |
| --- | --- | --- | --- |
| 1 | Foundations (Beginner) | 1.1 glossary + valid/sound · 1.2 ARG-1 + OBJ-6 · 1.3 adab + roots of doubt | Roleplay P1 (Sara) ≥ 18/30 |
| 2 | Core Arguments (Intermediate) | 2.1 ARG-2 + OBJ-11 · 2.2 ARG-5 + OBJ-4 + OBJ-7 · 2.3 ARG-4 + steelman | Roleplay P2 and P8 ≥ 20/30 |
| 3 | Hard Questions (Advanced) | 3.1 OBJ-1/2/3 · 3.2 OBJ-5 + OBJ-12 + OBJ-13 · 3.3 P5, P7 (listen first) | Roleplay P7 (Maria), adab ≥ 4/5 |
| 4 | Expert / Science & Meaning | 4.1 ARG-6/7 + OBJ-8/9/10 · 4.2 OBJ-14/15/16 · 4.3 ARG-3 deep | Roleplay P3 and P4 ≥ 22/30 |

**Sample quiz questions:** 5 MCQs with explanations (Q1 kalam, Q2 Euthyphro, Q3 grieving person, Q4 genetic fallacy, Q5 overclaim).

**Sample flashcards:** 10 cards (contingent, necessary being, kalam, fitrah, Euthyphro answer, waswas cure, is/ought, steelman, 16:125, 28:56).

**Spaced repetition rule:** show again after **1, 3, 7, 16, 35 days** when correct. **Reset to day 1 when wrong.** Track per-card ease.

---

## 11. How the app uses these ids

- `research_content.slug` holds the slug from the tables above. `kind` is one of
  `argument`, `objection`, `source`, `qa`, `persona`, `glossary`.
- The Q&A edge function picks matching rows and passes them to the AI as the ONLY
  allowed facts.
- The debate edge function loads one `persona` row plus its favourite `objection` rows.
- The scorecard writes `sources_to_review` as a list of these ids (e.g. `["OBJ-2","ARG-2"]`).
- `weakness_stats.tag` uses the tags on these rows, so "study next" can point at a real id.
