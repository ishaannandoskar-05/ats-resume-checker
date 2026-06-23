# ATS Resume Checker — Implementation Plan

## Overview

A single-page web application that allows users to upload a resume (PDF or DOCX), receive an instant ATS compatibility score, view a breakdown of pros and cons, and generate an ATS-optimized version of the resume in LaTeX format — all powered by Claude AI.

---

## Product Vision

> Upload your resume. Know your score. Get hired.

The tool targets job seekers who want to understand how Applicant Tracking Systems (ATS) evaluate their resume and receive actionable, AI-generated improvements in a print-ready LaTeX format.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React (`.jsx` Artifact) | Runs directly in Claude.ai, no backend needed |
| AI Engine | Anthropic API (`claude-sonnet-4-6`) | Resume analysis + LaTeX generation |
| File Parsing | `mammoth` (DOCX), `pdfjs-dist` or base64 PDF | Extract raw text from uploaded resumes |
| Styling | Tailwind CSS | Rapid, responsive layout |
| State | `useState` / `useReducer` | In-memory session state |

---

## Feature Breakdown

### 1. Resume Upload

**What it does:**
- Accepts `.pdf` and `.docx` file uploads via drag-and-drop or file picker
- Extracts plain text from the uploaded file client-side
- Sends extracted text to the Anthropic API for analysis

**Implementation details:**
- Use an `<input type="file">` with `accept=".pdf,.docx"` wrapped in a styled drop zone
- For `.docx`: use `mammoth.js` → `mammoth.extractRawText({ arrayBuffer })` to get plain text
- For `.pdf`: encode as base64 and pass directly as a `document` block to the Claude API (Claude natively reads PDFs)
- Store extracted text in React state for reuse across features

**UI states:**
- `idle` — Drop zone with upload icon and instructions
- `parsing` — "Reading your resume…" spinner
- `ready` — File name shown with a "Analyze" CTA button

---

### 2. Instant ATS Score

**What it does:**
- Returns a numeric ATS compatibility score (0–100)
- Displays a visual score ring or progress bar with color coding
  - 0–49: Red (Poor)
  - 50–74: Amber (Needs Work)
  - 75–89: Blue (Good)
  - 90–100: Green (Excellent)

**API call — System Prompt:**
```
You are an expert ATS (Applicant Tracking System) resume analyzer. 
Analyze the resume text provided and return a JSON object ONLY — no markdown, no preamble.

Return exactly this structure:
{
  "score": <integer 0-100>,
  "grade": "<Poor | Needs Work | Good | Excellent>",
  "summary": "<2-sentence overall summary>",
  "pros": ["<pro 1>", "<pro 2>", ...],  // 3-6 items
  "cons": ["<con 1>", "<con 2>", ...],  // 3-6 items
  "keywords_found": ["<keyword>", ...],
  "keywords_missing": ["<keyword>", ...],
  "section_scores": {
    "contact_info": <0-100>,
    "work_experience": <0-100>,
    "education": <0-100>,
    "skills": <0-100>,
    "formatting": <0-100>
  }
}
```

**Scoring Criteria (guide the AI):**
- Contact information completeness (name, email, phone, LinkedIn/GitHub)
- Use of standard section headers (Experience, Education, Skills)
- Bullet-point formatting vs. paragraph blocks
- Action verbs and quantifiable achievements
- Keyword density for common ATS filters
- Absence of tables, headers/footers, images, or columns (ATS-unfriendly)
- File parsability and clean text structure
- Length (1–2 pages is optimal)

---

### 3. Pros & Cons Panel

**What it does:**
- Displays two collapsible columns: ✅ Strengths and ❌ Weaknesses
- Each item is a short, actionable insight (not vague feedback)
- Shows keyword match section: keywords detected vs. keywords to add

**UI structure:**
```
┌─────────────────────┬─────────────────────┐
│  ✅ Strengths       │  ❌ Weaknesses       │
│  • Strong action    │  • Missing LinkedIn  │
│    verbs used       │    URL               │
│  • Quantified       │  • No skills section │
│    achievements     │  • Uses tables       │
│  • Clear contact    │  • Generic objective │
│    info             │    statement         │
└─────────────────────┴─────────────────────┘

  Keywords Found: Python, React, SQL (+4 more)
  Keywords to Add: CI/CD, Agile, TypeScript
```

**Implementation:**
- Parse the JSON response from Feature 2 (`pros`, `cons`, `keywords_found`, `keywords_missing`)
- Render as two-column grid with icons
- Keyword chips are color-coded: green for found, red/outline for missing

---

### 4. Optimize Button → LaTeX Output

**What it does:**
- A prominent "Optimize Resume →" button triggers a second AI call
- Returns a full, ATS-optimized LaTeX document based on the original resume content
- Displays the LaTeX code in a syntax-highlighted code block
- Provides a "Copy LaTeX" button

**API call — System Prompt:**
```
You are an expert resume writer and LaTeX typesetter specializing in ATS-compliant resumes.

Using the resume content provided, rewrite and restructure it into a complete, compilable LaTeX document that:
1. Uses a clean, single-column layout (ATS systems struggle with multi-column)
2. Uses standard LaTeX packages: geometry, hyperref, enumitem, titlesec, fontenc
3. Includes all standard sections: Contact Info, Summary, Experience, Education, Skills
4. Rewrites bullet points to start with strong action verbs
5. Adds quantifiable achievements where inferable
6. Removes all ATS-unfriendly formatting (tables, text boxes, images)
7. Uses clean \section{} headers parsable by any ATS
8. Keeps font to a standard serif (Computer Modern or similar)
9. Outputs ONLY the raw LaTeX code — no explanation, no markdown fences

Begin your response with \documentclass and end with \end{document}
```

**UI:**
```
┌──────────────────────────────────────────────┐
│  📄 Optimized LaTeX Resume                   │
│  ─────────────────────────────────────────── │
│  \documentclass[11pt,a4paper]{article}       │
│  \usepackage[margin=1in]{geometry}           │
│  \usepackage{enumitem}                       │
│  ...                                         │
│                                              │
│  [Copy LaTeX]  [Download .tex]               │
└──────────────────────────────────────────────┘
```

---

## Application Flow

```
User uploads resume (.pdf / .docx)
         │
         ▼
Client extracts text (mammoth / base64)
         │
         ▼
API Call #1: Score + Pros/Cons Analysis
         │
         ▼
Display: Score Ring + Pros/Cons Panel + Keywords
         │
         ▼
User clicks "Optimize Resume →"
         │
         ▼
API Call #2: LaTeX Generation
         │
         ▼
Display: LaTeX Code Block + Copy/Download
```

---

## React Component Structure

```
<App>
  ├── <UploadZone />           # Drag & drop file input
  ├── <AnalyzeButton />        # Triggers API Call #1
  ├── <ScoreRing />            # Animated score display (0–100)
  ├── <SummaryCard />          # 2-sentence AI summary
  ├── <ProsConsPanel />        # Two-column strengths/weaknesses
  ├── <KeywordsPanel />        # Found / missing keyword chips
  ├── <SectionScores />        # Per-section score bars
  ├── <OptimizeButton />       # Triggers API Call #2
  └── <LaTeXOutput />          # Code block + copy button
```

---

## State Schema

```javascript
const initialState = {
  // Upload
  file: null,
  fileName: "",
  resumeText: "",
  fileType: "",          // "pdf" | "docx"

  // Analysis
  analysisStatus: "idle", // "idle" | "loading" | "done" | "error"
  score: null,
  grade: "",
  summary: "",
  pros: [],
  cons: [],
  keywordsFound: [],
  keywordsMissing: [],
  sectionScores: {},

  // Optimization
  optimizeStatus: "idle", // "idle" | "loading" | "done" | "error"
  latexOutput: "",
};
```

---

## API Call Implementation

### Call #1 — Analysis

```javascript
async function analyzeResume(resumeText) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: ATS_ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze this resume:\n\n${resumeText}`
        }
      ]
    })
  });

  const data = await response.json();
  const text = data.content.map(i => i.text || "").join("");
  return JSON.parse(text); // returns structured ATS analysis
}
```

### Call #2 — LaTeX Optimization

```javascript
async function optimizeResume(resumeText) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: LATEX_OPTIMIZATION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Convert and optimize this resume to ATS-compliant LaTeX:\n\n${resumeText}`
        }
      ]
    })
  });

  const data = await response.json();
  return data.content.map(i => i.text || "").join("").trim();
}
```

---

## Design System

### Color Palette
| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0F1117` | App background |
| `--surface` | `#1C1F2E` | Card backgrounds |
| `--border` | `#2D3148` | Dividers, card borders |
| `--accent` | `#6366F1` | Primary actions (Indigo) |
| `--accent-hover` | `#4F46E5` | Button hover |
| `--success` | `#22C55E` | Good score, pros, found keywords |
| `--warning` | `#F59E0B` | Medium score |
| `--danger` | `#EF4444` | Low score, cons, missing keywords |
| `--text-primary` | `#F1F5F9` | Headings |
| `--text-secondary` | `#94A3B8` | Body, labels |

### Typography
- **Display / Score:** `Inter` 700, large (used with restraint for the score number)
- **Body:** `Inter` 400, 14–16px
- **Code (LaTeX):** `JetBrains Mono` or `Fira Code` — monospaced, syntax-highlighted

### Signature Element
The **animated score ring** — a circular SVG progress indicator that draws itself on load, color-shifting from red → amber → green as the number counts up. This is the single most memorable visual moment in the tool.

---

## ATS Optimization Rules Applied in LaTeX Output

The AI should ensure the following when generating LaTeX:

1. **No multi-column layouts** — single column only
2. **Standard section headers** — Experience, Education, Skills, Summary
3. **No graphics or images** — pure text content
4. **Consistent date formatting** — `Month YYYY – Month YYYY`
5. **Bullet points with action verbs** — "Led", "Built", "Increased", "Reduced"
6. **Quantified metrics** — "Increased sales by 32%" over "Improved sales"
7. **Skills listed as comma-separated keywords** — not in tables or grids
8. **Clean margins** — 1 inch all sides (`geometry` package)
9. **Font size 10–12pt** — readable by OCR-based ATS
10. **No fancy symbols** — avoid `\faIcon`, emoji, or custom fonts

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Unsupported file type | Show inline error: "Only PDF and DOCX files are supported." |
| File too large (>5MB) | Show: "File too large. Please upload a resume under 5MB." |
| API timeout | Show retry button with: "Analysis took too long. Try again." |
| Invalid JSON from API | Fall back to raw text display with error note |
| Empty resume text | Show: "Couldn't read text from this file. Try a different format." |

---

## Accessibility

- All interactive elements keyboard-navigable
- Score ring has `aria-label="ATS Score: {score} out of 100"`
- Color is never the only signal — icons + text reinforce all states
- `prefers-reduced-motion` respected — score ring skips animation
- Copy button announces "Copied!" via `aria-live` region

---

## Out of Scope (v1)

- Job description matching (keyword gap by job posting)
- Multi-resume comparison
- Resume history / saved sessions
- Direct PDF export from LaTeX
- Account system or authentication
- Mobile-native app

---

## Build Order

1. **Scaffold** — React app shell, Tailwind, state setup
2. **Upload Zone** — File input, mammoth DOCX parsing, PDF base64
3. **API Call #1** — Score analysis, JSON parsing, error handling
4. **Score UI** — Animated ring, grade label, summary card
5. **Pros/Cons UI** — Two-column panel, keyword chips
6. **Section Scores** — Mini progress bars per section
7. **API Call #2** — LaTeX generation
8. **LaTeX Output UI** — Syntax-highlighted code block, copy button
9. **Polish** — Loading states, transitions, empty states, error flows
10. **Accessibility audit** — Keyboard nav, ARIA labels, motion prefs
