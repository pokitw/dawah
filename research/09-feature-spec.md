---
id: feature-spec
title: Website Feature Specification
tags: [features, spec]
---

# 09 — Website Feature List

## Core Modes
1. **Debate/Roleplay Mode** — pick persona (file 06) + difficulty + topic; AI plays the atheist realistically and stays in character. Option: AI plays the Muslim so the user practices the ATHEIST side (steelman training). Live "coach hints" toggle. End-of-debate scorecard using the rubric: total score, strong points, weak points, better sample answers, and sources.
2. **Ask/Q&A Mode** — AI answers grounded ONLY in /research, with citations (Quran/hadith/islamqa/Yaqeen). Says "I don't know / scholars differ" when true. Never invents. "Explain simpler" button.
3. **Learning Path** — levels, lessons, quizzes, flashcards (spaced repetition), progress, streaks, XP.
4. **Argument Library + Visual Maps** — premises → conclusion as a tree; objections and replies as branches.
5. **Fallacy Trainer** — spot the fallacy in sample lines.
6. **Spot the Weak Answer** — show two answers; pick the stronger; explain why.
7. **Steelman Trainer** — user must restate an objection fairly before answering.
8. **Rapid-Fire Mode** — timed short answers.
9. **Daily Challenge** — one question or mini-debate per day.
10. **Glossary, Source Library, Saved Notes.**
11. **Debate History + Replays.**
12. **Weakness Tracker** — recommends what to study next based on low scores/tags.

## Safety / Ethics
- Respectful tone; NEVER mock atheists.
- Faith-crisis mode: if a user seems in real distress, respond gently, encourage talking to trusted people/scholars, avoid cold debate.
- Accuracy guardrails: no invented verses/hadith/fatwas; cite from /research.
- Clear disclaimer: "This is a learning tool, not a fatwa source. For rulings, ask qualified scholars."

## Non-functional
- Mobile-first, fast, dark/light mode, very simple English UI.
- All AI calls via a server/edge function; API keys never in the browser.