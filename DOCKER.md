# Docker Deployment Guide

## Quick Start (Server Deployment)

### 1. Setup Override File
```bash
# Copy the override template
cp docker-compose.override.yml.example docker-compose.override.yml

# Edit with your server's IP
nano docker-compose.override.yml
```

Change this line:
```yaml
NEXT_PUBLIC_API_URL: http://YOUR_SERVER_IP:3002/api/v1
```

To your actual server IP, example:
```yaml
NEXT_PUBLIC_API_URL: http://192.168.20.73:3002/api/v1
```

### 2. Build & Run
```bash
# Build with override config
docker-compose up -d --build

# Check logs
docker-compose logs -f web
docker-compose logs -f api
```

### 3. Verify
- Web: http://YOUR_SERVER_IP:3000
- API: http://YOUR_SERVER_IP:3002/api/v1/health
- MinIO Console: http://YOUR_SERVER_IP:9005

## Troubleshooting

### ERR_CONNECTION_REFUSED on Register
**Problem:** Browser tries to connect to `localhost:3002` instead of server IP.

**Solution:** 
1. Make sure you created `docker-compose.override.yml` with correct IP
2. Rebuild: `docker-compose up -d --build`
3. Clear browser cache

### API Not Responding
```bash
# Check API logs
docker-compose logs api

# Check if API is running
docker-compose ps

# Restart API
docker-compose restart api
```

### Database Connection Issues
```bash
# Check postgres logs
docker-compose logs postgres

# Reset database (⚠️ deletes all data)
docker-compose down -v
docker-compose up -d
```

## Environment Variables

### Build-time (NEXT_PUBLIC_*)
These must be set in `docker-compose.override.yml` because Next.js bakes them into the build:
- `NEXT_PUBLIC_API_URL` - API endpoint (browser-side)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` - Midtrans client key
- `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` - Midtrans mode

### Runtime (API)
These are set in `docker-compose.yml` and can be changed without rebuild:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - JWT signing key
- `MINIO_*` - MinIO/S3 config
- `OLLAMA_*` - AI model config

## Production Checklist

- [ ] Change `JWT_SECRET` to random 32+ char string
- [ ] Set real Supabase credentials
- [ ] Configure domain/SSL (use nginx reverse proxy)
- [ ] Set `CORS_ORIGIN` to your domain
- [ ] Enable production mode: `NODE_ENV=production`
- [ ] Setup backup for postgres volume
- [ ] Configure monitoring (Sentry, etc)
- [ ] Set Midtrans production keys

## Commands

```bash
# Start all services
docker-compose up -d

# Rebuild after code changes
docker-compose up -d --build

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# View logs
docker-compose logs -f [service_name]

# Execute command in container
docker-compose exec api sh
docker-compose exec web sh

# Check service status
docker-compose ps
```
