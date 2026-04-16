# FileSure Tech Ops & Support Assignment

Full-stack implementation of a **company data explorer** for FileSure, with:

- Python ingestion pipeline that cleans a CSV and loads it into MongoDB.
- Node/Express API for querying companies with filters and pagination.
- React + Vite frontend (deployed on Vercel) to explore the dataset with a modern UI.

---

## Live URLs

- **Frontend (Vercel)**:  
  https://filesure-tech-ops-assignment-git-main-ankit-dimris-projects.vercel.app/

- **Primary API (Render)**:  
  https://filesure-tech-ops-assignment-8atf.onrender.com

Example endpoints:

- `GET /companies?page=1&limit=10`  
- `GET /companies/summary`

---

## Tech Stack

- **Frontend**: React, Vite, Framer Motion, CSS (no UI library)
- **Backend**: Node.js, Express
- **Ingestion**: Python, Pandas, PyMongo
- **Database**: MongoDB Atlas
- **Hosting**: Vercel (frontend), Render (API + ingestion job)

---

## Folder Structure

```text
.
├─ api/              # Node/Express API
│  ├─ src/
│  │  ├─ index.js    # Server bootstrap
│  │  ├─ db.js       # Mongo connection
│  │  └─ routes/     # /companies routes
│  └─ package.json
├─ frontend/         # React + Vite frontend
│  ├─ src/
│  │  ├─ App.jsx
│  │  └─ App.css
│  └─ package.json
├─ ingest/           # One-time ingestion script
│  ├─ ingest_companies.py
│  ├─ company_records.csv
│  └─ requirements.txt
└─ .env.example      # Sample env for local dev
```

---

## Environment Variables

### Root / API (Node)

Create `.env` in the **repo root**:

```env
# MongoDB (local or Atlas)
MONGO_URI=mongodb://localhost:27017
MONGO_DB=filesure_assignment
MONGO_COLLECTION=companies

# API port
PORT=4000
```

For production (Render), `MONGO_URI` is the **Atlas connection string**, for example:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGO_DB=filesure_assignment
MONGO_COLLECTION=companies
PORT=4000
```

### Frontend (Vite)

Create `frontend/.env`:

```env
# Local dev hitting local API
VITE_API_BASE=http://localhost:4000

# For production build / Vercel, this is set in the Vercel dashboard:
# VITE_API_BASE=https://filesure-tech-ops-assignment-8atf.onrender.com
```

In `App.jsx` the base URL is read as:

```js
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
```

---

## Ingestion: Load & Clean Company Data

The ingestion step is a **one-time job** that reads the CSV, cleans data, and writes to MongoDB.

### 1. Install Python deps

```bash
cd ingest
pip install -r requirements.txt
```

### 2. Configure Mongo for ingestion

In root `.env` (same values used by the API):

```env
MONGO_URI=mongodb://localhost:27017
MONGO_DB=filesure_assignment
MONGO_COLLECTION=companies
```

For Atlas, set `MONGO_URI` to your Atlas URI.

### 3. Run the script

```bash
cd ingest
python ingest_companies.py
```

What it does:

- Reads `company_records.csv`.
- Normalizes dates and numeric fields.
- Validates emails and sets `is_valid_email`.
- Clears the target collection and inserts all documents.
- Creates an index on `(status, state)` for fast filtering.

After this step, the `filesure_assignment.companies` collection is ready for the API.

---

## API: Running Locally

From the `api` folder:

```bash
cd api
npm install
npm run dev    # or npm start
```

By default the API listens on `http://localhost:4000`.

Core endpoints:

- `GET /companies`

  Query params:

  - `page` (number, default 1)
  - `limit` (number, default 10)
  - `status` (optional filter, exact match)
  - `state` (optional filter, exact match)

  Example:

  ```http
  GET /companies?page=1&limit=10&status=Active&state=Maharashtra
  ```

  Returns:

  ```json
  {
    "data": [ ...company documents... ],
    "page": 1,
    "limit": 10,
    "total": 80
  }
  ```

- `GET /companies/summary`

  Returns an array of `{ status, count }` summarizing companies by status.

---

## Frontend: Running Locally

From the `frontend` folder:

```bash
cd frontend
npm install
npm run dev
```

Make sure `VITE_API_BASE` is set to `http://localhost:4000` when you want to use the local API.

Features:

- Filters by **Status** and **State**.
- Paginated table (10 records per page).
- Summary chips showing count per status.
- Subtle motion/animations via Framer Motion.
- Responsive layout; table uses compact styling for many columns.

---

## Deployment Notes

- **Ingestion on Render**  
  `ingest/ingest_companies.py` can be run as a **Background Worker** on Render pointing to Atlas:

  - Build command: `pip install -r requirements.txt`
  - Start command: `python ingest_companies.py`
  - Env: `MONGO_URI`, `MONGO_DB`, `MONGO_COLLECTION` as above.

- **API on Render**  
  Node service with:

  - Root: `api`
  - Build: `npm install`
  - Start: `npm start`
  - Env: same Mongo vars as ingestion.

- **Frontend on Vercel**  
  Vite app in `frontend/` with:

  - Env (`Vercel → Project Settings → Environment Variables`):

    ```env
    VITE_API_BASE=https://filesure-tech-ops-assignment-8atf.onrender.com
    ```

---

## How to Review

For FileSure reviewers:

1. Open the **live frontend**:  
   https://filesure-tech-ops-assignment-git-main-ankit-dimris-projects.vercel.app/

2. Try:
   - Filtering by status and state.
   - Navigating between pages.
   - Observing summary chips update.

3. Optionally inspect API responses directly:  
   https://filesure-tech-ops-assignment-8atf.onrender.com/companies?page=1&limit=10



The repo contains all code for ingestion, API, and frontend so you can replicate the setup locally if needed.

---

## Architecture Overview

The project is split into three logical services:

- **Ingestion (Python, `ingest/`)**  
  Reads `company_records.csv`, cleans and normalizes fields (dates, capital, email validity) and writes documents into MongoDB (`filesure_assignment.companies`).

- **API (Node/Express, `api/`)**  
  Connects to MongoDB using `MONGO_URI` and exposes REST endpoints:  
  - `GET /companies` with pagination and filters (`status`, `state`)  
  - `GET /companies/summary` for aggregated counts by status.

- **Frontend (React + Vite, `frontend/`)**  
  Uses `VITE_API_BASE` to call the API, displays a paginated table, summary chips, and filters, with Framer Motion for subtle animations.

Data flow:

```text
CSV (company_records.csv)
        ↓
  ingest_companies.py (Python)
        ↓
 MongoDB Atlas (filesure_assignment.companies)
        ↓
   Node/Express API (GET /companies, /companies/summary)
        ↓
 React/Vite frontend (filters, table, summary UI)
```

---

## Author

**Ankit Dimri**  
Full-Stack Developer · Dehradun, India  

[![GitHub](https://img.shields.io/badge/GitHub-AnkitDimri4-black?logo=github)](https://github.com/AnkitDimri4)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Ankit%20Dimri-blue?logo=linkedin)](https://linkedin.com/in/ankit-dimri-a6ab98263)
[![LeetCode](https://img.shields.io/badge/LeetCode-Profile-orange?logo=leetcode)](https://leetcode.com/u/user4612MW/)

## Tech Stack

![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Framework-Express-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)
![Python](https://img.shields.io/badge/Ingestion-Python-3776AB?logo=python&logoColor=white)
![Pandas](https://img.shields.io/badge/Data-Pandas-150458?logo=pandas&logoColor=white)
![Vercel](https://img.shields.io/badge/Hosting-Vercel-000000?logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Hosting-Render-46E3B7?logo=render&logoColor=black)
![Git](https://img.shields.io/badge/Version_Control-Git-orange?logo=git)
![Status](https://img.shields.io/badge/Project-Completed-brightgreen)

---