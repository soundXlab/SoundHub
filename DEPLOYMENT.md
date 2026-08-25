# SoundHub Deployment Guide

This guide explains how to deploy SoundHub to Google Cloud Platform using Cloud Run and Google Cloud Storage.

## Prerequisites

1. Google Cloud SDK installed and authenticated
2. A Google Cloud project created
3. Billing enabled for the project
4. Cloud Run, Cloud Build, and Cloud Storage APIs enabled

## Deployment Steps

### 1. Set up your Google Cloud project

```bash
# Set your project ID
PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable required services
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2. Create a Google Cloud Storage bucket for assets

```bash
gsutil mb gs://soundhub-assets-$PROJECT_ID
```

### 3. Create a secret for the backend secret key

```bash
# Generate a secret key (you can use any secure random string)
SECRET_KEY=$(openssl rand -base64 48)

# Store it in Secret Manager
echo -n "$SECRET_KEY" | gcloud secrets create soundhub-secret-key --data-file=-
```

### 4. Deploy using Cloud Build

```bash
gcloud builds submit --config cloudbuild.yaml
```

### 5. Verify deployment

After deployment completes, you should see output similar to:

```
Available at: https://soundhub-REGION-PROJECT_ID.uc.r.appspot.com
```

Visit the URL to access your SoundHub instance.

## Environment Variables

The following environment variables are configured during deployment:

- `SOUNDHUB_STORAGE_PROVIDER=gcs` - Use Google Cloud Storage for asset storage
- `SOUNDHUB_GCS_BUCKET=soundhub-assets-$PROJECT_ID` - GCS bucket for assets
- `SOUNDHUB_ENV=production` - Set environment to production
- `SOUNDHUB_SECRET_KEY` - Secret key for encryption (from Secret Manager)
- `SOUNDHUB_CORS_ORIGINS=*` - Allow all origins (adjust as needed for security)

## Architecture

This deployment uses a unified approach where:
- Backend API serves as the primary service
- Frontend static files are served by the backend at the root path
- Both frontend and backend run in the same Cloud Run service
- Assets are stored in Google Cloud Storage
- Database uses Cloud SQL (configured via SOUNDHUB_DATABASE_URL environment variable if needed)

## Customization

To customize the deployment:

1. Modify `backend/Dockerfile` to change the base image or add dependencies
2. Update `cloudbuild.yaml` to change the deployment region or service name
3. Adjust environment variables in the Cloud Run deployment step as needed

## Updating the Deployment

To deploy a new version:

```bash
gcloud builds submit --config cloudbuild.yaml
```

Cloud Build will rebuild the container image and deploy it to Cloud Run.