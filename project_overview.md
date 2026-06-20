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

### v1.7 — Bugatti Showpiece in Enterprise Scale Section (`main`)

**New 3D showpiece in the "Enterprise Scale" story scene**
- Replaced the 9-cell CSS animation grid (pulsing ◈ icons) with a dedicated WebGL Canvas featuring the Bugatti model as a rotating showpiece
- `BugattiRotator` component: loads `car-bugatti.glb`, auto-scales to 0.85m height (same `Box3` + `SkeletonUtils.clone` pattern as `ParkedCar`), rotates clockwise at 0.18 rad/s via `useFrame`
- `BugattiShowcaseCanvas` (memoised): isolated Canvas with a 3-point light rig (white key, blue fill, gold back), `Environment preset="warehouse"` for metallic reflections, `ContactShadows frames={1}` baked shadow (zero per-frame cost), and `OrbitControls` (zoom/pan disabled) so users can drag to inspect any angle
- "DRAG TO INSPECT" hint label in bottom-right corner

**Bugatti tyre rendering fix**
- Root cause: flat `envMapIntensity = 2.2` applied to all materials including rubber — blown-out tyres; `o.material` assumed to be a single object but tyre meshes use material arrays → un-cloned shared materials caused corruption
- Fix: traverse now handles both single and array materials; rubber-like materials (`roughness > 0.65 && metalness < 0.15`) get `envMapIntensity = 0.15` instead of 2.0; `depthWrite: true`, `depthTest: true`, and `transparent: false` (for fully opaque mats) eliminate z-sort disappearing; `needsUpdate = true` after clone ensures Three.js picks up changes

**Preload**
- `useGLTF.preload("/models/car-bugatti.glb")` registered at module level alongside Supra and parked-car preloads — GLB parses during app load, not on scroll into view

---

### v1.6 — Mobile Hero Touch Architecture (`main`)

**Problem solved: entire page scrolling up during hero sequence**
- Root cause: hero entrance was scroll-driven (200vh spacer + `onScroll`); a fast swipe could outrun the `overflow:hidden` lock that only fires when car parks at sp=0.45, briefly revealing section 01 underneath the fixed hero div.

**New mobile touch architecture (Android + iOS)**
- Body `overflow:hidden` applied immediately when hero is active on mobile — spacer can never reveal section 01 regardless of swipe speed
- Car entrance is now **touch-driven** (swipe delta on `window`) instead of scroll-driven; `onScroll` handler only runs on desktop
- `touchAction: "none"` on hero fixed div prevents native browser scroll gestures on the canvas
- Hint text updated: "SWIPE UP TO EXPLORE" on mobile, "SCROLL TO EXPLORE" on desktop
- `heroActive` added to the scroll/touch `useEffect` deps so body lock re-applies automatically on hero re-activation after chapter wipe

**Root cause fix: swipe up at stage 5 was resetting camera instead of triggering chapter wipe**
- After `lockScroll()` fires (car parks), `lockHandlers.touchstart` is registered — but the *current* touch gesture already fired `touchstart` before that listener existed, leaving `touchStartYRef.current = 0`
- `lockHandlers.touchmove` then computed `dy = 0 − currentY ≈ −500`, hit the `dy < −24 && stage !== 5` branch → `cancelSequence()` → camera reset
- Fix: after `lockScroll()` on mobile, immediately remove `lockHandlers.touchstart` and `lockHandlers.touchmove`; one consolidated `onTouchMove` owns all mobile gestures:
  - Stage 5 + dy > 15px → `triggerTransition()` (chapter wipe to section 01)
  - Sequence running + dy < −40px → `cancelSeqRef()` (downward swipe cancel)
  - Pre-lock → drives car entrance
- `touchend` backup: catches fast flick swipes at stage 5 that don't accumulate 15px during `touchmove`
- All listeners use `passive: false` (consistent with `lockHandlers`) to prevent passive/non-passive dispatch conflicts on Android Chrome

---

### v1.5 — Mobile 3D Parity + UI Polish (`feature/ui-improvements`)

**Full garage on mobile**
- `HeroVehicleLite` deleted; single `HeroVehicleScene` renders the full cinematic garage on both desktop and mobile via a `lowPerf` prop
- `GarageEnvironment` wrapped in `React.memo` — ~120 meshes skip reconciliation on every stage/sceneReady state change (biggest mobile perf win)
- `memo` added to React import

**Mobile shadow strategy (smoothness-first)**
- Desktop: directional light with `castShadow` + `shadow-mapSize [1024,1024]` unchanged
- Mobile (`lowPerf=true`): directional light kept for identical specular/brightness, `castShadow` removed; replaced with a baked `<ContactShadows frames={1}>` under the parked Supra — zero per-frame GPU cost, visually identical from hero camera angles
- Canvas `shadows` prop made constant (was `!isMobile`) — prevents renderer reconfiguration on resize

**Mobile camera — portrait FOV fix**
- `HeroCarController` accepts `lowPerf` prop; sets `camera.fov = 62` on mobile (vs 55 desktop) via `useEffect` on mount — widens the ~30° portrait horizontal FOV to ~37°
- Inspection/scan/damage/component camera positions pulled back for mobile (`PARK_Z + 5.0` vs `+2.5`, `PARK_X + 2.8` vs `+3.5`, slightly higher Y) so the full car fits in the portrait viewport
- All desktop camera positions unchanged

**Mobile damage annotation cards**
- `MOBILE_DAMAGE_ANCHORS`: 4 positions clustered on the near-camera face of the door panel (all at `PARK_Z + 1.1`), spread only in Y — all project near the portrait viewport centre regardless of camera angle (desktop anchors span 4.1m in X, clips on portrait's narrow horizontal FOV)
- `DamageAnnotations` accepts `lowPerf`; on mobile shows only **2 cards** (Dent + Scratch) to avoid overcrowding; card padding/minWidth tightened to `132px`

**Mobile inspection report strip (stage 5)**
- Mobile: **2-row compact list** — `◈ LABEL | SEVERITY BADGE | ESTIMATE` per row; no confidence number, no bar, no TOTAL/AVG CONF summary
- Desktop: full 4-column layout with CONF bars + TOTAL/AVG CONF unchanged
- Summary stats stagger delay corrected for 2-item mobile list

**Resize seamlessness**
- Crossing 768px mid-session now only flips the `lowPerf` prop — no scene subtree unmount, no Suspense re-resolution, no `SceneReadySignal` re-fire, no flash

---

### v1.4 — 3D Garage Hero Redesign (`feature/ui-improvements`)

**New: Scroll-driven single-vehicle garage hero**
- Replaced the multi-car showroom with a focused single-vehicle hero (Toyota Supra MK4 GLB)
- Auto-sequence triggered once the car parks, driven by a 16 ms interval timer:
  1. **Entrance** — car drives in from off-screen left with suspension bob, wheel rotation, and headlight glow
  2. **Zoom-in** — camera lerps to inspection angle once car parks
  3. **AI Scan** — emissive scan beam sweeps the car's bounding box; scan overlay effect
  4. **Damage Detection** — 4 floating callout cards reveal one-by-one (950 ms each) at 3D world-space anchors: Dent · Scratch · Paint Damage · Bumper Scuff, each with confidence score, severity badge, and repair estimate
  5. **Inspection Complete** — bottom-strip damage report reveals with staggered items (0.5s apart)
  6. **Chapter wipe** — "SWIPE UP TO CONTINUE" hint appears; clicking it (or CTA button) triggers a full-screen cinematic chapter transition to section 01

**Chapter transition wipe**
- `ChapterTransition` component: dark panel sweeps up from the bottom, holds to display "CHAPTER 01 — DAMAGE CLASSIFICATION", then sweeps off the top
- Triggered by the swipe hint (now a clickable button) or the CTA `dv:dismiss-hero` custom event
- While the panel covers the screen the hero spacer collapses + page scrolls to `#chapter-01` invisibly — no scroll jerk visible to the user
- Scroll is locked (`overflow: hidden` on body) from the moment the car parks; unlocked once the chapter wipe exits
- Scroll-back gesture (wheel/touch/keyboard up at `scrollY=0` while hero is dismissed) re-activates the hero without remounting WebGL

**Parked set-dressing cars (garage fill)**
- Two static cars parked in the far bays: Lancia (`car-lancia.glb`) and Ford GT40 (`car-ford-gt40.glb`)
- `ParkedCar` component: loads any GLB, auto-scales to a target real-world height, grounds the model (bottom face at y=0), adds a faint contact-shadow plane, sets `envMapIntensity`/shadows
- Bay marking positions updated from 4 scattered bays to 2 rear bays at (−3.5, −15) and (3.5, −15)
- Both GLBs preloaded at module level via `useGLTF.preload`

**3D floating damage annotations (stage 3)**
- 4 callout cards anchored to world-space positions on the parked car via drei `<Html>`
- Sequential reveal: one card at a time using Framer Motion `useMotionValue` driven by `useFrame` — no React re-renders during animation
- Each card: 220 ms fade-in + hold + 220 ms fade-out (950 ms total); total stage = 3.8 s
- Cards colour-coded by severity (HIGH = red, MED = amber, LOW = blue)

**Auto-sequence timeline**

| Segment | Duration | p range |
|---------|----------|---------|
| Zoom-in | 1.8 s | 0.45 → 0.62 |
| AI Scan | 1.2 s | 0.62 → 0.77 |
| Damage callouts (4 × 950 ms) | 3.8 s | 0.77 → 0.93 |
| Inspection complete | 1.0 s | 0.93 → 1.00 |

**Garage environment**
- Full 3D inspection garage: structural columns, walls, floor, LED screen, tool cabinet, EV charger, monitor, gate posts
- Off-white neon rings on car platform (emissiveIntensity tuned to avoid overpowering car colour)
- LED screen neon frame widened (10.8 m housing) so content doesn't overflow bezels
- Z-fighting eliminated: all geometry lifted ≥ 0.005 m off y = 0

**Loading / black-screen fixes**
- Two-phase App loading: content mounts behind the still-visible loading screen (`fakeProgressDone` only), letting WebGL init + shader compilation + GLB parsing happen in parallel with the fake progress bar
- `SceneReadySignal` R3F component fires `onReady` on the very first rendered frame inside the car `<Suspense>` — loading screen exits only when both fake progress AND scene signal have fired
- Split `<Suspense>` boundaries: `GarageEnvironment` (pure geometry) renders immediately; `HeroVehicle` + `Environment preset` wait in their own inner boundary — garage is visible while the car GLB streams
- `onCreated: ({ gl }) => gl.setClearColor('#0e1012')` matches WebGL clear colour to the page background from frame 1, eliminating any black flash before geometry renders
- Scene-ready overlay (`zIndex: 15`, same colour as loading screen) fades out over 0.7 s once `SceneReadySignal` fires — prevents any visible gap between loading screen exit and scene render
- Always-mounted Canvas: fixed div toggles `visibility`/`pointerEvents` instead of conditional mount — WebGL context and compiled shaders survive across hero show/hide cycles, eliminating black screen on scroll-back to hero

**Scroll / camera behaviour**
- Hero section height: **200 vh** — car entrance mapped to full scroll range (0→0.45 over 0→90% of scroll), auto-sequence + page lock handle the rest
- Camera lerp speeds: fast during zoom-in (0.08), fast on exit (0.09), slow elsewhere (0.038)
- `ScrollStory` `paddingTop` reduced from 30 vh → 8 vh; added `id="chapter-01"` anchor
- `watchDemo` scroll target updated to 0.92× hero height so the full car entrance plays

**Bug fixes**
- Fixed sequence restart on scroll-back: kept `running = true` after natural completion instead of resetting it
- Fixed blank space gap after hero: changed `isInView` condition so canvas stays visible through the full hero spacer
- Fixed full-page click/upload blocker: `pointer-events: none` does NOT cascade in HTML — added it explicitly to `GridBackground` inner divs and the R3F `<Canvas>` element
- `StoryScene` `useInView` threshold lowered from 0.2 → 0.05 so reveals trigger as soon as the section enters the viewport
- Fixed Paint Damage callout card clipping: world-space Y lowered from 2.65 → 1.45 so the card renders in the upper-mid screen region

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
