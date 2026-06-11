# ◈ Dent Vision AI — Backend

FastAPI backend serving a fine-tuned ResNet50 model for vehicle damage classification. Deployed on Hugging Face Spaces with Docker.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| FastAPI | API framework |
| Uvicorn | ASGI server |
| PyTorch | Deep learning |
| Torchvision | Model and transforms |
| Pillow | Image processing |
| Optuna | Hyperparameter tuning |
| Docker | Containerization |
| Hugging Face Spaces | Deployment |

---

## Getting Started

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload
```

Server runs on `http://localhost:8000`

---

## Folder Structure

```
backend/
├── server.py           # FastAPI routes
├── model_helper.py     # Model loading and inference
├── requirements.txt    # Python dependencies
├── Dockerfile          # Container config for HF Spaces
└── model/
    └── saved_model_tuned.pth   # Trained ResNet50 weights
```

---

## API

### POST /predict

Accepts a vehicle image and returns damage classification.

**Request:**
```
Content-Type: multipart/form-data
Body: file=<image file>
```

**Response:**
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

**Damage Classes:**

| Class | Zone | Meaning |
|-------|------|---------|
| F_Normal | Front | No damage |
| F_Breakage | Front | Panel broken |
| F_Crushed | Front | Structural crush |
| R_Normal | Rear | No damage |
| R_Breakage | Rear | Panel broken |
| R_Crushed | Rear | Structural crush |

---

## Model

### Dataset
- **2300 real car images** collected and labelled manually
- 6 damage classes across front and rear views
- First custom dataset built from scratch

### Architecture
Fine-tuned ResNet50 pretrained on ImageNet.

```python
class carClassifierResnet(nn.Module):
    def __init__(self, num_classes=6, dropout_rate=0.5):
        super().__init__()
        self.network = models.resnet50(weights="DEFAULT")

        # freeze all layers
        for param in self.network.parameters():
            param.requires_grad = False

        # unfreeze layer4 only
        for param in self.network.layer4.parameters():
            param.requires_grad = True

        # custom classification head
        in_features = self.network.fc.in_features
        self.network.fc = nn.Sequential(
            nn.Dropout(dropout_rate),
            nn.Linear(in_features, num_classes)
        )
```

### Training Journey

| Step | Approach | Accuracy |
|------|----------|----------|
| 1 | Custom CNN from scratch | 57% |
| 2 | Transfer Learning — ResNet50 | 78% |
| 3 | Hyperparameter Tuning — Optuna | 80% |

**Step 1 — Custom CNN**
Built a 3-layer CNN from scratch. Limited by dataset size, achieved 57% accuracy.

**Step 2 — Transfer Learning**
Switched to ResNet50 pretrained on ImageNet. Froze all layers except layer4. Accuracy jumped to 78%.

**Step 3 — Optuna Tuning**
Used Optuna to search optimal dropout rate and learning rate. Final accuracy: **80%**.

### Preprocessing

```python
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])
```

### Inference

```python
output = trained_model(image_tensor)
probs = F.softmax(output, dim=1).squeeze()
predicted_idx = torch.argmax(probs).item()
```

---

## Requirements

```
fastapi==0.116.1
uvicorn==0.35.0
python-multipart==0.0.20
pillow==11.3.0
torch==2.12.0
torchvision==0.27.0
```

---

## Docker

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 7860
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "7860"]
```

---

## Deploy to Hugging Face Spaces

1. Create a new Space on huggingface.co
2. Set SDK to **Docker**
3. Clone the Space repo
4. Copy all backend files into it
5. Track model with Git LFS:
```bash
git lfs install
git lfs track "*.pth"
git add .gitattributes
git add model/saved_model_tuned.pth
git commit -m "add model via lfs"
git push
```

---

## CORS

Update allowed origins in `server.py` before production:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Author

Built by **Sam** — [LinkedIn](https://www.linkedin.com/in/sam)

© 2026 Dent Vision AI
