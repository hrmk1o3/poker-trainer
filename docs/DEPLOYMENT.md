# Production Deployment Guide

## Prerequisites

- Server with Ubuntu 20.04+ or similar Linux distribution
- Docker and Docker Compose installed
- Domain name (optional, for HTTPS)
- SSL certificate (Let's Encrypt recommended)

## Quick Production Setup

### 1. Clone Repository
```bash
git clone https://github.com/hrmk1o3/poker-trainer.git
cd poker-trainer
```

### 2. Environment Configuration

**Backend** (`backend/.env`):
```bash
DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@postgres:5432/poker_trainer
SECRET_KEY=your-secret-key-here-use-openssl-rand-hex-32
DEBUG=False
ALLOWED_ORIGINS=https://yourdomain.com
```

**Frontend** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
```

### 3. Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: poker_trainer
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always
    networks:
      - poker-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/poker_trainer
      SECRET_KEY: ${SECRET_KEY}
      DEBUG: "False"
    depends_on:
      - postgres
    restart: always
    networks:
      - poker-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      NEXT_PUBLIC_API_URL: https://api.yourdomain.com
      NEXT_PUBLIC_WS_URL: wss://api.yourdomain.com
    depends_on:
      - backend
    restart: always
    networks:
      - poker-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: always
    networks:
      - poker-network

volumes:
  postgres_data:

networks:
  poker-network:
    driver: bridge
```

### 4. Production Dockerfiles

**Backend** (`backend/Dockerfile.prod`):
```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

**Frontend** (`frontend/Dockerfile.prod`):
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

### 5. Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourdomain.com api.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # Frontend
    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # Backend API
    server {
        listen 443 ssl http2;
        server_name api.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        location / {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket support
        location /ws/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_read_timeout 86400;
        }
    }
}
```

### 6. SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com

# Copy to ssl directory
mkdir ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
```

### 7. Deploy

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# View running containers
docker-compose -f docker-compose.prod.yml ps
```

## Monitoring

### Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/

# Frontend health
curl https://yourdomain.com/
```

### Logs

```bash
# All logs
docker-compose -f docker-compose.prod.yml logs

# Backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Frontend logs
docker-compose -f docker-compose.prod.yml logs frontend

# Database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

## Backup

### Database Backup

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres poker_trainer > backup.sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres poker_trainer < backup.sql
```

### Automated Backups

Add to crontab:
```bash
0 2 * * * cd /path/to/poker-trainer && docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres poker_trainer > backups/backup-$(date +\%Y\%m\%d).sql
```

## Scaling

### Horizontal Scaling

1. Use Redis for session storage
2. Configure load balancer
3. Run multiple backend instances
4. Use managed PostgreSQL (AWS RDS, etc.)

### Vertical Scaling

Adjust in `docker-compose.prod.yml`:
```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 4G
```

## Security Checklist

- [ ] Use strong passwords
- [ ] Enable SSL/TLS
- [ ] Set up firewall (UFW)
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Rate limiting
- [ ] DDoS protection (Cloudflare)
- [ ] Database access restrictions
- [ ] Environment variable security
- [ ] Container security scanning

## Maintenance

### Update Application

```bash
git pull origin main
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Migrations

```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend python -m alembic upgrade head
```

### Clean Up

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

## Troubleshooting

### Backend not starting
- Check environment variables
- Check database connection
- Check logs: `docker-compose logs backend`

### Frontend not loading
- Check API URL configuration
- Check network connectivity
- Check logs: `docker-compose logs frontend`

### Database connection issues
- Check PostgreSQL is running
- Check credentials
- Check network between containers

### WebSocket issues
- Check nginx WebSocket configuration
- Check firewall allows WebSocket traffic
- Check proxy timeout settings

## Support

For issues or questions, open an issue on GitHub.
