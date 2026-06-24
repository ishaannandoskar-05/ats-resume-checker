<div align="center">

# 📄 ATS Resume Checker

**AI-powered resume analyzer that scores ATS compatibility and generates an optimized LaTeX resume**

[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Claude](https://img.shields.io/badge/Claude-Sonnet%204.6-CC785C?style=for-the-badge)](https://anthropic.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**Upload your resume. Know your score. Get hired.**

</div>

---

> Most resumes are rejected before a human ever reads them — ATS systems filter out candidates based on formatting, keywords, and structure. This tool uses Claude AI to score your resume's ATS compatibility (0–100), identify specific strengths and weaknesses, and generate a fully optimized, ATS-compliant LaTeX resume ready to compile and submit.

---

## 📸 Demo

<!-- Add screenshot here -->
![ATS Resume Checker](docs/screenshot.png)

---

## ✨ Features

- **ATS Score (0–100)** — instant compatibility score with color-coded grade (Poor / Needs Work / Good / Excellent)
- **Pros & Cons breakdown** — specific, actionable strengths and weaknesses, not vague feedback
- **Keyword analysis** — keywords detected in your resume vs. keywords you're missing
- **Section scores** — per-section breakdown across Contact Info, Experience, Education, Skills, and Formatting
- **LaTeX optimization** — one-click generation of a fully ATS-compliant LaTeX resume from your content
- **PDF + DOCX support** — upload either format, text extraction handled client-side

---

## 🏗️ How It Works

```
Upload resume (.pdf / .docx)
        ↓
Client extracts text (mammoth / base64)
        ↓
API Call #1 → Claude analyzes ATS compatibility
        ↓
Score ring + Pros/Cons + Keywords + Section scores
        ↓
Click "Optimize Resume →"
        ↓
API Call #2 → Claude generates ATS-compliant LaTeX
        ↓
Copy or download .tex file
```

---

## 📊 Scoring Criteria

| Factor | What's Checked |
|--------|---------------|
| Contact info | Name, email, phone, LinkedIn/GitHub present |
| Section headers | Standard headers (Experience, Education, Skills) |
| Formatting | Bullet points vs. paragraphs, no tables or columns |
| Action verbs | Strong opening verbs on every bullet |
| Quantification | Measurable achievements ("increased by 32%") |
| Keywords | Density of common ATS filter terms |
| ATS compatibility | No images, headers/footers, or text boxes |
| Length | 1–2 pages optimal |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, Tailwind CSS |
| AI Engine | Anthropic API (Claude Sonnet 4.6) |
| DOCX Parsing | mammoth.js |
| PDF Handling | Base64 → Claude native PDF reading |
| State | useState / useReducer (in-memory) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Anthropic API key

### Setup

```bash
# Clone
git clone https://github.com/ishaannandoskar-05/ats-resume-checker.git
cd ats-resume-checker

# Install dependencies
npm install

# Add your API key
cp .env.example .env
# Set VITE_ANTHROPIC_API_KEY in .env

# Run
npm run dev
```

Open `http://localhost:5173`

---

## 📁 Project Structure

```
ats-resume-checker/
├── src/
│   ├── components/
│   │   ├── UploadZone.jsx          # Drag & drop file input
│   │   ├── ScoreRing.jsx           # Animated SVG score display
│   │   ├── ProsConsPanel.jsx       # Strengths / weaknesses columns
│   │   ├── KeywordsPanel.jsx       # Found / missing keyword chips
│   │   ├── SectionScores.jsx       # Per-section score bars
│   │   └── LaTeXOutput.jsx         # Code block + copy button
│   ├── api/
│   │   ├── analyzeResume.js        # ATS scoring API call
│   │   └── optimizeResume.js       # LaTeX generation API call
│   └── App.jsx
├── docs/                           # Screenshots
├── .env.example
└── package.json
```

---

## 📄 License

MIT © [Ishaan Nandoskar](https://github.com/ishaannandoskar-05)
