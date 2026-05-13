FROM python:3.10-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

# Install system dependencies + Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# =========================
# Backend dependencies
# =========================

COPY backend/requirements.txt ./backend/requirements.txt

RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r ./backend/requirements.txt

# =========================
# Frontend build
# =========================

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ ./

RUN npm run build

# =========================
# Backend source
# =========================

WORKDIR /app

COPY backend ./backend

# Copy frontend build into backend static folder
RUN mkdir -p ./backend/static \
    && cp -r ./frontend/dist/* ./backend/static/

# =========================
# Run FastAPI
# =========================

WORKDIR /app/backend

EXPOSE 10000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}"]