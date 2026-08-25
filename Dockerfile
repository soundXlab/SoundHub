# Root Dockerfile — used by 'gcloud run deploy --source'
# Copies backend context and builds from backend/Dockerfile
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/tsconfig.json .
COPY frontend/vite.config.ts .
COPY frontend/index.html .
COPY frontend/public ./public
COPY frontend/src ./src
RUN npx vite build

FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
COPY --from=frontend-builder /app/frontend/dist ./app/static
RUN mkdir -p data/blobs data/tmp
EXPOSE 8000
CMD ["sh", "-c", "python scripts/seed_demo.py 2>/dev/null; exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
