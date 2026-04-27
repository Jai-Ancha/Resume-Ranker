# 🚀 AI Resume Ranker — RAG Powered Candidate Screening Platform

An AI-powered full-stack web application that semantically ranks resumes against a Job Description using **RAG (Retrieval-Augmented Generation)**, **Vector Search**, and **LLM-generated insights**.

Built as a production-style portfolio project using modern AI-assisted engineering workflows, cloud deployment, and real-world debugging practices.

---

# 🌐 Live Demo

- **Frontend (Vercel):** https://resume-ranker-gules.vercel.app
- **Backend API (Render):** https://resume-ranker-j9ye.onrender.com
- **GitHub Repository:** https://github.com/Jai-Ancha/Resume-Ranker

---

# 📌 Project Overview

Traditional ATS systems rely heavily on keyword matching, which often misses strong candidates whose resumes use different wording.

This project solves that problem using **semantic similarity**:

✅ Understands meaning, not just keywords  
✅ Ranks resumes intelligently  
✅ Generates strengths & improvement suggestions  
✅ Gives recruiter-friendly insights  
✅ Runs as a live cloud-hosted web app

---

# 🧠 Core Features

## 📄 Resume Upload & Parsing
- Upload one or multiple PDF resumes
- Extract text automatically from resumes
- Supports recruiter workflow

## 🧾 Job Description Matching
- Paste any JD into the system
- Compare resumes against requirements

## 🔍 Semantic AI Ranking
- Converts JD + resumes into embeddings
- Uses FAISS vector search for similarity ranking
- Returns best matching candidates first

## 🤖 LLM Candidate Insights
Generates:
- Match percentage
- Strengths
- Missing skills
- Recommendations
- Verdict labels
- Interview readiness signals

## 💻 Beautiful Modern Frontend
- Responsive UI
- Smooth animations
- Dashboard experience
- Recruiter-style workflow

## ☁️ Cloud Deployment
- Frontend deployed on Vercel
- Backend deployed on Render
- Public live links

## 🛡️ Defensive UI Logic
- Handles empty AI responses
- Prevents frontend crashes
- Safe fallback values

---

# 🏗️ System Architecture

```text
User uploads Job Description + Resume PDFs
                ↓
        Next.js Frontend (Vercel)
                ↓
        FastAPI Backend (Render)
                ↓
         PDF Text Extraction
                ↓
     Embedding Generation Layer
                ↓
        FAISS Vector Ranking
                ↓
      LLM Insight Generation
                ↓
     Dashboard Results Display
```


Frontend
```
Next.js
React
TypeScript
Tailwind CSS
Framer Motion
v0.dev (UI acceleration)
shadcn/ui
```
Backend
```
Python
FastAPI
Uvicorn
```
AI / ML
```
Sentence Embeddings
FAISS
RAG Pipeline
Gemini / OpenRouter APIs
File Processing
PyMuPDF / PDF Parsing
```
Deployment
```
Vercel
Render
GitHub
```

How It Works (Step-by-Step)
1️⃣ User Inputs Data

Recruiter:

Pastes Job Description
Uploads resumes
2️⃣ Resume Parsing

Backend extracts clean text from PDF resumes.

3️⃣ Embeddings Created

Text converted into vectors (numerical representations).

4️⃣ Similarity Search

FAISS compares resume vectors with JD vector.

5️⃣ Ranking Generated

Most relevant resumes ranked first.

6️⃣ LLM Insights Added

Generates human-friendly explanations and recommendations.

7️⃣ UI Displays Results

Interactive dashboard shows final analysis.




