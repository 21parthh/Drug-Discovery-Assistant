# 🧬 AI Drug Discovery Assistant

The **AI Drug Discovery Assistant** is a simple, intelligent tool that helps researchers and students explore drug targets, analyze compounds, and generate AI-driven reports. It connects real scientific databases like **Open Targets** and **ChEMBL** with an AI engine to make drug discovery easier and faster.

---

## 🚀 Features

### 🔬 Target Search
Find and explore biological targets for diseases using the Open Targets API.

### 💊 Compound Lookup
Fetch compound properties (IC50, activity, structure, etc.) from the ChEMBL API.

### 🤖 AI Analysis
Use an AI model to:
- Explain compound activity  
- Suggest improvements  
- Identify risks or interactions  

### 📄 Auto-Generated Reports
Create complete research summaries with:
- Target information  
- Compound analysis  
- AI insights  
- Mechanism of action  
- References  

### 🔐 Admin Panel
A protected dashboard to:
- View user activity   

---

## 🛠️ Tech Stack

- **React.js + Vite** (Frontend)
- **Supabase** (Authentication + Database)
- **Tailwind CSS + shadcn/ui**
- **Open Targets API**
- **ChEMBL API**
- **Custom LLM API** (for analysis & reports)

---

## 📦 Installation

```bash
git clone https://github.com/21parthh/Drug-Discovery-Assistant
cd drug-discovery-assistant
npm install
npm run dev
