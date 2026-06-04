from fastapi import FastAPI, File, UploadFile
from model_helper import predict as model_predict

app = FastAPI()

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        image_path = "image.jpg"
        with open(image_path, "wb") as f:
            f.write(image_bytes)
        prediction = model_predict(image_path)
        return prediction
    except Exception as e:
        return {"error": str(e)}