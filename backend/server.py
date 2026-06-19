import tempfile, os, json
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from model_helper import predict as model_predict
from report_helper import build_report_pdf
from mailer import send_report_email

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name
        prediction = model_predict(tmp_path)
        return prediction
    except Exception as e:
        return {"error": str(e)}
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


@app.post("/send-report")
async def send_report(files: list[UploadFile] = File(...), results: str = Form(...)):
    try:
        metas = json.loads(results)
        entries = [(await f.read(), metas[i]) for i, f in enumerate(files)]
        pdf = build_report_pdf(entries)
        await run_in_threadpool(send_report_email, pdf, "dentvision-report.pdf")
        return {"status": "sent", "count": len(entries)}
    except Exception as e:
        return {"error": str(e)}