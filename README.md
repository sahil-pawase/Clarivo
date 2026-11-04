# CLARIVO: Enterprise AI Data Platform & Decision Intelligence

[![Architecture](https://img.shields.io/badge/Architecture-Local--First%20Zero--Trust-blue?style=for-the-badge&logo=shield)](file:///c:/Users/sahil/OneDrive/Desktop/app.clarivo-main/EXECUTIVE_PITCH_AND_ARCHITECTURE.md)
[![Database](https://img.shields.io/badge/Database-Neon%20Serverless%20PostgreSQL%2016-336791?style=for-the-badge&logo=postgresql)](https://neon.tech)
[![AI Engine](https://img.shields.io/badge/AI%20Copilot-Google%20Gemini%203.6%20Flash-8E75C2?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.11-009688?style=for-the-badge&logo=fastapi)](http://localhost:8000/docs)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript%20%7C%20Tailwind-61DAFB?style=for-the-badge&logo=react)](http://localhost:3000)
[![Compliance](https://img.shields.io/badge/Compliance-GDPR%20%7C%20SOC--2%20Type%20II%20Ready-success?style=for-the-badge)](file:///c:/Users/sahil/OneDrive/Desktop/app.clarivo-main/COMPETITION_EVALUATION_GUIDE.md)

---

## 🌟 Executive Overview

**Clarivo** is an enterprise-grade, **local-first AI data analysis and decision intelligence platform** engineered for organizations seeking the power of modern cloud data warehouses without sacrificing data privacy, latency, or compliance.

Traditional BI solutions (e.g. PowerBI, Tableau) suffer from steep learning curves, expensive per-seat licenses, and multi-week backlogs for simple queries. Clarivo eliminates this friction with **context-grounded Gemini 3.6 Flash Text-to-SQL**, **automated C-Suite executive briefings**, **built-in PII and data hygiene auditing**, and a universal **⌘K Command Center**.

```
                           CLARIVO ENTERPRISE PLATFORM
┌──────────────────────────────────────────────────────────────────────────────┐
│  🖥️ CLIENT TIER: React 18 + TypeScript + Tailwind + Plotly Studio + ⌘K Menu │
│  🛡️ GATEWAY TIER: X-Correlation-ID + X-Response-Time-Ms + Security Headers    │
│  ⚡ APPLICATION TIER: FastAPI ASGI Core + Heuristic Statistical Fallback Engine│
│  ☁️ PERSISTENCE TIER: Neon Cloud Serverless PostgreSQL 16 + Local SQLite DB  │
│  🤖 INTELLIGENCE TIER: Google Gemini 3.6 Flash Schema-Grounded Copilot Engine │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Enterprise Capabilities

### 1. 🤖 AI Natural Language to SQL Copilot
- Translates plain English business questions directly into syntactically validated, optimized PostgreSQL `SELECT` queries.
- Grounds queries against the live PostgreSQL catalog (`information_schema`) to prevent hallucinations.
- Returns query execution rationales, confidence scores, and visual chart recommendations.

### 2. 📑 1-Click C-Suite Executive Decision Briefings
- Automatically synthesizes millions of data points into a formatted executive briefing.
- Generates strategic headlines, 2-paragraph executive summaries, 4 core KPI tiles, risk matrices with countermeasures, and 30/90-day actionable roadmaps.
- One-click **Export to PDF** and **Copy Markdown Brief** for boardroom presentations.

### 3. 🛡️ Automated Data Governance & PII Scanner
- Scans column vectors for Personally Identifiable Information: Emails, Phone numbers, Payment cards, SSNs, and IP addresses.
- Computes an **Enterprise Data Hygiene Score (0-100%)** and assigns letter grades (A+, A, B, C).
- Provides actionable tokenization and irreversible SHA-256 hashing recommendations aligned with GDPR and SOC-2 guidelines.

### 4. ⚡ Universal ⌘K Command Center
- Floating glassmorphic command palette triggered anywhere via **`Ctrl+K`** or **`⌘K`**.
- Instant fuzzy search across datasets, SQL tools, executive report generators, role switches, and visualization screens.

### 5. 🔄 Hybrid Zero-Downtime Resilience
- Primary storage: **Neon Serverless PostgreSQL (AWS us-east-2, TLS 1.3 enforced)**.
- Automated offline failover: Seamlessly switches to local SQLite (`clarivo.db`) and heuristic statistical engines if network drops, ensuring **100% live presentation uptime**.

### 6. 📊 Enterprise Data Studio & Clean Room
- 10+ interactive visualization types: Histograms, Scatter Plots, Box Plots, Correlation Heatmaps, Donut Charts, and Bar Charts.
- Automated data cleaning: Mean/median/mode imputation, IQR outlier treatment, and deduplication.

---

## 🔐 Verified Competition Credentials

For competition evaluators and jury members:

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Lead Administrator** | `pawasesahil2004@gmail.com` | `Sahil2004&&` | Full Platform Access & Database Sync |
| **Enterprise Admin** | `admin@clarivo.io` | `admin123` | Full Administrative & SQL Access |
| **Data Analyst / Student** | `student@clarivo.io` | `student123` | Analytics, Visualizations & Learning Hub |

---

## 🛠️ Quickstart Guide

### Option 1: Standard Launch (Windows)
1. Double click **`start-clarivo.bat`** (or **`run-clarivo.bat`**).
2. The browser will open automatically at **`http://localhost:3000`**.
3. Backend API and Swagger docs will be live at **`http://localhost:8000/docs`**.

### Option 2: Docker Compose (Production Container)
```bash
# Spin up production backend and frontend
docker compose up -d

# Verify container health
docker compose ps
```

### Option 3: Manual Execution
```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python main.py

# Terminal 2: Frontend
cd frontend
npm start
```

---

## 📚 Technical Documentation & Competition Dossier

- **[EXECUTIVE_PITCH_AND_ARCHITECTURE.md](file:///c:/Users/sahil/OneDrive/Desktop/app.clarivo-main/EXECUTIVE_PITCH_AND_ARCHITECTURE.md)**: Full 5-minute live competition script, C4 architecture diagrams, and market impact analysis.
- **[COMPETITION_EVALUATION_GUIDE.md](file:///c:/Users/sahil/OneDrive/Desktop/app.clarivo-main/COMPETITION_EVALUATION_GUIDE.md)**: Jury Q&A answers, rubric breakdown, and technical evaluation defense.
- **[Interactive API Documentation (Swagger)](http://localhost:8000/docs)**: Complete OpenAPI 3.0 specification for all REST endpoints.

---

## 🏆 Innovation & Technology Stack

- **Frontend Core**: React 18, TypeScript, Tailwind CSS, Heroicons, Recharts, Plotly.js, Electron.
- **Backend Core**: Python 3.11, FastAPI, Uvicorn, SQLAlchemy, Pandas, NumPy, Pydantic v2.
- **Databases**: Neon Serverless PostgreSQL 16 (Cloud) / SQLite (Edge Fallback).
- **AI Models**: Google Gemini 3.6 Flash / Gemini 2.5 Flash with Context-Grounded Schemas.
- **DevOps**: Docker Multi-Stage, Docker Compose, GitHub Actions CI/CD.
