import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from fastapi import HTTPException
import os

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