# 🛡️ SolShield Pro — AI-Powered Smart Contract Security Auditor

<div align="center">

**Enterprise-Grade Hybrid Vulnerability Assessment Engine for Solidity Smart Contracts**

![Version](https://img.shields.io/badge/version-1.1.0-00D4FF?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation Guide](#-installation-guide)
- [Running the Project](#-running-the-project)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Screenshots](#-screenshots)
- [Future Roadmap](#-future-roadmap)

---

## 🔍 Overview

**SolShield Pro** is a Final Year Project that implements a **Tri-Layered Hybrid Audit Engine** for Solidity smart contracts. It combines traditional static analysis tools (Slither, Mythril), dynamic fuzzing (Foundry), and AI-powered formal verification (Google Gemini 1.5 Flash) to deliver comprehensive security assessments.

The system features:
- A **3D cyberpunk splash screen** built with Three.js
- A **Monaco-based code editor** with real-time vulnerability decorations
- An **executive dashboard** with analytics charts and KPI tracking
- **Blockchain-based audit proof recording** via Web3/Ganache
- **AI-powered auto-healing** that generates patched code
- **Tamper-proof PDF reports** with SHA-256 integrity verification

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19)                       │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌─────────────────┐  │
│  │ Splash   │ │ Scanner  │ │ Executive  │ │ Audit History   │  │
│  │ (Three.js│ │ (Monaco  │ │ Dashboard  │ │ (Recharts)      │  │
│  │  3D WebGL│ │  Editor) │ │ (Recharts) │ │                 │  │
│  └──────────┘ └──────────┘ └────────────┘ └─────────────────┘  │
│                    ↕ Axios / REST API                             │
│              Zustand Global State Management                     │
└──────────────────────────────────────────────────────────────────┘
                              ↕
┌──────────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI + Python)                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │            TRI-LAYERED AUDIT ENGINE                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │    │
│  │  │ Layer 1  │  │ Layer 1b │  │ Layer 2  │  │ Layer 3│ │    │
│  │  │ Slither  │  │ Mythril  │  │ Foundry  │  │ Gemini │ │    │
│  │  │ (SAST)   │  │ (Symbolic│  │ (DAST)   │  │ (AI)   │ │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐    │
│  │ Scoring    │  │ Auto-Healer│  │ Blockchain Service     │    │
│  │ Engine     │  │ (AI Patch) │  │ (Web3 + Ganache)      │    │
│  │ (CVSS)     │  │            │  │                        │    │
│  └────────────┘  └────────────┘  └────────────────────────┘    │
│                    ↕ SQLAlchemy ORM                               │
│              SQLite Production Database                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🔬 Deep Audit Engine
- **Slither SAST**: Static pattern analysis for reentrancy, access control, unchecked returns
- **Mythril Symbolic Execution**: Mathematical path exploration for hidden vulnerabilities
- **Foundry DAST**: Runtime fuzzing for arithmetic overflow/underflow detection
- **AI Formal Verification**: Gemini 1.5 Flash as a mathematical invariant verifier

### 🎨 Frontend
- **3D Splash Screen**: Custom WebGL scene with Icosahedron geometry, 3000-particle system, and shatter transition
- **Monaco Code Editor**: Full Solidity syntax highlighting with vulnerability line decorations
- **Diff Viewer**: Side-by-side comparison for auto-healed patches
- **Executive Dashboard**: Pie charts, bar charts, KPI cards with real-time metrics
- **Audit History**: Line chart trend visualization with sortable data table
- **PDF Export**: SHA-256 integrity hashing, QR code verification, severity donut chart

### 🔗 Blockchain Integration
- **On-chain Audit Recording**: Audit hashes stored immutably on Ganache
- **Multi-chain Support**: Ethereum, Polygon, BSC, Arbitrum, Optimism via RainbowKit
- **Randomization + Privacy**: Salt-based hash generation for ZKP concepts

### 🤖 Auto-Healing Module
- Takes vulnerable code blocks and generates patched versions using AI
- Side-by-side diff viewer for reviewing patches
- One-click accept and auto-rescan workflow

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, TailwindCSS 3, Three.js, Framer Motion |
| **State** | Zustand 5 |
| **Charts** | Recharts 3 |
| **Editor** | Monaco Editor (@monaco-editor/react) |
| **Web3** | Wagmi, Viem, RainbowKit |
| **Backend** | FastAPI, Python 3.10+, Uvicorn |
| **Database** | SQLAlchemy ORM + SQLite |
| **AI** | Google Gemini 1.5 Flash (generativeai) |
| **Blockchain** | Web3.py, py-solc-x, Ganache |
| **Audit Tools** | Slither, Mythril, Foundry |

---

## 📦 Installation Guide

### Prerequisites
- Python 3.10+
- Node.js 18+
- Ganache (for blockchain features)
- Slither (`pip install slither-analyzer`)
- Foundry (`curl -L https://foundry.paradigm.xyz | bash`)

### 1. Clone Repository
```bash
git clone https://github.com/sardarhafiz44-hsm/SolShield-Pro-Backend.git
cd SolShield-Pro-Backend
```

### 2. Backend Setup
```bash
cd backened

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your GEMINI_API_KEY

# Start FastAPI server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 4. Blockchain Setup (Optional)
```bash
# Start Ganache (GUI or CLI)
ganache-cli --port 7545

# Deploy AuditRegistry contract
cd backened
python deploy.py
```

---

## 🚀 Running the Project

```bash
# Terminal 1: Backend
cd backened
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

---

## 📁 Project Structure

```
SolShield-Pro-Backend/
├── backened/
│   ├── main.py                  # FastAPI server & route handlers
│   ├── audit_engine.py          # Tri-layered audit pipeline
│   ├── audit_engine_fallback.py # Fallback engine (Slither + AI)
│   ├── Auto_healer.py           # AI-powered code patching
│   ├── scoring_engine.py        # CVSS risk scoring algorithm
│   ├── models.py                # SQLAlchemy ORM models
│   ├── database.py              # Database engine & session
│   ├── history_database.py      # Audit history CRUD operations
│   ├── blockchain_service.py    # Web3 blockchain integration
│   ├── deploy.py                # Smart contract deployment
│   ├── analyzer.py              # Regex-based pattern analyzer
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Environment variables (NOT committed)
│   └── blockchain/
│       └── AuditRegistry.sol    # On-chain audit registry contract
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Router & auth guard
│   │   ├── main.jsx             # Entry point with Web3Provider
│   │   ├── Web3Provider.jsx     # RainbowKit + Wagmi config
│   │   ├── pages/
│   │   │   ├── SplashScreen.jsx      # 3D Three.js splash
│   │   │   └── DashboardLayout.jsx   # Multi-tab dashboard
│   │   ├── components/
│   │   │   ├── Scanner.jsx           # Monaco editor + audit
│   │   │   ├── AuditResults.jsx      # Findings display
│   │   │   ├── ExecutiveDashboard.jsx # Analytics KPIs
│   │   │   ├── AuditHistory.jsx      # History table + chart
│   │   │   ├── AnalyticalCharts.jsx  # Radar + Area + Bar charts
│   │   │   ├── MyProjects.jsx        # Project grouping view
│   │   │   ├── SettingsPanel.jsx     # Configuration UI
│   │   │   ├── Sidebar.jsx           # Navigation sidebar
│   │   │   └── solshield-editor.css  # Editor decorations
│   │   ├── store/
│   │   │   └── useStore.js           # Zustand global state
│   │   └── utils/
│   │       └── reportExport.js       # PDF generation + SHA-256
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── index.html
│
├── .gitignore
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/scan` | Quick audit scan (Slither + AI fallback) |
| `POST` | `/deep-audit` | Full tri-layered audit (Slither + Mythril + Foundry + AI) |
| `GET` | `/history` | Fetch all audit history records |
| `POST` | `/auto-heal` | Generate AI-patched code for a vulnerability |

### Request Example
```json
POST /deep-audit
{
  "project_name": "DeFi Token",
  "filename": "Token.sol",
  "code": "pragma solidity ^0.8.0;\ncontract Token { ... }",
  "language": "English"
}
```

### Response Example
```json
{
  "status": "Success",
  "ai_result": {
    "risk_score": {
      "security_score": 75.0,
      "risk_tier": "Medium Risk",
      "ui_metadata": { "color_code": "#FFFF00", "badge_text": "MEDIUM RISK" },
      "vulnerability_breakdown": { "critical": 0, "high": 1, "medium": 1, "low": 0 },
      "total_findings": 2
    },
    "vulnerabilities": [...]
  },
  "blockchain_status": {
    "tx_hash": "0x...",
    "salt": 847291
  }
}
```

---

## 🗺️ Future Roadmap

- [ ] Real-time on-chain vulnerability monitoring via WebSockets
- [ ] GitHub API integration for automated PR patches
- [ ] Multi-language support (Solidity, Vyper, Rust)
- [ ] Team collaboration features with role-based access
- [ ] Cloud deployment with Docker + CI/CD pipeline
- [ ] Gas optimization suggestions engine
- [ ] Integration with Etherscan for verified contract analysis

---

## 👥 Team

**Final Year Project** — Smart Contract Security Auditing Suite

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with 🛡️ by the SolShield Pro Team**

*Securing the decentralized future, one contract at a time.*

</div>
