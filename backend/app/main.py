from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
from app.s3_client import create_bucket, upload_file, list_objects, get_object
from typing import Optional

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

@app.get("/list-objects")
def list_s3_objects(prefix: Optional[str] = None):
    return list_objects(prefix)


#http://localhost:8000/object/pics/guy_cartoon.png
@app.get("/object/{s3_key:path}")
async def retrieve_object(s3_key: str):
    file = get_object(s3_key)
    content_type = file.get('ContentType', 'application/octet-stream')
    object_body = file.get('Body')
    def file_iterator():
        """Yields chunks of the file stream."""
        try:
            # Stream the file in chunks
            for chunk in iter(lambda: object_body.read(8192), b''):
                yield chunk
        finally:
            # Ensure the stream is closed
            object_body.close()
    return StreamingResponse(file_iterator(), media_type=content_type)