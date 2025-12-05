import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from fastapi import HTTPException
import os
from typing import Optional

access_key = os.getenv("MINIO_ROOT_USER")
secret_key = os.getenv("MINIO_ROOT_PASSWORD")
endpoint_url = os.getenv("MINIO_ENDPOINT")
s3 = boto3.client(
    "s3",
    endpoint_url=f"http://{endpoint_url}",
    aws_access_key_id=access_key,
    aws_secret_access_key=secret_key
)
        
    
def create_bucket(bucket_name):
    try:
        s3.head_bucket(Bucket=bucket_name)
    except ClientError:
        s3.create_bucket(Bucket=bucket_name)

def upload_file(file, bucket_name):
    try:
        content_type = file.content_type
        s3.put_object(
            Body=file.file,
            Bucket=bucket_name,
            Key=f"pics/{file.filename}",
            ContentType=content_type,
            Metadata={'original-name': file.filename}
        )
    except ClientError:
        raise HTTPException(status_code=500, detail="Failed to upload file")

def list_objects(prefix: Optional[str] = None):
    try:
        if prefix and not prefix.endswith('/'):
            prefix += '/'
        response = s3.list_objects_v2(Bucket="bran-bucket", Prefix=prefix or '', Delimiter='/')
        return response
    except ClientError:
        raise HTTPException(status_code=500, detail="Failed to list objects")

def get_object(s3_key: str):
    try:
        response = s3.get_object(Bucket="bran-bucket", Key=s3_key)
        return response
    except ClientError:
        raise HTTPException(status_code=500, detail="Failed to get object")
