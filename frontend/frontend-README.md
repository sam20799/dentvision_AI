# ◈ Dent Vision AI — Frontend

A premium, cinematic React frontend for AI-powered vehicle damage detection. Inspired by Tesla, Porsche, Apple product pages, and modern AI SaaS products.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility styling |
| Framer Motion | Animations and transitions |
| React Three Fiber | 3D rendering in React |
| Drei | R3F helpers |
| Three.js | Underlying 3D engine |
| GSAP | Scroll-triggered animations |

---

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Folder Structure

```
frontend/
├── src/
│   ├── App.jsx                  # Main app — all sections
│   ├── main.jsx                 # React entry point
│   ├── components/
│   │   ├── VehicleScene3D.jsx   # All 3D car scenes
│   │   ├── ScannerHUD.jsx       # Scanning overlay UI
│   │   └── ResultsPanel.jsx     # Prediction results
│   └── hooks/
│       └── useGSAP.js           # GSAP scroll hooks
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## Sections

### 1. Loading Screen
- Animated rotating rings
- Progress bar from 0 to 100
- Fades out once loaded

### 2. Navigation
- Fixed top bar
- Becomes opaque on scroll
- Analyze button scrolls to upload section

### 3. Hero Section
- Fullscreen with 3D rotating car
- Reflective floor
- Particle field background
- Animated headline and CTA buttons

### 4. Scroll Storytelling (5 Scenes)
- Scene 1 — Vehicle entry with floating 3D car
- Scene 2 — AI scan beam sweeping across car with data overlays
- Scene 3 — Classification feature cards
- Scene 4 — Fleet grid with 9 mini 3D cars
- Scene 5 — CTA to upload section

### 5. Upload Section
- Drag and drop image upload
- Animated scan line while processing
- Sends image to backend API
- Displays results with animated probability bars

### 6. Footer
- Dynamic copyright year
- LinkedIn link

---

## 3D System

All cars are procedural meshes — no external GLB files needed.

```
CarMesh
├── Chassis, cabin, hood, trunk (boxGeometry)
├── 4 Wheels (cylinder + torus)
├── Headlights (emissive blue)
├── Taillights (emissive red)
├── AI scan beam (cyan emissive plane)
└── Damage zone markers (red spheres)
```

**Scene types:**
- `HeroVehicleScene` — dramatic lighting, slow rotation
- `ScanVehicleScene` — scan beam + damage zones
- `MiniVehicleScene` — lightweight for fleet grid
- `ReflectiveFloor` — shared reflective floor

---

## Design System

**Fonts:**
| Font | Use |
|------|-----|
| Bebas Neue | Headlines |
| Rajdhani | Body and buttons |
| Share Tech Mono | Data labels |

**Colors:**
```css
--c-bg:    #020408   /* background */
--c-blue:  #3B8BEB   /* primary */
--c-cyan:  #00D4FF   /* accent / scan */
--c-gold:  #C8943A   /* warning */
```

**Damage colors:**
```
Normal   → cyan   #00D4FF
Breakage → amber  #FFB344
Crushed  → red    #FF4444
```

---

## API Integration

```jsx
const formData = new FormData()
formData.append("file", file)

const response = await fetch(
  "https://YOUR_HF_SPACE_URL/predict",
  { method: "POST", body: formData }
)

const data = await response.json()
// { class, confidence, all_scores }
```

Set your backend URL in `src/App.jsx` inside the `analyze` function.

If the backend is unreachable the app falls back to **demo mode** with randomized results and a warning banner.

---

## Production Build

```bash
npm run build
# output → dist/
```

Deploy the `dist/` folder to Vercel.

---

## Deploy to Vercel

1. Push to GitHub
2. Go to vercel.com → New Project
3. Connect your repo
4. Set:
```
Root Directory:   frontend
Build Command:    npm run build
Output Directory: dist
```
5. Deploy

---

## Author

Built by **Sam** — [LinkedIn](https://www.linkedin.com/in/sam)

© 2026 Dent Vision AI
