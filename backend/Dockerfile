# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

# Set working directory for frontend
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source code
COPY frontend/tsconfig.json .
COPY frontend/vite.config.ts .
COPY frontend/index.html .
COPY frontend/public ./public
COPY frontend/src ./src

# Build frontend for production
RUN npm run build

# Stage 2: Build backend with frontend static files
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/frontend/dist ./app/static

# Create necessary directories for data
RUN mkdir -p data/blobs data/tmp

# Expose port (will be overridden by PORT env var in Cloud Run)
EXPOSE 8000

# Use PORT environment variable if set (for Cloud Run), otherwise default to 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "${PORT:-8000}"]