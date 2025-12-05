from fastapi import FastAPI, UploadFile, File
from app.s3_client import create_bucket, upload_file

app = FastAPI()

@app.on_event("startup")
def startup():
    create_bucket("bran-bucket")
    

@app.get("/")
def health_check():
    return {"Hello": "World"}

@app.post("/upload")
def upload_to_s3(file: UploadFile = File(...)):
    upload_file(file, "bran-bucket")
    return {"message": "File uploaded successfully"}
