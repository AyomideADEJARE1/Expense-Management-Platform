# Nginx

Nginx is the single public entry point. It serves the React application, routes `/api/*` requests to the Flask backend, and exposes the public health endpoints.

```text
Browser -> Nginx :80
            |-- /api/health     -> backend /health
            |-- /api/health/db  -> backend /health/db
            |-- /api/*          -> backend:5000
            |-- /*              -> frontend:80
```

## Files

```text
nginx/
├── Dockerfile      FROM nginx:alpine; copies default.conf into conf.d
└── default.conf    Upstreams and routing rules
```

## Ports

Compose publishes container port 80 on host port 80:

```text
http://localhost/
```

Only Nginx is published. The backend and PostgreSQL are reachable only inside the Compose network. To use a different host port, change the left-hand side of the mapping in `docker-compose.yml` (for example `"8081:80"`) and use that URL.

## Upstreams

```nginx
upstream frontend { server frontend:80; }
upstream backend  { server backend:5000; }
```

Compose service names resolve through Docker's internal DNS. `localhost` inside the Nginx container refers to Nginx itself, so it cannot be used for these upstreams.

## Routing rules

| Request | Destination | Note |
|---|---|---|
| `GET /api/health` | `backend:5000/health` | Exact match, rewritten to `/health` |
| `GET /api/health/db` | `backend:5000/health/db` | Exact match, rewritten to `/health/db` |
| `/api/*` | `backend:5000` | Path passed unchanged, so routes keep their `/api` prefix |
| everything else | `frontend:80` | Static React application |

The health routes are exact matches, so they are rewritten to the backend's `/health` paths. Without that rewrite, the database check would reach Flask as `/api/health/db`, which no backend route matches.

## Proxy headers

API requests forward these headers to the backend: `Host`, `X-Real-IP`, `X-Forwarded-For`, and `X-Forwarded-Proto`. The backend trusts exactly one proxy hop (`ProxyFix` with `x_for=1`, `x_proto=1`), so these headers are used only from this Nginx instance.

## Checks

```bash
curl -i http://localhost/api/health
curl -i http://localhost/api/health/db
curl -i http://localhost/api/auth/me      # expect 401 without a token
docker compose logs nginx
```

The Compose health check for Nginx calls `http://127.0.0.1/api/health`.

## Deployment notes

- The local configuration is HTTP only. On AWS, HTTPS is terminated by Cloudflare and Let's Encrypt/Certbot as described in [architecture](architecture.md). Those layers are configured outside this repository, so verify them on the live host.
- The CD workflow rebuilds the Nginx image from the deployed commit and runs `nginx -t` in CI before deployment.
- The health routes are verified in CI by checking that both `location` blocks exist. Run the curl checks above against the live host to prove they work.

## Troubleshooting

| Symptom | Check |
|---|---|
| `502 Bad Gateway` on `/api/*` | `docker compose ps backend` and `docker compose logs backend` |
| `/api/health/db` returns 404 | `nginx/default.conf` must contain the `location = /api/health/db` block |
| Frontend shows a blank page | `docker compose logs frontend`, and check that the build succeeded |
| Port 80 is in use | Change the host mapping in `docker-compose.yml` |
