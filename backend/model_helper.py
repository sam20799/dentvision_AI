from PIL import Image
from torchvision import transforms, models
import torch
import torch.nn as nn
import torch.nn.functional as F
from pathlib import Path
import os

trained_model = None
label_classes = ['F_Breakage', 'F_Crushed', 'F_Normal', 'R_Breakage', 'R_Crushed', 'R_Normal']
model_path = Path(__file__).parent/"model"/"saved_model_tuned.pth"

class carClassifierResnet(nn.Module):
    def __init__(self, num_classes=6, dropout_rate=0.5):
        super().__init__()
        self.network = models.resnet50(weights="DEFAULT")
        for param in self.network.parameters():
            param.requires_grad = False
        for param in self.network.layer4.parameters():
            param.requires_grad = True
        in_features = self.network.fc.in_features
        self.network.fc = nn.Sequential(
            nn.Dropout(dropout_rate),
            nn.Linear(in_features, num_classes)
        )

    def forward(self, x):
        return self.network(x)

def predict(image_path):
    image = Image.open(image_path).convert("RGB")
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    image_tensor = transform(image).unsqueeze(0)

    global trained_model
    if trained_model is None:
        trained_model = carClassifierResnet()
        print("Current working directory:", os.getcwd())
        trained_model.load_state_dict(torch.load(model_path))

    trained_model.eval()
    with torch.no_grad():
        output = trained_model(image_tensor)
        probs = F.softmax(output, dim=1).squeeze()
        predicted_idx = torch.argmax(probs).item()

    return {
        "class": label_classes[predicted_idx],
        "confidence": round(probs[predicted_idx].item(), 4),
        "all_scores": {label_classes[i]: round(probs[i].item(), 4) for i in range(6)}
    }