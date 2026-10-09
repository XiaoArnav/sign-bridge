# RASTA (रास्ता) 🛣️
> **Road Assessment & Safety Tracking Authority**  
> *Street-Level Civic & Road Hazard Tracker · Desktop + Mobile-First · Hackathon-Ready*  
> **Protothon 2026** · Bosscoder School of Technology × B/STACK · **Problem Statement #1 (Ziyad)**  
> **Team ID:** `2392608146-Obsidian`

---

## 🎯 Core Mission & The Winning Loop
Every interaction directly solves Problem Statement #1:
```
1. Report in <10s (Photo + GPS Pin + Category + Spoken Audio)
        ↓
2. Safety Map & Alerts (Commuters discover danger in real-time)
        ↓
3. Autonomous Priority Engine (Queue ranked by P = 0.50S + 0.20E + 0.15C + 0.15T)
        ↓
4. Field Crew Dispatch (Status moves: Open ➔ Acknowledged ➔ In Progress)
        ↓
5. Two-Tier Verification Audit (Contractor uploads "AFTER" photo ➔ Inspector audits ➔ Verified Resolved)
```

---

## 🎨 Design System: Restrained Cyber Trace
Built using the exact visual tokens specified in the RASTA Final UI/UX Blueprint:
* **Midnight Background:** `#0B1220`
* **Surface Card:** `#151F30`
* **Teal Brand Accent:** `#43D9C2`
* **Text Primary:** `#E8EEF7`
* **Severity Red (Critical):** `#EF4444`
* **Severity Amber (High):** `#F59E0B`
* **Severity Blue (Medium):** `#60A5FA`
* **Verified Green:** `#34D399`
* **Micro-Interactions:** 150–220ms transitions, subtle 2–3px hover lifts, accessible `≥44×44px` touch targets.

---

## 📱 Desktop vs Mobile Dual-Architecture

### 💻 Laptop / Desktop (`≥1024px`)
* **Persistent Navigation Sidebar:** Quick jumping across Home, Safety Map, Report, My Reports, and Alerts.
* **Side-by-Side Split View:** Searchable incident queue and interactive map canvas displayed concurrently.
* **Multi-Panel Authority Workspace:** Priority Queue, Workload Overview, Two-Tier Audit Queue, and Intelligence Ops Terminal.

### 📱 Mobile (`<1024px`)
* **Full-Screen Interactive Map:** Edge-to-edge Leaflet GIS canvas.
* **Thumb-Accessible Floating Action Button (FAB):** Persistent `+ Report` button centered in the bottom bar.
* **Draggable Bottom Sheets:** Incident cards slide up from the bottom with photo evidence and confirmation buttons.
* **Camera-First 4-Step Flow:** Single-column touch form designed for one-handed roadside reporting.

---

## ⚡ The 4-Step Reporting Flow (`<10 Seconds`)
1. **Capture Evidence:** Live camera capture or file upload + optional spoken vernacular voice note with recording duration, playback, and delete controls.
2. **Hazard Category:** Electrical Danger (BESCOM), Open Manhole (BWSSB), Pothole / Road Defect (BBMP), Waterlogging (BWSSB), Broken Footpath (BBMP), Other Hazard (Traffic).
3. **Confirm Location:** Instant GPS lock with reverse geocoding and fallback manual pin adjustment.
4. **Single-Action Submit:** Instant generation of Digital Receipt with Ticket ID (`RASTA-8042`) and tracking link.

---

## 🛡️ Municipal Command Center & Priority Engine
Transparent mathematical ranking:
$$\mathbf{P = 0.50S + 0.20E + 0.15C + 0.15T}$$
* **$S$ (Physical Severity):** Imminent threat to life (Live wire = 100, Pothole = 75, Footpath = 45).
* **$E$ (Public Exposure):** Pedestrian & vehicular traffic density of the road.
* **$C$ (Corroboration):** Distinct citizen confirmations and upvotes.
* **$T$ (Aging Factor):** Multiplier for unaddressed days in queue.

### Anti-Fraud Two-Tier Resolution Policy
* **Tier 1 (Contractor Fix):** Field crew uploads "AFTER" completion photo ➔ Moves to `Resolved — Pending Verification`.
* **Tier 2 (Official Audit):** Municipal Inspector reviews the evidence ➔ Moves to `Verified Resolved`.

---

## 🚀 How to Run Locally

```bash
# 1. Clone repository
git clone https://github.com/XiaoArnav/sign-bridge.git

# 2. Enter directory
cd sign-bridge

# 3. Install dependencies
npm install

# 4. Launch development server
npm run dev
```
Open **`http://localhost:5175`** in your browser.

---

## 👥 Team Obsidian

| Member Name | USN | Core Responsibility |
| :--- | :--- | :--- |
| **Arnav Patel** | `2392608166` | Project Lead, Git Architecture & CI/CD |
| **Vikas N** | `2392608146` | Fullstack Integration & Leaflet Dual Canvas |
| **Aditya Kumar** | `2392608071` | Risk Priority Algorithm ($P=0.5S+0.2E+0.15C+0.15T$) |
| **Mayank** | `2392608124` | UI/UX & Restrained Cyber Trace Design System |
| **Sujal Ganesh Nirgude** | `2392608142` | Geolocation, GPS Pinning & Data Engine |
| **Cherish Goyal** | `2392608154` | Pitch Deck, Verification Audit & QA |

---

## ✅ Final Hackathon Acceptance Checklist
- [x] A person can submit a hazard from a phone in <10 seconds without navigating a long form.
- [x] The submitted report appears on the map and in the authority queue using the same database record.
- [x] An administrator can prioritize, assign, and update an incident.
- [x] A resolution photo is submitted and reviewed before final verification.
- [x] Every core interaction works on both mobile and desktop.
