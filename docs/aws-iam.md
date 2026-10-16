# AWS IAM and Access Model

This document records the intended AWS access model for Expense Tracker, the permissions each identity needs, and what must be checked on the live account. It documents how the project addresses the capstone's appropriate cloud IAM permissions requirement (MAIN-027); the requirement must not be marked complete until the live account, role, and network settings have been verified.

Read this with [docs/monitoring.md](monitoring.md), [docs/ci-cd.md](ci-cd.md), and [docs/security.md](security.md).

## Key facts from the code

These facts come from the repository and set the scope of the IAM design:

- **The application does not call AWS APIs.** `backend/requirements.txt` contains no AWS SDK (no `boto3`). The Flask app, the frontend, and Nginx never make AWS requests, so the application needs no AWS permissions.
- **CI never receives AWS credentials.** The CI workflow uses only the built-in `GITHUB_TOKEN` and repository checks.
- **Deployment uses SSH, not AWS keys.** The deploy job connects to the EC2 host with a private SSH key stored as a GitHub environment secret (`AWS_EC2_SSH_KEY`). It does not call AWS.
- **The host pulls images with a read-only token.** `GHCR_READ_USERNAME` and `GHCR_READ_TOKEN` allow the host to pull from GitHub Container Registry. These are GitHub credentials, not AWS credentials.

Because the application needs no AWS access, the principle of least privilege means granting none to the application, and only the minimum to people and the instance.

## Identities

| Identity | Type | Purpose | Permissions required |
|---|---|---|---|
| Account root user | Root | Initial account setup only | None day to day. Enable MFA, do not create access keys, and do not use it for operations |
| Administrator | IAM Identity Center user (preferred) or IAM user with MFA | Create and manage AWS resources | An administrator policy, limited to the people who need it |
| Team member (read-only) | IAM Identity Center user or IAM user | Review resources, logs, and billing | `ReadOnlyAccess` (AWS managed) |
| EC2 instance role | IAM role attached as an instance profile | Lets the instance send metrics and logs | Only the policies listed below, if monitoring is enabled. None otherwise |
| Deployment identity | SSH key pair, not an AWS identity | Lets GitHub Actions deploy to the host | No AWS permissions. Access is controlled by the SSH key and the host user |
| GHCR read token | GitHub token, not an AWS identity | Lets the host pull images | GitHub `read:packages` on the two image packages |

## Instance role (EC2)

The EC2 instance should have an instance profile with the smallest set of policies that the monitoring design needs.

| Policy | Include? | Why |
|---|---|---|
| `CloudWatchAgentServerPolicy` (AWS managed) | Yes, if the CloudWatch agent is installed | Sends host metrics and container logs to CloudWatch. Required for gaps 3 and 4 in [monitoring.md](monitoring.md) |
| `AmazonSSMManagedInstanceCore` (AWS managed) | Optional | Allows AWS Systems Manager Session Manager as an alternative to SSH. If used, port 22 can be closed |
| Any other policy | No | The application does not use AWS services |

Do not attach `AdministratorAccess`, `PowerUserAccess`, or any S3, DynamoDB, or IAM policy to the instance role.

## Network access (security groups)

| Port | Source | Reason | Status |
|---|---|---|---|
| 80 (HTTP) | `0.0.0.0/0` or Cloudflare IP ranges | Public access, and HTTP-to-HTTPS redirect if configured | Required |
| 443 (HTTPS) | `0.0.0.0/0` or Cloudflare IP ranges | Public access over TLS | Required |
| 22 (SSH) | The administrator's IP address only, or the GitHub Actions runner range if deployment uses SSH | Deployment and maintenance | Required, restricted |
| 5000, 5432 | None | The backend and database are reached only inside Docker | Must not be open |

Restricting port 22 to a fixed address is strongly recommended. The GitHub Actions runners use changing IP addresses, so either allow the published GitHub Actions ranges, or use an approach that does not need open SSH, such as SSM.

## Deployment access

The deploy job's SSH key must be stored in the `production` GitHub environment, not in plain repository secrets, so that approval rules can apply to it.

On the host:

- Create a dedicated deploy user, and do not use the root account or a shared personal login for deployment.
- Membership of the `docker` group is equivalent to root on the host. Grant it only to users who must run Docker.
- Store the production `.env` files with restricted permissions (`chmod 600`), readable only by the deploy user.

## Setup steps

These steps are for the account owner. They are not performed by the repository.

1. Enable MFA on the root user, then stop using it for daily work.
2. Create an IAM Identity Center user (or an IAM user with MFA) for each administrator. Apply the administrator policy only to them.
3. Create the instance role with the policies in the table above. Attach it to the EC2 instance.
4. Restrict the SSH security group rule to a known address, and close ports 5000 and 5432 if they are open.
5. Store the SSH key and the GHCR read token in the `production` environment, and remove them from any other location.
6. Enable AWS CloudTrail in the region, so account activity is recorded.
7. Enable billing alerts so that unexpected spending is noticed.

## Verification

Record the following results as runtime evidence before claiming the IAM requirement is met:

- The root user has MFA enabled and has no access keys. (Check in the IAM console, under the root user's security credentials.)
- The instance role's attached policies match the table above. (Check in the EC2 console, under the instance's IAM role.)
- Port 22 is restricted, and ports 5000 and 5432 are not open. (Check in the security group.)
- `aws sts get-caller-identity` run on the host returns the instance role, and the role is not an administrator. (Run on the host, if the AWS CLI is installed.)
- CloudTrail is active in the region.

## What this document does not verify

This document describes the intended IAM design, derived from the repository. It does not show that any identity, policy, or security group exists in the live AWS account. The team lead or account owner must check the live account and record the results.
