from fastapi import FastAPI
from app.s3_client import create_bucket

app = FastAPI()

@app.on_event("startup")
def startup():
    create_bucket("bran-bucket")
    

@app.get("/")
def health_check():
    return {"Hello": "World"}
