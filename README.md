# ◈ Dent Vision AI

An AI-powered vehicle damage detection platform that classifies front and rear car damage from images in under a second. Built with a cinematic React frontend and a FastAPI + PyTorch backend.

---

## Live Demo

| Service | URL |
|---------|-----|
| Frontend | Deployed on Vercel |
| Backend API | Deployed on Hugging Face Spaces |

---

## Project Structure

```
dentvision_AI/
├── frontend/          → React app (Vercel)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   └── hooks/
│   ├── package.json
│   └── vite.config.js
│
├── backend/           → FastAPI server (Hugging Face Spaces)
│   ├── dentvision-ai/
│   │   ├── server.py
│   │   ├── model_helper.py
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── model/
│   │       └── saved_model_tuned.pth
│
└── README.md
```

---

## What It Does

1. User uploads a vehicle image (front or rear)
2. Image is sent to the FastAPI backend
3. ResNet50 model classifies the damage
4. Results returned with confidence scores for all 6 classes
5. Frontend displays animated results with probability bars

---

## Damage Classes

| Class | Zone | Meaning |
|-------|------|---------|
| F_Normal | Front | No damage |
| F_Breakage | Front | Panel broken |
| F_Crushed | Front | Structural crush |
| R_Normal | Rear | No damage |
| R_Breakage | Rear | Panel broken |
| R_Crushed | Rear | Structural crush |

---

## Model Journey

| Step | Approach | Accuracy |
|------|----------|----------|
| 1 | Custom CNN from scratch | 57% |
| 2 | Transfer Learning — ResNet50 | 78% |
| 3 | Hyperparameter Tuning — Optuna | 80% |

- Trained on **2300 real car images** collected manually
- Fine-tuned ResNet50 with frozen backbone, unfrozen layer4
- Optimized with Optuna for dropout rate and learning rate

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| 3D | React Three Fiber + Drei + Three.js |
| Animations | Framer Motion + GSAP |
| Backend | FastAPI |
| ML Model | PyTorch ResNet50 |
| Frontend Deploy | Vercel |
| Backend Deploy | Hugging Face Spaces |

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

## Data Flow

```
User uploads image
       ↓
React Frontend (Vercel)
       ↓
POST /predict — multipart/form-data
       ↓
FastAPI (Hugging Face Spaces)
       ↓
ResNet50 inference (80% accuracy)
       ↓
{ class, confidence, all_scores }
       ↓
Frontend renders animated results
```

---

## Author

Built by **Sam** — [LinkedIn](https://www.linkedin.com/in/sam)

© 2026 Dent Vision AI — All Rights Reserved
