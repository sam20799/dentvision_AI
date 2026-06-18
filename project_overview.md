# Dent Vision AI — Project Overview

AI-powered vehicle damage detection platform. Upload car images and get instant classification results powered by a fine-tuned ResNet50 model.

---

## Architecture

```
dentvision_AI/
├── frontend/          → React + Vite (deployed on Vercel)
├── backend/           → FastAPI + PyTorch (deployed on Hugging Face Spaces)
│   └── dentvision-ai/ → HF Spaces git repo (canonical deploy)
└── project_overview.md
```

**Data flow:**
```
User uploads image(s)
       ↓
React Frontend (Vercel / localhost:5173)
       ↓
POST /predict — multipart/form-data
       ↓
FastAPI (Hugging Face Spaces / localhost:8000)
       ↓
ResNet50 inference (~300ms, CPU)
       ↓
{ class, confidence, all_scores }
       ↓
Frontend renders animated results
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| 3D Visuals | React Three Fiber, Drei, Three.js |
| Animations | Framer Motion, GSAP |
| Backend | FastAPI, Uvicorn |
| ML Model | PyTorch, ResNet50 (transfer learning) |
| Frontend Deploy | Vercel |
| Backend Deploy | Hugging Face Spaces (Docker) |

---

## AI Model

| Detail | Value |
|--------|-------|
| Architecture | ResNet50 (frozen layers 0–3, unfrozen layer4) |
| Custom head | Dropout + Linear → 6 classes |
| Training data | 2,300 real car images |
| Accuracy | 80.1% (after Optuna tuning) |
| Inference | CPU, ~300ms per image |
| Model file | `backend/model/saved_model_tuned.pth` |

**Training progression:**

| Step | Approach | Accuracy |
|------|----------|----------|
| 1 | Custom CNN from scratch | 57% |
| 2 | Transfer Learning — ResNet50 | 78% |
| 3 | Hyperparameter Tuning — Optuna | 80% |

**Damage classes:**

| Class | Zone | Meaning |
|-------|------|---------|
| F_Normal | Front | No damage |
| F_Breakage | Front | Panel broken |
| F_Crushed | Front | Structural crush |
| R_Normal | Rear | No damage |
| R_Breakage | Rear | Panel broken |
| R_Crushed | Rear | Structural crush |

---

## API

```
POST /predict
Content-Type: multipart/form-data
Body: file=<image>

Response:
{
  "class": "F_Breakage",
  "confidence": 0.923,
  "all_scores": {
    "F_Breakage": 0.923,
    "F_Crushed": 0.041,
    "F_Normal": 0.018,
    "R_Breakage": 0.009,
    "R_Crushed": 0.006,
    "R_Normal": 0.003
  }
}
```

---

## Changelog

### v1.0 — Initial Release (`ed50384`)
- Cinematic React frontend with 3D car visualization (React Three Fiber)
- Hero section with particle field, scroll-triggered story (5 scenes)
- Single-image upload: drag-drop → analyze → results panel
- FastAPI backend with ResNet50 inference
- 6-class damage classification (front/rear × normal/breakage/crushed)
- Animated probability bars, severity labels, AI recommendation text
- Loading screen with boot sequence animation
- Fixed navbar with smooth scroll-to-upload CTA

### v1.1 — Mobile Responsiveness (`4c760cb` / `4e15f95`)
- Lightweight 3D car scene for mobile (no shadows/env/reflectors — prevents GPU overload)
- Responsive grid layouts across all 5 story scenes
- Touch-friendly button sizing (min 44px tap targets)
- Mobile hamburger menu with animated open/close
- Fixed animation overlaps on small screens
- Scroll indicator and scene numbers scale down on mobile

### v1.2 — Multi-Image Analysis + Backend Fixes (`feature/multi-image-damage-report`)

**New feature: Multi-image upload**
- Upload any number of vehicle images in one session (previously one at a time)
- Drag-drop or click-to-browse accepts multiple files simultaneously
- Each image gets its own result card in a responsive grid (auto-fill, min 320px columns)
- Images append on each drop/click — add more without clearing existing results
- Individual ✕ remove button per card; "↺ Clear All" clears all
- `▷ Run AI Analysis (N)` button shows pending count, greys out when nothing pending
- All pending images analyzed in parallel (`Promise.all`) — simultaneous inference
- Per-card scan animation (sweep line + pulsing dots) while analyzing
- `X/N COMPLETE` progress counter in the action bar
- DEMO MODE badge per card when backend is unreachable (fallback to random results)

**Backend fixes**
- Fixed race condition: replaced hardcoded `image.jpg` temp file with `tempfile.NamedTemporaryFile` — each request now gets a unique file path, preventing parallel requests from overwriting each other's image data
- Added `CORSMiddleware` (`allow_origins=["*"]`) — previously all browser requests from the Vite dev server were silently blocked by CORS preflight, causing all predictions to fall back to demo mode

---

## Running Locally

**Frontend:**
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

**Environment:**
```bash
# frontend/.env.local
VITE_API_URL=http://localhost:8000    # local backend
# VITE_API_URL=https://SHUBHAM2K-dentvision-ai.hf.space  # production
```

---

## Author

Built by **Sam** — [LinkedIn](https://www.linkedin.com/in/shubhamk07/)

© 2026 Dent Vision AI
