# Dent Vision AI — Project Overview

AI-powered vehicle damage detection platform. Upload car images and get instant classification results powered by a fine-tuned ResNet50 model.

---

## Architecture

```
dentvision_AI/
├── frontend/          → React + Vite (deployed on Vercel)
│   └── api/           → Vercel serverless functions
│       └── send-report.js  → PDF generation + Gmail email
├── backend/           → FastAPI + PyTorch (deployed on Hugging Face Spaces)
│   └── dentvision-ai/ → HF Spaces git repo (canonical deploy)
└── project_overview.md
```

**Analysis flow:**
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

**Email report flow:**
```
User clicks "Send Report"
       ↓
Browser compresses images → base64 JSON
       ↓
POST /api/send-report (Vercel serverless function)
       ↓
pdf-lib generates PDF (cover page + per-image pages)
       ↓
nodemailer → Gmail SMTP → Owner's inbox
```

> HF Spaces blocks outbound SMTP/HTTPS to email APIs — email sending runs on
> Vercel instead, which has no network restrictions.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| 3D Visuals | React Three Fiber, Drei, Three.js |
| Animations | Framer Motion, GSAP |
| Backend | FastAPI, Uvicorn |
| ML Model | PyTorch, ResNet50 (transfer learning) |
| PDF Generation | pdf-lib (Vercel serverless, Node.js) |
| Email Delivery | nodemailer + Gmail SMTP (Vercel serverless) |
| Frontend Deploy | Vercel (with serverless API functions) |
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

**HF Spaces — Damage Analysis**
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

**Vercel — Email Report**
```
POST /api/send-report
Content-Type: application/json
Body: {
  "images": ["<base64>", ...],   // JPEG compressed, max 900px
  "results": [{ class, confidence, all_scores }, ...]
}

Response: { "status": "sent", "count": 2 }
```

---

## Changelog

### v1.4 — 3D Garage Hero Redesign (`feature/ui-improvements`)

**New: Scroll-driven single-vehicle garage hero**
- Replaced the multi-car showroom with a focused single-vehicle hero (Toyota Supra MK4 GLB)
- 4-stage auto-sequence driven by scroll + internal timer (no manual scroll required after car parks):
  1. **Entrance** — car drives in from off-screen left with suspension bob, wheel rotation, and headlight glow
  2. **Zoom-in** — camera lerps to inspection angle once car parks at `rawP = 0.45`
  3. **AI Scan** — emissive scan beam sweeps the car's bounding box length; scan overlay effect
  4. **Damage Detection** — 4 floating callout cards reveal one-by-one (1.2s each, sequential) at 3D world-space anchors on the car: Dent · Scratch · Paint Damage · Bumper Scuff, each showing confidence score, severity badge, and repair estimate
  5. **Inspection Complete** — stage 5 inspection report reveals bottom-strip damage findings (staggered per item, 0.5s apart)
  6. **Swipe hint** — "SWIPE UP TO CONTINUE" double-chevron hint appears after report is fully revealed; one user scroll gesture triggers smooth exit to next section

**3D floating damage annotations (stage 3)**
- 4 callout cards anchored to world-space positions on the parked car via drei `<Html>`
- Sequential reveal: one card at a time using Framer Motion `useMotionValue` driven by `useFrame` — no React re-renders during animation
- Each card: 250ms fade-in + 700ms hold + 250ms fade-out (1200ms total); total stage = 4.8s
- Cards colour-coded by severity (HIGH = red, MED = amber, LOW = blue)
- Anchor heights spread across a wide vertical range so projected screen positions never overlap
- To swap damage data: edit `HERO_SUPRA.damage` and `DAMAGE_ANCHORS` in `App.jsx`

**Auto-sequence timeline**

| Segment | Duration | p range |
|---------|----------|---------|
| Zoom-in | 1.8 s | 0.45 → 0.62 |
| AI Scan | 1.2 s | 0.62 → 0.77 |
| Damage callouts (4 × 1.2s) | 4.8 s | 0.77 → 0.93 |
| Inspection complete | 1.0 s | 0.93 → 1.00 |

**Garage environment**
- Full 3D inspection garage: structural columns, walls, floor, LED screen, tool cabinet, EV charger, monitor, gate posts
- Off-white neon rings on car platform (emissiveIntensity tuned down to avoid overpowering car color)
- LED screen neon frame widened (10.8 m housing) so content doesn't overflow bezels
- Z-fighting eliminated: all geometry lifted ≥ 0.005 m off y = 0

**Scroll / camera behaviour**
- Hero section height: **300 vh** — car parks at ~81 vh of scroll, auto-sequence handles the rest
- Camera lerp speeds: fast during zoom-in (0.08), fast on exit (0.09), slow elsewhere (0.038)
- After sequence: `running = true` kept set so scroll-back to `rawP < 0.3` resets cleanly; scroll-forward by 30 px fires smooth exit to hero end
- `ScrollStory` gets `paddingTop: 30vh` buffer so Damage Classification content is safely in view when the hero canvas fades

**Bug fixes**
- Fixed sequence restart on scroll-back: kept `running = true` after natural completion instead of resetting it
- Fixed blank space gap after hero: changed `isInView` condition from `rect.bottom > window.innerHeight − 1` to `rect.bottom > 0` so the canvas stays visible through the full hero spacer
- Fixed hero canvas not collapsing over Damage Classification: hero height + 30vh ScrollStory buffer ensure section content is well below viewport top when canvas first fades
- Fixed full-page click/upload blocker: `pointer-events: none` does NOT cascade to children in HTML (unlike SVG) — added it explicitly to `GridBackground`'s inner child divs and to the R3F `<Canvas>` element, both of which had `position: absolute, inset: 0` covering the entire page with default `pointer-events: auto`
- `StoryScene` `useInView` threshold lowered from 0.2 → 0.05 so scene reveal animations trigger as soon as the section enters the viewport
- Fixed Paint Damage callout card clipping: world-space Y=2.65 projected outside viewport from inspection camera; lowered to Y=1.45 so card renders in the upper-mid screen region

---

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

### v1.3 — Email Report (`feature/email-report`)

**New feature: Send Report**
- "✉ Send Report" button in the action bar — sends a full PDF damage report to the owner's inbox
- Button has 4 states: idle → sending → sent → error, with auto-reset after 4s
- PDF generated server-side via `pdf-lib` (Vercel serverless function):
  - Cover page with summary table (class, confidence, severity per image)
  - Per-image pages: embedded photo, score bars for all 6 classes, recommendation text
- Email sent via `nodemailer` + Gmail SMTP (app password auth)
- Images compressed to base64 (max 900px, JPEG 78%) in the browser before upload — keeps payload small
- Email sending runs on **Vercel** (not HF Spaces) to avoid HF outbound network restrictions

**Environment variables required (Vercel dashboard):**
| Variable | Purpose |
|----------|---------|
| `GMAIL_USER` | Gmail address used as sender |
| `GMAIL_APP_PASSWORD` | 16-char Google App Password |
| `REPORT_RECIPIENT` | Inbox that receives the report |

---

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

# frontend/.env.development.local  (for vercel dev — email function)
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxxxxxx
REPORT_RECIPIENT=recipient@gmail.com
```

**To test email locally (requires Vercel CLI):**
```bash
cd frontend
npx vercel dev    # runs Vite + /api/* functions together
```

---

## Author

Built by **Sam** — [LinkedIn](https://www.linkedin.com/in/shubhamk07/)

© 2026 Dent Vision AI
