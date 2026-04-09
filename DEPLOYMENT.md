# Deployment Guide - Procus Copilot

This guide covers deploying the Procus Copilot to production environments.

---

## Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] `.env` file created with production credentials
- [ ] Database migrations run (`npm run setup:db`)
- [ ] Sample data ingested (`npm run ingest:data`)
- [ ] Git repository initialized and committed
- [ ] Twilio webhooks configured
- [ ] OpenAI API limits reviewed
- [ ] Supabase backups enabled
- [ ] Monitoring/alerting configured

---

## Option 1: Heroku Deployment (Recommended for Quick Start)

### Prerequisites

- Heroku CLI installed: `brew install heroku` (Mac) or `npm install -g heroku`
- Git repository initialized
- Heroku account created

### Step 1: Create Heroku App

```bash
# Login to Heroku
heroku login

# Create new app
heroku create procus-copilot-prod

# Or use existing app
heroku apps:info procus-copilot-prod
```

### Step 2: Configure Environment Variables

```bash
heroku config:set \
  NODE_ENV=production \
  OPENAI_API_KEY=sk-... \
  OPENAI_MODEL=gpt-4o \
  SUPABASE_URL=https://your-project.supabase.co \
  SUPABASE_ANON_KEY=... \
  SUPABASE_SERVICE_ROLE_KEY=... \
  TWILIO_ACCOUNT_SID=... \
  TWILIO_AUTH_TOKEN=... \
  TWILIO_WHATSAPP_NUMBER=whatsapp:+... \
  LOG_LEVEL=info

# Verify
heroku config
```

### Step 3: Deploy

```bash
# Deploy from main branch
git push heroku main

# Or deploy specific branch
git push heroku develop:main

# View deployment progress
heroku logs --tail
```

### Step 4: Verify Deployment

```bash
# Check if app is running
heroku ps

# Test health endpoint
curl https://procus-copilot-prod.herokuapp.com/health

# View logs
heroku logs --tail
```

### Step 5: Configure Twilio Webhook

1. Get your Heroku app URL:
```bash
heroku apps:info procus-copilot-prod
# Look for "Web URL"
```

2. In Twilio Console:
   - WhatsApp Sandbox Settings
   - Paste URL: `https://procus-copilot-prod.herokuapp.com/whatsapp`
   - Save

### Scaling on Heroku

```bash
# Scale dynos
heroku ps:scale web=2  # Use 2 dynos for high traffic

# Monitor performance
heroku logs:metrics

# Set up auto-scaling (requires Eco or higher tier)
```

---

## Option 2: AWS Lambda + API Gateway

### Prerequisites

- AWS Account with Lambda, API Gateway, RDS access
- AWS CLI installed: `npm install -g aws-cli`
- Serverless Framework: `npm install -g serverless`

### Step 1: Set Up Lambda Function

```bash
# Install serverless framework
npm install --save-dev serverless serverless-offline

# Create serverless config
touch serverless.yml
```

### Step 2: Configure serverless.yml

```yaml
service: procus-copilot

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    NODE_ENV: production
    OPENAI_API_KEY: ${ssm:/procus/openai_key}
    SUPABASE_URL: ${ssm:/procus/supabase_url}
    SUPABASE_ANON_KEY: ${ssm:/procus/supabase_key}
    TWILIO_ACCOUNT_SID: ${ssm:/procus/twilio_sid}
    TWILIO_AUTH_TOKEN: ${ssm:/procus/twilio_token}
    TWILIO_WHATSAPP_NUMBER: ${ssm:/procus/twilio_number}

functions:
  api:
    handler: src/server.handler
    events:
      - http:
          path: /whatsapp
          method: post
      - http:
          path: /health
          method: get
      - http:
          path: /analytics
          method: get

plugins:
  - serverless-offline
```

### Step 3: Deploy to Lambda

```bash
# Store credentials in AWS Systems Manager Parameter Store
aws ssm put-parameter --name /procus/openai_key --value "sk-..." --type SecureString

# Deploy
serverless deploy

# Get endpoint URL
serverless info
```

### Step 4: Update Twilio Webhook

```bash
# Update with Lambda endpoint
# https://your-api-gateway-url.execute-api.region.amazonaws.com/dev/whatsapp
```

---

## Option 3: Docker Containerization

### Prerequisites

- Docker installed
- Docker Hub account (for image registry)
- Container orchestration platform (Kubernetes, Docker Swarm, or similar)

### Step 1: Create Dockerfile

Already included in root directory. Build it:

```bash
docker build -t procus-copilot:1.0.0 .

# Tag for registry
docker tag procus-copilot:1.0.0 yourusername/procus-copilot:1.0.0

# Push to Docker Hub
docker login
docker push yourusername/procus-copilot:1.0.0
```

### Step 2: Run Container Locally (Test)

```bash
docker run \
  -p 3000:3000 \
  --env-file .env.production \
  yourusername/procus-copilot:1.0.0
```

### Step 3: Deploy to Kubernetes

Create `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: procus-copilot
spec:
  replicas: 3
  selector:
    matchLabels:
      app: procus-copilot
  template:
    metadata:
      labels:
        app: procus-copilot
    spec:
      containers:
      - name: procus-copilot
        image: yourusername/procus-copilot:1.0.0
        ports:
        - containerPort: 3000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: procus-secrets
              key: openai-key
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: procus-copilot-service
spec:
  type: LoadBalancer
  selector:
    app: procus-copilot
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```

Deploy:

```bash
# Create secrets
kubectl create secret generic procus-secrets \
  --from-literal=openai-key=sk-...

# Deploy
kubectl apply -f k8s-deployment.yaml

# Check status
kubectl get pods
kubectl get services
```

---

## Option 4: Google Cloud Run

### Prerequisites

- Google Cloud Account
- gcloud CLI installed

### Step 1: Build Container

```bash
docker build -t gcr.io/your-project/procus-copilot:1.0.0 .
```

### Step 2: Push to Container Registry

```bash
gcloud auth configure-docker
docker push gcr.io/your-project/procus-copilot:1.0.0
```

### Step 3: Deploy to Cloud Run

```bash
gcloud run deploy procus-copilot \
  --image gcr.io/your-project/procus-copilot:1.0.0 \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --timeout 60 \
  --set-env-vars OPENAI_API_KEY=sk-...,SUPABASE_URL=...
```

### Step 4: Get Service URL

```bash
gcloud run services describe procus-copilot --region us-central1
# Copy the URL and use in Twilio webhook
```

---

## Option 5: DigitalOcean App Platform

### Prerequisites

- DigitalOcean Account
- Git repository on GitHub/GitLab

### Step 1: Connect Repository

1. Go to DigitalOcean Dashboard
2. Create → App Platform
3. Connect GitHub repository
4. Select `procus-assistant` repo

### Step 2: Configure App

1. Set Environment variables
2. Configure resource limits (1GB RAM is sufficient)
3. Set health check to `/health`

### Step 3: Deploy

1. Click "Deploy"
2. Monitor build and deployment
3. Once live, note the app URL

### Step 4: Update Twilio

Update webhook URL with DigitalOcean app URL: `https://app-name.ondigitalocean.app/whatsapp`

---

## Monitoring & Logging

### Option 1: Cloud Logging (Recommended)

#### Using Sentry for Error Tracking

```bash
npm install --save @sentry/node

# Initialize in server.js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

#### Using Datadog

```bash
npm install --save dd-trace
```

### Option 2: Custom Logging

All deployments should send logs to:
- **Standard Out**: For container logs
- **Error File**: For persistent error tracking
- **Database**: For conversation history

```bash
# View logs in most platforms
heroku logs --tail           # Heroku
kubectl logs -f pod-name     # Kubernetes
docker logs container-id     # Docker
gcloud logging read          # Google Cloud
```

---

## Database Backups

### Supabase Automatic Backups

Already enabled in Supabase dashboard:
- Daily backups (free tier)
- Weekly backups (with retention)

### Manual Backup

```bash
# Export database
pg_dump postgresql://user:password@host/db > backup.sql

# Restore from backup
psql postgresql://user:password@host/db < backup.sql
```

---

## Scaling Considerations

### Horizontal Scaling

- **Heroku**: Increase dynos count
- **Kubernetes**: Increase replicas
- **Cloud Run**: Auto-scales automatically
- **Lambda**: Auto-scales automatically

### Vertical Scaling

- **Heroku**: Upgrade dyno tier
- **Kubernetes**: Increase CPU/Memory limits
- **Cloud Run**: Increase memory allocation
- **DigitalOcean**: Use larger App tier

### Database Scaling

```bash
# Supabase: Upgrade subscription plan
# Lambda: Consider read replicas for query optimization
# Both: Increase connection pool limits
```

---

## Performance Optimization

### API Response Times

Target: < 500ms for 95th percentile

1. Cache common queries (Redis)
2. Batch vector searches
3. Optimize database indexes
4. Use CDN for static assets

### Cost Optimization

1. **OpenAI**: Monitor token usage
2. **Supabase**: Optimize queries
3. **Twilio**: Monitor message volume
4. **Compute**: Right-size instances

---

## Troubleshooting Deployments

### Issue: Environment Variables Not Loading

```bash
# Verify variables are set
heroku config                # Heroku
kubectl get secrets          # Kubernetes
gcloud run services describe # Cloud Run

# Redeploy after updating
git push heroku main
```

### Issue: Database Connection Failure

```bash
# Check connection string
echo $SUPABASE_URL

# Test connection
psql -h your-host -U postgres -d postgres
```

### Issue: High Latency

1. Check API rate limits
2. Monitor database load
3. Add caching layer
4. Scale horizontally

### Issue: Resource Exhaustion

1. Check memory limits
2. Monitor database connections
3. Increase quotas
4. Optimize queries

---

## Rollback Procedures

### Heroku Rollback

```bash
# View releases
heroku releases

# Rollback to previous release
heroku rollback v42
```

### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/procus-copilot

# Rollback to previous version
kubectl rollout undo deployment/procus-copilot
```

---

## Post-Deployment Verification

- [ ] `/health` endpoint responds with all ✓
- [ ] Twilio webhook receives test messages
- [ ] Database queries work correctly
- [ ] OpenAI API calls succeed
- [ ] Error logging operational
- [ ] Metrics/monitoring working
- [ ] Backup system verified
- [ ] Team notified of deployment

---

## Scheduled Maintenance

- **Weekly**: Check error logs
- **Monthly**: Review API usage & costs
- **Quarterly**: Update dependencies
- **Yearly**: Database optimization & scaling assessment

---

**Last Updated**: April 2024
