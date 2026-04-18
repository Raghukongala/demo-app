# Task Management EKS Demo - Project Documentation

## Project Overview
A production-grade microservices application deployed on AWS EKS using Terraform, Jenkins CI/CD, and ArgoCD GitOps.

**Live URL:** https://raghu.buzz  
**ArgoCD Dashboard:** https://argocd.raghu.buzz  
**Author:** Raghu Kongala

---

## Architecture

```
Internet → Route53 (raghu.buzz) → ALB → EKS Cluster
                                         ├── frontend (React + Nginx)
                                         ├── user-service (Node.js + MongoDB)
                                         ├── task-service (Node.js + PostgreSQL)
                                         ├── notification-service (Node.js + SES)
                                         ├── redis
                                         ├── mongodb
                                         └── postgres
```

## Tech Stack
- **Cloud:** AWS (EKS, ECR, ALB, ACM, Route53, SES, S3, DynamoDB)
- **IaC:** Terraform
- **CI/CD:** Jenkins
- **GitOps:** ArgoCD
- **Containers:** Docker
- **Orchestration:** Kubernetes (EKS v1.29)
- **Autoscaling:** HPA + Cluster Autoscaler
- **DNS:** Route53 + GoDaddy
- **SSL:** AWS ACM

---

## Repositories
| Repo | Purpose |
|------|---------|
| `demo-app` | Application code + k8s manifests |
| `demo-infra` | Terraform infrastructure code |

---

## Infrastructure (Terraform)

### Resources Created
| Resource | Details |
|----------|---------|
| VPC | 10.0.0.0/16 |
| Public Subnets | 2x (ap-south-1a, ap-south-1b) |
| Private Subnets | 2x (ap-south-1a, ap-south-1b) |
| NAT Gateways | 2x (one per AZ) |
| EKS Cluster | task-management-eks (v1.29) |
| Node Group | 2x t3.medium (min:1, max:3) |
| ECR Repos | frontend, task-service, user-service, notification-service |
| S3 Bucket | pydahbucket (Terraform state) |
| DynamoDB | raghuterraform-lock (state locking) |

### Terraform State Backend
```hcl
backend "s3" {
  bucket         = "pydahbucket"
  key            = "eks/task-management/terraform.tfstate"
  region         = "ap-south-1"
  dynamodb_table = "raghuterraform-lock"
  encrypt        = true
}
```

---

## Jenkins Pipelines

### Pipeline 1 - Infra (Jenkinsfile-infra)
```
Checkout → Create DynamoDB → Terraform Init → Terraform Plan → Approval → Terraform Apply → Update kubeconfig
```

### Pipeline 2 - App (Jenkinsfile-app)
```
Checkout → ECR Login → Build & Push Images (parallel) → Update Image Tags in Repo → ArgoCD Auto-deploys → Verify Rollout
```

---

## ArgoCD GitOps Flow
```
Developer pushes code → Jenkins builds image → Updates k8s yaml with new image tag
→ Pushes to GitHub → ArgoCD detects change → Auto syncs to EKS
```

**ArgoCD Application Config:**
- Repo: https://github.com/Raghukongala/demo-app.git
- Path: k8s/
- Auto sync: Enabled
- Self heal: Enabled
- Prune: Enabled

---

## Autoscaling

### HPA (Horizontal Pod Autoscaler)
| Service | Min | Max | CPU Threshold | Memory Threshold |
|---------|-----|-----|---------------|-----------------|
| frontend | 2 | 6 | 70% | 80% |
| user-service | 1 | 4 | 70% | 80% |
| task-service | 1 | 4 | 70% | 80% |
| notification-service | 1 | 4 | 70% | 80% |

### Cluster Autoscaler
- Min nodes: 1
- Max nodes: 3
- Scales up when pods can't be scheduled
- Scales down when nodes are underutilized

---

## DNS & SSL Setup
- **Domain:** raghu.buzz (registered on GoDaddy)
- **Nameservers:** Pointed to Route53
- **Hosted Zone:** Z0010420OUD3YIUI2DJ
- **ACM Certificate:** arn:aws:acm:ap-south-1:957948932374:certificate/636c9394-8728-4af5-87db-ca83ac043a5d
- **Validation:** DNS validation via Route53 CNAME record

---

## Errors Encountered & Resolutions

### 1. Jenkins Pipeline - checkout scm Error
**Error:**
```
'checkout scm' is only available when using "Multibranch Pipeline" or "Pipeline script from SCM"
```
**Cause:** Using Pipeline script (copy-paste) instead of SCM  
**Fix:** Replaced `checkout scm` with:
```groovy
git branch: 'main', url: 'https://github.com/Raghukongala/demo-infra.git'
```

---

### 2. DynamoDB Table Not Found
**Error:**
```
ResourceNotFoundException: Requested resource not found
Unable to retrieve item from DynamoDB table "raghuterraform-lock"
```
**Cause:** DynamoDB table didn't exist before terraform init  
**Fix:** Added a pipeline stage to create DynamoDB table before terraform init:
```bash
aws dynamodb create-table \
  --table-name raghuterraform-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
aws dynamodb wait table-exists --table-name raghuterraform-lock
```

---

### 3. ECR AccessDeniedException
**Error:**
```
AccessDeniedException: not authorized to perform: ecr:CreateRepository
```
**Cause:** Jenkins EC2 IAM role missing ECR permissions  
**Fix:** Added inline policy `EKSFullAccess` with `ecr:*` and `eks:*` permissions to `ec2-ecs-debug-role`

---

### 4. EKS Node Group AMI Not Supported
**Error:**
```
InvalidParameterException: Requested AMI for this version 1.29 is not supported
```
**Cause:** Default AMI not available for EKS 1.29 in ap-south-1  
**Fix:** Added explicit AMI type in eks.tf:
```hcl
ami_type = "AL2_x86_64"
```

---

### 5. kubectl Not Found on Jenkins
**Error:**
```
kubectl: command not found (exit code 127)
```
**Cause:** kubectl not installed on Jenkins EC2  
**Fix:** Installed kubectl on Jenkins EC2:
```bash
curl -LO https://dl.k8s.io/release/v1.29.0/bin/linux/amd64/kubectl
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

---

### 6. EKS Authentication Error
**Error:**
```
error: You must be logged in to the server (the server has asked for the client to provide credentials)
```
**Cause:** EC2 role not added to EKS auth config  
**Fix:**
```bash
aws eks update-cluster-config --name task-management-eks \
  --access-config authenticationMode=API_AND_CONFIG_MAP

aws eks associate-access-policy \
  --cluster-name task-management-eks \
  --principal-arn arn:aws:iam::957948932374:role/ec2-ecs-debug-role \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster
```

---

### 7. Jenkins EC2 Out of Memory (Exit Code 228)
**Error:**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
exit code: 228
```
**Cause:** t3.micro (1GB RAM) insufficient for React build  
**Fix 1:** Added swap memory:
```bash
sudo dd if=/dev/zero of=/swapfile bs=128M count=16
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```
**Fix 2:** Added NODE_OPTIONS in Dockerfile:
```dockerfile
ENV NODE_OPTIONS=--max_old_space_size=1536
```
**Fix 3:** Upgraded EC2 from t3.micro → t3.medium

---

### 8. Jenkins EC2 Disk Full (100%)
**Error:**
```
dd: error writing '/swapfile': No space left on device
Filesystem /dev/nvme0n1p1 8.0G 8.0G 2.4M 100%
```
**Cause:** Docker images from failed builds filled the 8GB disk  
**Fix:**
```bash
docker system prune -af  # freed 2.2GB
aws ec2 modify-volume --volume-id vol-0f3a86078fa82a25f --size 20
sudo growpart /dev/nvme0n1 1
sudo xfs_growfs /
```

---

### 9. ALB Ingress Address Empty
**Error:** Ingress ADDRESS field empty, ALB not created  
**Cause:** AWS Load Balancer Controller not installed  
**Fix:**
```bash
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=task-management-eks \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=arn:aws:iam::957948932374:role/ec2-ecs-debug-role \
  --set region=ap-south-1 \
  --set vpcId=vpc-0567d75e7d46e6796
```

---

### 10. ALB Controller - No OIDC Provider
**Error:**
```
InvalidIdentityToken: No OpenIDConnect provider found in your account
```
**Cause:** OIDC provider not created for EKS cluster  
**Fix:**
```bash
aws iam create-open-id-connect-provider \
  --url https://oidc.eks.ap-south-1.amazonaws.com/id/440E8E637A325340D9E87CA6EB9C3978 \
  --client-id-list sts.amazonaws.com
```

---

### 11. ALB Controller - AssumeRoleWithWebIdentity Denied
**Error:**
```
AccessDenied: Not authorized to perform sts:AssumeRoleWithWebIdentity
```
**Cause:** IAM role trust policy missing OIDC federation  
**Fix:** Updated trust policy to include OIDC provider:
```json
{
  "Effect": "Allow",
  "Principal": {
    "Federated": "arn:aws:iam::957948932374:oidc-provider/oidc.eks.ap-south-1.amazonaws.com/id/440E8E637A325340D9E87CA6EB9C3978"
  },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringLike": {
      "oidc.eks.ap-south-1.amazonaws.com/id/440E8E637A325340D9E87CA6EB9C3978:sub": "system:serviceaccount:kube-system:aws-load-balancer-controller"
    }
  }
}
```

---

### 12. Express Rate Limit - Trust Proxy Error
**Error:**
```
ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false
ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
```
**Cause:** ALB adds X-Forwarded-For header but Express doesn't trust proxy  
**Fix:** Added to all Node.js services:
```javascript
app.set('trust proxy', 1);
```

---

### 13. npm ci Failed in Docker Build
**Error:**
```
process "/bin/sh -c npm ci --only=production --silent" did not complete successfully: exit code: 1
```
**Cause:** `npm ci` requires package-lock.json which didn't exist  
**Fix:** Changed to `npm install` in all Dockerfiles

---

### 14. ACM Certificate Wrong Account ID
**Error:** Certificate ARN had old account `796796207873`  
**Cause:** Old certificate from different AWS account in ingress.yaml  
**Fix:** Requested new certificate in account `957948932374` and updated ingress

---

### 15. IAM Policy Limit Exceeded
**Error:**
```
LimitExceeded: Cannot exceed quota for PoliciesPerRole: 10
```
**Cause:** EC2 role already had 10 managed policies attached  
**Fix:** Detached unused duplicate policy `AmazonDynamoDBFullAccess_v2`

---

### 16. S3 Bucket Not Empty on Delete
**Error:**
```
BucketNotEmpty: The bucket you tried to delete is not empty
```
**Cause:** S3 bucket had versioned objects  
**Fix:**
```bash
aws s3 rb s3://pydahbucket --force
```

---

### 17. Cluster Autoscaler ConfigMap Permission Denied
**Error:**
```
configmaps "cluster-autoscaler-status" is forbidden
```
**Cause:** ClusterRole missing configmap and lease permissions for kube-system namespace  
**Fix:** Added Role + RoleBinding for kube-system namespace:
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: cluster-autoscaler
  namespace: kube-system
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["create", "list", "watch", "get", "update", "delete"]
- apiGroups: ["coordination.k8s.io"]
  resources: ["leases"]
  verbs: ["create", "get", "update"]
```

---

### 18. ArgoCD Sync Loop (OutOfSync)
**Error:** ArgoCD kept going OutOfSync → Synced in a loop  
**Cause:** Jenkins sets image tags dynamically but repo has `latest` tags  
**Fix:** Added ignoreDifferences in ArgoCD application:
```yaml
ignoreDifferences:
- group: apps
  kind: Deployment
  jsonPointers:
  - /spec/template/spec/containers/0/image
```

---

## Key AWS Resources

| Resource | ID/ARN |
|----------|--------|
| EKS Cluster | task-management-eks |
| VPC | vpc-0567d75e7d46e6796 |
| EC2 (Jenkins) | i-07e9caedd5551e2f5 (t3.medium) |
| ACM Certificate | arn:aws:acm:ap-south-1:957948932374:certificate/636c9394-8728-4af5-87db-ca83ac043a5d |
| Route53 Hosted Zone | Z0010420OUD3YIUI2DJ |
| S3 Bucket | pydahbucket |
| DynamoDB Table | raghuterraform-lock |
| OIDC Provider | oidc.eks.ap-south-1.amazonaws.com/id/440E8E637A325340D9E87CA6EB9C3978 |

---

## Useful Commands

```bash
# Check all pods
kubectl get pods -n task-management

# Check HPA
kubectl get hpa -n task-management

# Check nodes
kubectl get nodes

# Check ArgoCD application
kubectl get application -n argocd

# Check cluster autoscaler logs
kubectl logs -n kube-system deployment/cluster-autoscaler --tail=20

# Check ALB controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller --tail=20

# Update kubeconfig
aws eks update-kubeconfig --region ap-south-1 --name task-management-eks

# Force ArgoCD sync
kubectl patch application task-management -n argocd \
  --type merge -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{"revision":"HEAD"}}}'
```

---

## What's Next
- [ ] Prometheus + Grafana monitoring
- [ ] Slack notifications for Jenkins & ArgoCD
- [ ] AWS Secrets Manager (replace k8s secrets)
- [ ] Trivy image vulnerability scanning
- [ ] SonarQube code quality gate
- [ ] Multi-environment (dev/staging/prod)
