FROM python:3.11-slim


# Set working directory
WORKDIR /app

# Install pipenv
RUN pip install pipenv

# Copy Pipfile and Pipfile.lock
COPY Pipfile Pipfile.lock ./

# Install dependencies globally (system-wide) to avoid virtualenv creation
RUN pipenv install --system --deploy

# Copy all files
COPY . .

# Expose the application port
EXPOSE 8000

# Run the application
CMD ["fastapi", "run", "app.py", "--port", "8000"]
