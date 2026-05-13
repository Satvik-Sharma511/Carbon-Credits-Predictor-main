FROM python:3.10-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1

# Install system deps + Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install backend deps
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Build frontend
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install

COPY frontend ./frontend
RUN npm run build

# Copy backend
WORKDIR /app
COPY backend ./backend

# Copy frontend dist into backend static folder
RUN mkdir -p ./backend/static && cp -r ./frontend/dist/* ./backend/static/

WORKDIR /app/backend

EXPOSE 10000

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}