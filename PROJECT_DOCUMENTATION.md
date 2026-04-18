# Task Management & Bank App - EKS Project Documentation

## Project Overview
Two production-grade microservices applications deployed on AWS EKS using Terraform, Jenkins CI/CD, ArgoCD GitOps, Canary Deployments, SonarQube, HPA, and Cluster Autoscaler.

**Task Management App:** https://raghu.buzz  
**Bank App:** http://bank.raghu.buzz  
**ArgoCD Dashboard:** https://argocd.raghu.buzz  
**SonarQube:** http://65.2.175.64:9000  
**Jenkins:** http://65.2.175.64:8080  
**Author:** Raghu Kongala

---

## Architecture

```
Internet → Route53 (raghu.buzz) → ALB → EKS Cluster
                                         ├── task-management namespace
                                         │   ├── frontend (React + Nginx)
                                         │   ├── user-service (Node.js + MongoDB)
                                         │   ├── task-service (Node.js + PostgreSQL)
                                         │   ├── notification-service (Node.js + SES)
                                         │   ├── redis (PVC)
                                         │   ├── mongodb (PVC)
                                         │   └── postgres (PVC)
                                         └── bank-app namespace
                                             ├── frontend (React + Nginx)
                                             ├── account-service (Java Spring Boot)
                                             ├── transaction-service (Node.js)
                                             ├── notification-service (Node.js + SES)
                                             ├── mongodb (PVC)
                                             └── postgres (PVC)
```

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Cloud | AWS (EKS, ECR, ALB, ACM, Route53, SES, S3, DynamoDB, EBS) |
| IaC | Terraform |
| CI/CD | Jenkins |
| GitOps | ArgoCD v3.3.7 |
| Deployment Strategy | Canary (Argo Rollouts) |
| Code Quality | SonarQube |
| Security Scanning | Trivy |
| Containers | Docker |
| Orchestration | Kubernetes (EKS v1.29) |
| Autoscaling | HPA + Cluster Autoscaler |
| Storage | AWS EBS (gp2) with PVC |
| DNS | Route53 + GoDaddy |
| SSL | AWS ACM |
| Monitoring | metrics-server |

---

## Repositories

| Repo | Purpose |
|------|---------|
| `demo-app` | Application code + k8s manifests + bank-app |
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
| Node Group | t3.medium (min:1, max:5, desired:3) |
| ECR Repos | task-management: frontend, task-service, user-service, notification-service |
| ECR Repos | bank-app: frontend, account-service, transaction-service, notification-service |
| S3 Bucket | pydahbucket (Terraform state) |
| DynamoDB | raghuterraform-lock (state locking) |

---

## Jenkins Pipelines

### Pipeline 1 - Infra (demo-infra)
```
Checkout → Create DynamoDB → Terraform Init → Terraform Plan → Approval → Terraform Apply → Update kubeconfig
```

### Pipeline 2 - Task Management App (demo-app)
```
Checkout → ECR Login → SonarQube Analysis → Quality Gate
→ Build & Push Images (parallel) → Update Image Tags in Repo
→ ArgoCD Auto-deploys (Canary) → Verify Rollout
```

### Pipeline 3 - Bank App (demo-bank)
```
Checkout → ECR Login → SonarQube Analysis → Quality Gate
→ Build & Push Images (parallel) → Deploy to EKS
→ Register ArgoCD Application → Verify Rollout
```

---

## ArgoCD GitOps Flow
```
Code change → GitHub push → Jenkins triggered (webhook)
→ SonarQube scan → Build Docker image → Push to ECR
→ Update image tag in k8s yaml → Push to GitHub
→ ArgoCD detects change → Canary 20% → 50% → 100%
```

**Applications managed by ArgoCD:**
- `task-management` → watches `k8s/` folder
- `bank-app` → watches `bank-app/k8s/` folder

---

## Canary Deployment (Argo Rollouts)

All 4 task-management services use canary strategy:

```yaml
strategy:
  canary:
    steps:
    - setWeight: 20    # 20% traffic to new version
    - pause: {duration: 30s}
    - setWeight: 50    # 50% traffic
    - pause: {duration: 30s}
    - setWeight: 100   # 100% stable
```

**Commands:**
```bash
# Watch canary rollout
kubectl-argo-rollouts get rollout frontend -n task-management --watch

# Manually set image for canary
kubectl-argo-rollouts set image frontend frontend=<image>:<tag> -n task-management
```

---

## Autoscaling

### HPA (Horizontal Pod Autoscaler)
| Service | Min | Max | CPU | Memory |
|---------|-----|-----|-----|--------|
| frontend | 2 | 6 | 70% | 80% |
| user-service | 1 | 4 | 70% | 80% |
| task-service | 1 | 4 | 70% | 80% |
| notification-service | 1 | 4 | 70% | 80% |

### Cluster Autoscaler
- Min nodes: 1, Max nodes: 5
- ASG tags: `k8s.io/cluster-autoscaler/enabled=true`
- Scales up when pods can't be scheduled
- Scales down when nodes are underutilized

---

## Persistent Storage (EBS)

All databases use AWS EBS gp2 volumes with PVC:

| Database | PVC Name | Size | Mount Path |
|----------|----------|------|-----------|
| MongoDB (task-mgmt) | mongodb-pvc | 5Gi | /data/db |
| PostgreSQL (task-mgmt) | postgres-pvc | 5Gi | /var/lib/postgresql/data |
| Redis | redis-pvc | 2Gi | /data |
| MongoDB (bank-app) | bank-mongodb-pvc | 5Gi | /data/db |
| PostgreSQL (bank-app) | bank-postgres-pvc | 5Gi | /var/lib/postgresql/data |

**EBS CSI Driver:** Installed as EKS addon `aws-ebs-csi-driver`

---

## SonarQube Code Quality

- **URL:** http://65.2.175.64:9000
- **Project:** task-management, bank-app
- **Results:** 0 Bugs, 0 Vulnerabilities, 27 Code Smells
- **Quality Gate:** PASSED ✅
- **Webhook:** Configured to notify Jenkins on analysis completion

---

## DNS & SSL Setup
- **Domain:** raghu.buzz (GoDaddy → Route53 nameservers)
- **Hosted Zone:** Z0010420OUD3YIUI2DJ
- **ACM Certificate:** Covers `raghu.buzz` + `*.raghu.buzz`
- **Route53 Records:**
  - `raghu.buzz` → task-management ALB
  - `www.raghu.buzz` → task-management ALB
  - `argocd.raghu.buzz` → ArgoCD ALB
  - `bank.raghu.buzz` → bank-app ALB

---

## Bank App (Java Spring Boot + Node.js)

### Services
| Service | Language | Database | Port |
|---------|----------|----------|------|
| account-service | Java Spring Boot | PostgreSQL | 8080 |
| transaction-service | Node.js | MongoDB | 3001 |
| notification-service | Node.js | SES | 3002 |
| frontend | React + Nginx | - | 80 |

### Features
- Open bank account (auto-generates account number with ₹1000 balance)
- Transfer money between accounts
- Transaction history
- Email notifications via AWS SES

---

## Errors Encountered & Resolutions

### 1. Jenkins Pipeline - checkout scm Error
**Error:** `'checkout scm' is only available when using "Multibranch Pipeline"`  
**Cause:** Using Pipeline script (copy-paste) instead of SCM  
**Fix:**
```groovy
git branch: 'main', url: 'https://github.com/Raghukongala/demo-infra.git'
```

---

### 2. DynamoDB Table Not Found
**Error:** `ResourceNotFoundException: Requested resource not found`  
**Cause:** DynamoDB table didn't exist before terraform init  
**Fix:** Added pipeline stage to create table before terraform init with `aws dynamodb wait table-exists`

---

### 3. ECR AccessDeniedException
**Error:** `not authorized to perform: ecr:CreateRepository`  
**Cause:** Jenkins EC2 IAM role missing ECR/EKS permissions  
**Fix:** Added inline policy `EKSFullAccess` with `ecr:*` and `eks:*` to `ec2-ecs-debug-role`

---

### 4. EKS Node Group AMI Not Supported
**Error:** `Requested AMI for this version 1.29 is not supported`  
**Fix:** Added `ami_type = "AL2_x86_64"` in eks.tf

---

### 5. kubectl Not Found on Jenkins
**Error:** `kubectl: command not found (exit code 127)`  
**Fix:**
```bash
curl -LO https://dl.k8s.io/release/v1.29.0/bin/linux/amd64/kubectl
chmod +x kubectl && sudo mv kubectl /usr/local/bin/
```

---

### 6. EKS Authentication Error
**Error:** `You must be logged in to the server`  
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
**Error:** `FATAL ERROR: JavaScript heap out of memory`  
**Cause:** t3.micro (1GB RAM) insufficient for React build  
**Fix 1:** Added swap: `sudo dd if=/dev/zero of=/swapfile bs=128M count=16`  
**Fix 2:** `ENV NODE_OPTIONS=--max_old_space_size=1536` in Dockerfile  
**Fix 3:** Upgraded EC2 t3.micro → t3.medium via AWS CLI

---

### 8. Jenkins EC2 Disk Full (100%)
**Error:** `No space left on device`  
**Cause:** Docker images from failed builds + Trivy Java DB  
**Fix:**
```bash
docker system prune -af
sudo rm -rf /tmp/trivy-* /tmp/getter*
aws ec2 modify-volume --volume-id vol-0f3a86078fa82a25f --size 30
sudo growpart /dev/nvme0n1 1 && sudo xfs_growfs /
```

---

### 9. ALB Ingress Address Empty
**Cause:** AWS Load Balancer Controller not installed  
**Fix:** Installed via Helm with OIDC service account annotation

---

### 10. ALB Controller - No OIDC Provider
**Error:** `No OpenIDConnect provider found in your account`  
**Fix:**
```bash
aws iam create-open-id-connect-provider \
  --url https://oidc.eks.ap-south-1.amazonaws.com/id/440E8E637A325340D9E87CA6EB9C3978 \
  --client-id-list sts.amazonaws.com
```

---

### 11. ALB Controller - AssumeRoleWithWebIdentity Denied
**Error:** `Not authorized to perform sts:AssumeRoleWithWebIdentity`  
**Fix:** Updated IAM role trust policy to include OIDC federation

---

### 12. Express Rate Limit - Trust Proxy Error
**Error:** `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`  
**Fix:** Added `app.set('trust proxy', 1)` to all Node.js services

---

### 13. npm ci Failed in Docker Build
**Error:** `npm ci did not complete successfully: exit code: 1`  
**Fix:** Changed `npm ci` → `npm install` in all Dockerfiles

---

### 14. ACM Certificate Wrong Account ID
**Cause:** Old certificate from account `796796207873` in ingress.yaml  
**Fix:** Requested new certificate in account `957948932374`

---

### 15. IAM Policy Limit Exceeded
**Error:** `Cannot exceed quota for PoliciesPerRole: 10`  
**Fix:** Detached unused `AmazonDynamoDBFullAccess_v2` policy

---

### 16. Cluster Autoscaler ConfigMap Permission Denied
**Error:** `configmaps "cluster-autoscaler-status" is forbidden`  
**Fix:** Added Role + RoleBinding for kube-system namespace with configmap and lease permissions

---

### 17. ArgoCD Sync Loop (OutOfSync)
**Cause:** Jenkins sets build number image tags but repo has `latest`  
**Fix:**
```yaml
ignoreDifferences:
- group: apps
  kind: Deployment
  jsonPointers:
  - /spec/template/spec/containers/0/image
```

---

### 18. Canary Not Triggering (revision:1 stuck)
**Cause:** Argo Rollouts uses `latest` tag — same tag doesn't trigger new rollout  
**Fix:** Changed rollouts.yaml to use build number tags (`:1`, `:2` etc) so each build triggers a new canary revision

---

### 19. SonarQube Java Analysis Error
**Error:** `Your project contains .java files, please provide compiled classes with sonar.java.binaries`  
**Cause:** SonarQube tried to analyze Java source without compiled classes  
**Fix:** Added Java exclusions to `sonar-project.properties`:
```
sonar.exclusions=**/*.java,**/pom.xml,**/target/**,**/node_modules/**
```

---

### 20. PostgreSQL CrashLoopBackOff (EBS Mount)
**Error:** `initdb: error: directory "/var/lib/postgresql/data" exists but is not empty - lost+found directory`  
**Cause:** EBS volume mount point has `lost+found` directory created by filesystem  
**Fix:** Added `subPath` to volumeMount:
```yaml
volumeMounts:
- name: postgres-data
  mountPath: /var/lib/postgresql/data
  subPath: pgdata
```

---

### 21. Too Many Pods - Cluster Full
**Error:** `0/3 nodes are available: 3 Too many pods`  
**Cause:** Running both task-management and bank-app on 3 nodes exceeded pod limit  
**Fix:**
```bash
# Scale down unused replicas
kubectl scale deployment redis -n task-management --replicas=1
kubectl scale deployment frontend -n task-management --replicas=2
kubectl scale deployment argocd-applicationset-controller -n argocd --replicas=0

# Increase max nodes
aws eks update-nodegroup-config --cluster-name task-management-eks \
  --nodegroup-name task-management-eks-ng \
  --scaling-config minSize=1,maxSize=5,desiredSize=3
```

---

### 22. Trivy Java DB Download - No Space
**Error:** `Unable to initialize the Java DB: write /tmp/getter: no space left on device`  
**Cause:** Trivy downloads Java DB (~500MB) for Java image scanning  
**Fix:** Removed Trivy from pipelines temporarily. For production use `--scanners vuln` flag to skip Java DB

---

### 23. Git Push Failed from Jenkins
**Error:** `fatal: could not read Username for 'https://github.com': No such device or address`  
**Cause:** Jenkins pipeline needs GitHub credentials to push image tag updates  
**Fix:** Added GitHub credentials in Jenkins and used `withCredentials`:
```groovy
withCredentials([usernamePassword(credentialsId: 'github-credentials', 
  usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
    sh 'git remote set-url origin https://$GIT_USER:$GIT_TOKEN@github.com/...'
}
```

---

## Key AWS Resources

| Resource | ID/Value |
|----------|---------|
| EKS Cluster | task-management-eks |
| VPC | vpc-0567d75e7d46e6796 |
| EC2 Jenkins | i-07e9caedd5551e2f5 (t3.medium, 30GB) |
| ACM Certificate | arn:aws:acm:ap-south-1:957948932374:certificate/636c9394... |
| Route53 Hosted Zone | Z0010420OUD3YIUI2DJ |
| S3 Bucket | pydahbucket |
| DynamoDB Table | raghuterraform-lock |
| OIDC Provider | oidc.eks.ap-south-1.amazonaws.com/id/440E8E637A325340D9E87CA6EB9C3978 |
| EBS Volume (Jenkins) | vol-0f3a86078fa82a25f (30GB) |

---

## Useful Commands

```bash
# Update kubeconfig
aws eks update-kubeconfig --region ap-south-1 --name task-management-eks

# Check all pods
kubectl get pods -n task-management
kubectl get pods -n bank-app

# Check HPA
kubectl get hpa -n task-management

# Check nodes
kubectl get nodes

# Check ArgoCD applications
kubectl get application -n argocd

# Watch canary rollout
kubectl-argo-rollouts get rollout frontend -n task-management --watch

# Force ArgoCD sync
kubectl patch application task-management -n argocd \
  --type merge -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{"revision":"HEAD"}}}'

# Check cluster autoscaler
kubectl logs -n kube-system deployment/cluster-autoscaler --tail=20

# Check ALB controller
kubectl logs -n kube-system deployment/aws-load-balancer-controller --tail=20

# Check PVCs
kubectl get pvc -n task-management
kubectl get pvc -n bank-app

# SonarQube token
# http://65.2.175.64:9000/account/security

# ArgoCD password
kubectl get secret argocd-initial-admin-secret -n argocd \
  -o jsonpath="{.data.password}" | base64 -d
```

---

## What's Completed ✅

| Feature | Status |
|---------|--------|
| EKS Infra (Terraform) | ✅ |
| Jenkins CI/CD (3 pipelines) | ✅ |
| HTTPS + raghu.buzz | ✅ |
| ArgoCD GitOps | ✅ |
| Canary Deployment (Argo Rollouts) | ✅ |
| HPA (pod autoscaling) | ✅ |
| Cluster Autoscaler (node autoscaling) | ✅ |
| Persistent Storage (EBS PVC) | ✅ |
| SonarQube Code Quality | ✅ |
| GitHub Webhook Auto-trigger | ✅ |
| Task Management App | ✅ |
| Bank App (Java Spring Boot) | ✅ |
| SES Email Notifications | ✅ |

## What's Next 🔜

- [ ] Prometheus + Grafana monitoring
- [ ] Slack notifications for Jenkins & ArgoCD
- [ ] AWS Secrets Manager (replace k8s secrets)
- [ ] Multi-environment (dev/staging/prod)
- [ ] Network Policies between pods
