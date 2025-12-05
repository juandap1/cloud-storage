FROM python:3.11-slim


# Set working directory
WORKDIR /app

# Install pipenv
RUN pip install pipenv

# Copy Pipfile and Pipfile.lock
COPY Pipfile Pipfile.lock ./

# Install dependencies globally (system-wide) to avoid virtualenv creation
RUN pipenv install --system

# Copy all files
COPY ./app ./app

# Expose the application port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
