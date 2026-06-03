# ◈ Dent Vision AI

A premium, cinematic AI-powered vehicle damage detection frontend.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS |
| 3D | React Three Fiber + Drei + Three.js |
| Animations | Framer Motion + GSAP |
| Fonts | Bebas Neue · Rajdhani · Share Tech Mono |

## Project Structure

```
dent-vision-ai/
├── src/
│   ├── App.jsx                    # Main application (full cinematic experience)
│   ├── main.jsx                   # React entry point
│   ├── index.css                  # Tailwind directives
│   ├── components/
│   │   ├── VehicleScene3D.jsx     # All Three.js car meshes & scenes
│   │   ├── ScannerHUD.jsx         # Animated scanning overlay HUD
│   │   └── ResultsPanel.jsx       # Prediction results display
│   └── hooks/
│       └── useGSAP.js             # GSAP scroll & animation hooks
├── public/
│   └── favicon.svg
├── index.html
├── vite.config.js                 # Vite + backend proxy config
├── tailwind.config.js
└── package.json
```

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open http://localhost:5173
```

## Backend Integration

The upload section POSTs to `/predict` (proxied to `http://localhost:8000` in dev).

**Request:**
```
POST /predict
Content-Type: multipart/form-data
Body: file=<image>
```

**Expected Response:**
```json
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

If the backend is unavailable, the app falls back to **demo mode** with randomized results and a clear warning banner.

## Damage Classes

| Class | Zone | Meaning |
|-------|------|---------|
| `F_Normal` | Front | No significant damage |
| `F_Breakage` | Front | Panel fractures / breakage |
| `F_Crushed` | Front | Major structural crush |
| `R_Normal` | Rear | No significant damage |
| `R_Breakage` | Rear | Panel fractures / breakage |
| `R_Crushed` | Rear | Major structural crush |

## Production Build

```bash
npm run build
# Output → dist/
```

The build automatically code-splits Three.js, Framer Motion, and GSAP into separate chunks for optimal load performance.

## Performance Notes

- 3D scenes use `<Suspense>` for lazy loading
- `MeshReflectorMaterial` resolution is tuned per scene (512px in story cards, 1024px in hero)
- Particle field and grid background are CSS/SVG — zero Three.js overhead
- GSAP ScrollTrigger is only initialized after component mount
