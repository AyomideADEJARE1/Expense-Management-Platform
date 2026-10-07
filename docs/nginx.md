# Nginx Documentation

This document describes the project's Nginx reverse-proxy configuration and how it connects the frontend and backend services in the Docker Compose environment.

Nginx serves as the application's single entry point:

```text
Browser
   |
   v
Nginx :8080
   |
   +----------------------+
   |                      |
   v                      v
Frontend :80          Backend :5000
                           |
                           v
                      PostgreSQL
```

The host connects to Nginx on port `8080`. Nginx then routes requests to the appropriate Docker Compose service.

---

## 1. Nginx Files

The Nginx configuration consists of:

```text
nginx/
├── Dockerfile
└── default.conf
```

### Dockerfile

The Dockerfile uses the official Alpine-based Nginx image:

```dockerfile
FROM nginx:alpine
COPY default.conf /etc/nginx/conf.d/default.conf
```

The project-specific configuration replaces the default Nginx server configuration inside the container.

### Configuration

The main Nginx configuration is:

```text
nginx/default.conf
```

---

## 2. Nginx Container

Nginx is built by Docker Compose from:

```text
./nginx
```

The resulting container is:

```text
expense-nginx
```

The container listens on:

```text
80
```

Docker Compose maps the container port to the host as:

```text
8080:80
```

Therefore, users access the application through:

```text
http://localhost:8080
```

Nginx is the only application service whose port is published to the host in the current Docker Compose configuration.

---

## 3. Upstream Services

The configuration defines two Nginx upstreams.

### Frontend

```nginx
upstream frontend {
    server frontend:80;
}
```

The upstream named `frontend` points to the Docker Compose service:

```text
frontend:80
```

### Backend

```nginx
upstream backend {
    server backend:5000;
}
```

The upstream named `backend` points to:

```text
backend:5000
```

Docker Compose service-name DNS allows Nginx to resolve these container names within the Docker network.

---

## 4. Server Configuration

The Nginx server listens on:

```nginx
listen 80;
```

The server name is:

```nginx
server_name _;
```

The underscore acts as a catch-all server name for requests reaching this Nginx instance.

---

## 5. API Health Route

The configuration contains a dedicated health-check route:

```nginx
location = /api/health {
    proxy_pass http://backend/health;
    ...
}
```

The exact-match location means:

```text
/api/health
```

is forwarded to the backend's:

```text
/health
```

The request flow is:

```text
Browser
   |
   | GET /api/health
   v
Nginx
   |
   | proxy_pass
   v
Backend
   |
   | GET /health
   v
{"status":"ok"}
```

This route is also used by the Nginx Docker health check.

Test it from the host with:

```bash
curl http://localhost:8080/api/health
```

Expected response:

```json
{
  "status": "ok"
}
```

---

## 6. API Routing

All other requests beginning with `/api/` are routed to the Flask backend:

```nginx
location /api/ {
    proxy_pass http://backend;
    ...
}
```

Examples include:

```text
/api/auth/register
/api/auth/login
/api/auth/me
/api/expenses
/api/categories
/api/budgets
/api/summaries
```

The general request flow is:

```text
Browser
   |
   | /api/*
   v
Nginx
   |
   v
backend:5000
   |
   v
Flask API
```

The backend remains inaccessible directly from the host because its port is not published by Docker Compose.

---

## 7. Frontend Routing

Requests that do not match the `/api/` routes are sent to the frontend:

```nginx
location / {
    proxy_pass http://frontend;
    ...
}
```

This includes normal browser requests such as:

```text
/
```

The request flow is:

```text
Browser
   |
   | /
   v
Nginx
   |
   v
frontend:80
   |
   v
React application
```

This makes Nginx the common entry point for both the frontend and backend.

---

## 8. Proxy Headers

The API routes pass the following headers to the backend:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

These provide the backend with information about the original request.

### `Host`

```text
Host
```

Preserves the original host value.

### `X-Real-IP`

```text
X-Real-IP
```

Passes the originating client IP address seen by Nginx.

### `X-Forwarded-For`

```text
X-Forwarded-For
```

Maintains the forwarding chain of client IP addresses.

### `X-Forwarded-Proto`

```text
X-Forwarded-Proto
```

Indicates the original request protocol, such as HTTP or HTTPS.

These headers are particularly useful when the application is deployed behind a reverse proxy or load balancer.

---

## 9. Request Routing Summary

The current routing rules can be summarized as:

| Request | Destination |
|---|---|
| `/api/health` | `backend:5000/health` |
| `/api/*` | `backend:5000` |
| Everything else | `frontend:80` |

In simplified form:

```text
                    Nginx
                      |
          +-----------+-----------+
          |                       |
       /api/*                    /*
          |                       |
          v                       v
   Flask Backend              React Frontend
   backend:5000               frontend:80
```

---

## 10. Docker Networking

Nginx communicates with the other services using Docker Compose service names.

```text
nginx → frontend:80
nginx → backend:5000
```

It does not use:

```text
localhost:80
localhost:5000
```

for these upstream connections.

Inside a Docker container, `localhost` refers to that same container. Docker Compose service names are therefore required for communication between separate containers.

---

## 11. Nginx Health Check

The Docker Compose configuration checks Nginx using:

```text
http://127.0.0.1/api/health
```

The health-check command is equivalent to:

```bash
wget --spider -q http://127.0.0.1/api/health
```

This verifies that Nginx can serve the health endpoint successfully.

Because `/api/health` is proxied to the backend, the check also provides a useful indication that Nginx can reach the backend service.

---

## 12. Nginx and Docker Compose Dependencies

Nginx depends on both the frontend and backend services being healthy.

The Compose configuration uses:

```yaml
depends_on:
  frontend:
    condition: service_healthy
  backend:
    condition: service_healthy
```

This means the Nginx container waits for the required application services to report healthy before normal startup proceeds.

The complete dependency relationship is:

```text
PostgreSQL
    |
    v
 Backend
    |
    +----------------+
                     |
Frontend             |
    |                |
    +-------> Nginx <+
                 |
                 v
              Browser
```

---

## 13. Testing Nginx Locally

Start the complete application:

```bash
docker compose up -d --build
```

Check container status:

```bash
docker compose ps
```

The Nginx container should report healthy.

Test the frontend:

```bash
curl -I http://localhost:8080
```

Test the API health endpoint:

```bash
curl http://localhost:8080/api/health
```

Test the backend through the reverse proxy:

```bash
curl -i http://localhost:8080/api/auth/me
```

The last request should return an authentication-related response when no JWT is supplied rather than a direct connection failure.

---

## 14. Inspecting Nginx Logs

View Nginx logs:

```bash
docker compose logs nginx
```

Follow logs in real time:

```bash
docker compose logs -f nginx
```

Or access the container directly:

```bash
docker exec -it expense-nginx /bin/sh
```

---

## 15. Troubleshooting

### Nginx is unhealthy

Check:

```bash
docker compose ps
```

Then inspect:

```bash
docker compose logs nginx
```

Also test:

```bash
curl http://localhost:8080/api/health
```

### Frontend does not load

Check:

```bash
docker compose logs frontend
```

Then verify that the frontend container is healthy:

```bash
docker compose ps frontend
```

Also verify that Nginx can resolve:

```text
frontend:80
```

### API requests fail

Check:

```bash
docker compose logs backend
```

and:

```bash
docker compose logs nginx
```

Verify that the backend is healthy:

```bash
docker compose ps backend
```

Then test:

```bash
curl http://localhost:8080/api/health
```

### Port 8080 is unavailable

Check which process is using the port:

```bash
sudo ss -ltnp | grep :8080
```

Alternatively, change the host-side port mapping in Docker Compose while keeping the container port at `80`.

For example:

```yaml
ports:
  - "8081:80"
```

The application would then be accessed through:

```text
http://localhost:8081
```

---

## 16. Nginx Security Considerations

The current Nginx configuration is designed for the project's local Docker environment.

Important characteristics include:

- Nginx is the only host-published application service.
- The backend is not directly exposed to the host.
- PostgreSQL is not directly exposed to the host.
- API requests pass through a single reverse-proxy entry point.
- Forwarding headers are supplied to the backend.
- Production HTTPS and certificate management are not configured in the current local configuration.

For production deployment, additional controls should be considered, including:

- HTTPS/TLS termination.
- Secure certificate management.
- Production security headers where appropriate.
- Restricted administrative access.
- Rate limiting at the appropriate layer.
- Production-specific proxy and timeout settings.
- Monitoring and centralized logging.

These production controls should be configured and verified separately rather than assumed to exist in the current local setup.

---

## 17. Current Architecture

The implemented local request path is:

```text
                         Host
                          |
                    localhost:8080
                          |
                          v
                    +-----------+
                    |   Nginx   |
                    +-----------+
                     /         \
                    /           \
              /api/*             /*
                 |                 |
                 v                 v
          +-------------+   +-------------+
          | Flask API   |   | React App   |
          | backend:5000|   | frontend:80 |
          +-------------+   +-------------+
                 |
                 v
          +-------------+
          | PostgreSQL  |
          | postgres:5432|
          +-------------+
```

This is the current Docker Compose application path.

---

## 18. Related Documentation

- [Docker](docker.md)
- [Architecture](architecture.md)
- [CI/CD](ci-cd.md)
- [Security](security.md)
- [Database](../database/README.md)
- [Backend](../backend/README.md)
