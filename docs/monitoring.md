# Monitoring

This document explains how the running application is observed, what is in place, what is not, and how to close each gap. It supports the capstone requirement for application health checks, application logs, and basic server and container health monitoring.

## Status at a glance

| Capability | Status | Where |
|---|---|---|
| Application health endpoint | In place | `/health`, through Nginx at `/api/health` |
| Database health endpoint | In place | `/health/db`, through Nginx at `/api/health/db` |
| Container health checks | In place | Compose `healthcheck` on all four services |
| Health checks during deployment | In place | `cd.yml` checks both public endpoints after deploy |
| Application and container logs | In place, on the host | `docker compose logs`, rotated at 10 MB x 3 per service |
| Host health probe script | In place, must be scheduled | `scripts/healthcheck.sh` |
| Scheduled probing with alerting | **Not in place** | Requires host scheduling and an alert channel |
| Centralized log collection | **Not in place** | Requires AWS setup (see below) |
| Server metrics (CPU, memory, disk) | **Not in place** | Requires AWS setup (see below) |
| Uptime monitoring from outside AWS | **Not in place** | Requires an external monitor |

## What "partial" means

Partial means the application can report its own health and the deployment checks it once, but nothing watches it continuously and tells someone when it breaks.

- **Health endpoints** answer a question at the moment someone asks it. They do not ask on their own schedule.
- **Container health checks** let Docker mark a container as unhealthy. Nothing acts on that mark, and the container is not restarted by the health check itself. The `restart: unless-stopped` policy restarts a container only when it exits.
- **Deployment checks** run once, at deploy time. They say nothing about the next hour.
- **Logs** stay on the EC2 host. If the host fails, its logs go with it, and nobody is notified.

So a crash on a Tuesday night is discovered when a user reports it.

## What is in place now

### Health endpoints

| Endpoint | Meaning | Passes when |
|---|---|---|
| `GET /api/health` | The Flask process answers | The backend responds with `{"status": "ok"}` |
| `GET /api/health/db` | The backend can run `SELECT 1` on PostgreSQL | Returns `{"status": "ok", "database": "connected"}` |

Both endpoints return no secrets, credentials, or internal configuration.

### Container health checks

Each Compose service has a health check, and Docker records the result as `healthy`, `unhealthy`, or `starting`:

```bash
docker compose ps
docker inspect --format '{{.State.Health.Status}}' expense-backend
```

### Logs

```bash
docker compose logs -f backend
docker compose logs --since 1h nginx
```

Every service writes JSON logs with rotation (`max-size` 10 MB, `max-file` 3). Logs cannot grow without limit or fill the disk.

### Host probe script

`scripts/healthcheck.sh` checks both public endpoints and the Docker health state of the four containers. It prints one line per check and exits with `1` if any check fails.

Run it on the EC2 host:

```bash
cd ~/expense-management-platform
APP_URL=https://expense-tracker.live sh scripts/healthcheck.sh
echo "exit code: $?"
```

Schedule it with cron, and record the result somewhere a person will see it:

```bash
*/5 * * * * cd /home/ubuntu/expense-management-platform && APP_URL=https://expense-tracker.live sh scripts/healthcheck.sh >> /home/ubuntu/healthcheck.log 2>&1 || logger -t expense-healthcheck "healthcheck failed"
```

Adjust the path and user to match the host. On its own, this writes to a log file. It becomes alerting only when something watches for failures: an email from the host's mail service, a message from a chat webhook, or the CloudWatch options below.

The script must be executable only if run directly. Use `sh scripts/healthcheck.sh` as shown, which does not require the executable bit.

## Gaps and how to close them

### 1. Continuous external uptime monitoring (highest priority)

A check run from inside the host cannot detect that the host itself is down, or that DNS, Cloudflare, or the certificate has failed.

**How to close it:** add an external HTTP monitor (a free uptime service, or a CloudWatch Synthetics canary) that requests `https://<your domain>/api/health` every 1 to 5 minutes and alerts on failure. Point it at the public URL, not at localhost.

### 2. Alerting

Probes that nobody reads are not alerts.

**How to close it:** choose one alert channel, such as an email address or a chat webhook, and connect it to the external monitor from gap 1 and to the cron job above. Record who receives the alerts.

### 3. Centralized log collection

Logs live only on the EC2 host and rotate away.

**How to close it:** install the Amazon CloudWatch agent on the instance, configured to send the Docker container logs (`/var/lib/docker/containers/*/*-json.log`) to a CloudWatch log group. This needs an instance IAM role with `logs:CreateLogStream`, `logs:PutLogEvents`, and `logs:DescribeLogStreams` only. See [AWS IAM](aws-iam.md).

### 4. Server metrics

CPU, memory, and disk use are not recorded, so a full disk or a memory leak appears only as an outage.

**How to close it:** install the CloudWatch agent with the memory and disk metrics enabled, and create alarms for disk above 80 percent and memory above 85 percent. Add a CPU alarm if the instance is sized tightly.

### 5. Container metrics

The host metrics do not show per-container behavior.

**How to close it:** optional. Container restart counts are visible with `docker ps` and `docker inspect`. Add a CloudWatch alarm on the status-check metrics of the EC2 instance, which catches an unreachable host.

## Verifying monitoring works

Monitoring is not proven until a failure is detected. Test it on the staging or deployed host:

1. Stop the backend: `docker compose stop backend`. Confirm the probe reports `FAIL` and the external monitor alerts within its interval.
2. Start it again: `docker compose start backend`. Confirm the alert clears.
3. Fill a test disk or set a low alarm threshold, and confirm the disk alarm fires.

Record the date, the test, and the observed alert in the QA release evidence. Until this is done, describe monitoring as configured but not verified.

## Scope

This document describes what the repository provides and what the AWS environment must add. It does not claim that any alert channel, external monitor, or CloudWatch configuration exists in production. Those must be configured and tested on AWS, then recorded as runtime evidence.
