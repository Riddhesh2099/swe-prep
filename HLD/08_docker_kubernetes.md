# Docker & Kubernetes — Crash Course

---

## Part 1: Docker

### What is Docker?

Docker packages an application and all its dependencies into a **container** — a lightweight, portable, isolated unit that runs the same way everywhere.

```
Without Docker:                    With Docker:
"Works on my machine"  →           Same container runs on dev,
                                   staging, and prod identically
```

### Key Concepts

| Concept | Description |
|---|---|
| **Image** | Read-only blueprint for a container (like a class) |
| **Container** | Running instance of an image (like an object) |
| **Dockerfile** | Instructions to build an image |
| **Registry** | Storage for images (Docker Hub, ECR, GCR) |
| **Volume** | Persistent storage mounted into a container |
| **Network** | Virtual network connecting containers |

---

### Docker Architecture

```
┌─────────────────────────────────────────┐
│              Docker Host                │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │Container │  │Container │            │
│  │  App A   │  │  App B   │            │
│  └────┬─────┘  └────┬─────┘            │
│       │              │                  │
│  ┌────▼──────────────▼──────────────┐  │
│  │         Docker Engine            │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │         Host OS Kernel           │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

Containers share the host OS kernel — much lighter than VMs which each have their own OS.

---

### Dockerfile Example

```dockerfile
# Base image
FROM openjdk:17-slim

# Set working directory
WORKDIR /app

# Copy built jar
COPY target/myapp.jar app.jar

# Expose port
EXPOSE 8080

# Run the app
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Common Docker Commands

```bash
# Build image from Dockerfile
docker build -t myapp:1.0 .

# Run container
docker run -p 8080:8080 myapp:1.0

# Run in background (detached)
docker run -d -p 8080:8080 myapp:1.0

# List running containers
docker ps

# Stop container
docker stop <container_id>

# View logs
docker logs <container_id>

# Shell into running container
docker exec -it <container_id> /bin/bash

# Push to registry
docker push myregistry/myapp:1.0
```

---

### Docker Networking

```
┌─────────────────────────────────────────────┐
│              Docker Network                  │
│                                             │
│  ┌──────────┐         ┌──────────────────┐  │
│  │  App     │─────────│   Database       │  │
│  │:8080     │         │   :5432          │  │
│  └──────────┘         └──────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
         │
    Host port 8080
         │
    External traffic
```

- Containers on the same network can talk by **container name**
- `bridge` — default, isolated network per container
- `host` — container shares host network (no isolation)
- `overlay` — multi-host networking (used in Swarm/K8s)

---

### Docker Compose

Run multi-container apps with a single file:

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=db
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```bash
docker-compose up -d    # start all services
docker-compose down     # stop and remove
docker-compose logs -f  # follow logs
```

---

## Part 2: Kubernetes (K8s)

### What is Kubernetes?

Kubernetes is a **container orchestration platform** — it manages running, scaling, healing, and networking of containers across a cluster of machines.

```
Docker  = runs one container on one machine
K8s     = runs thousands of containers across hundreds of machines,
          handles failures, scaling, updates automatically
```

---

### Kubernetes Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    K8s Cluster                          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                Control Plane                    │   │
│  │                                                 │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │   │
│  │  │  API     │  │  etcd    │  │  Scheduler   │  │   │
│  │  │  Server  │  │(state DB)│  │              │  │   │
│  │  └──────────┘  └──────────┘  └──────────────┘  │   │
│  │                                                 │   │
│  │  ┌──────────────────────────────────────────┐  │   │
│  │  │         Controller Manager               │  │   │
│  │  └──────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Worker     │  │   Worker     │  │   Worker     │  │
│  │   Node 1     │  │   Node 2     │  │   Node 3     │  │
│  │              │  │              │  │              │  │
│  │  ┌────────┐  │  │  ┌────────┐  │  │  ┌────────┐  │  │
│  │  │  Pod   │  │  │  │  Pod   │  │  │  │  Pod   │  │  │
│  │  │  Pod   │  │  │  │  Pod   │  │  │  │  Pod   │  │  │
│  │  └────────┘  │  │  └────────┘  │  │  └────────┘  │  │
│  │  kubelet     │  │  kubelet     │  │  kubelet     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Control Plane Components

| Component | Role |
|---|---|
| **API Server** | Entry point for all K8s commands (kubectl talks to this) |
| **etcd** | Distributed key-value store — source of truth for cluster state |
| **Scheduler** | Decides which node to place a new Pod on |
| **Controller Manager** | Runs controllers that reconcile desired vs actual state |

### Worker Node Components

| Component | Role |
|---|---|
| **kubelet** | Agent on each node, ensures containers are running |
| **kube-proxy** | Handles network routing for Services |
| **Container Runtime** | Actually runs containers (containerd, Docker) |

---

### Core K8s Objects

#### Pod
Smallest deployable unit. One or more containers that share network and storage.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
spec:
  containers:
  - name: myapp
    image: myapp:1.0
    ports:
    - containerPort: 8080
```

```
┌─────────────────────┐
│        Pod          │
│  ┌───────────────┐  │
│  │  Container A  │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │  Container B  │  │  ← sidecar (logging, proxy)
│  └───────────────┘  │
│  Shared: network,   │
│  localhost, volumes │
└─────────────────────┘
```

---

#### Deployment
Manages a set of identical Pods. Handles rolling updates and rollbacks.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3                    # run 3 pods
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:1.0
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

```
Deployment
    │
    ├── ReplicaSet
    │       ├── Pod 1  ✓ running
    │       ├── Pod 2  ✓ running
    │       └── Pod 3  ✗ crashed → K8s restarts it automatically
```

---

#### Service
Stable network endpoint for a set of Pods. Pods come and go; Service IP stays constant.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp          # routes to pods with this label
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP       # internal only
```

**Service Types:**

```
ClusterIP   → internal cluster traffic only (default)
NodePort    → exposes on each node's IP:port
LoadBalancer → creates cloud load balancer (AWS ELB, GCP LB)
```

```
External Traffic
      │
      ▼
┌─────────────┐
│LoadBalancer │  (cloud LB)
└──────┬──────┘
       │
┌──────▼──────┐
│   Service   │  (stable virtual IP)
└──────┬──────┘
       │ routes to
  ┌────┴────┐
  │         │
Pod 1     Pod 2    Pod 3
```

---

#### ConfigMap & Secret

```yaml
# ConfigMap — non-sensitive config
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DB_HOST: "postgres-service"
  LOG_LEVEL: "INFO"

---
# Secret — sensitive data (base64 encoded)
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  DB_PASSWORD: c2VjcmV0MTIz   # base64("secret123")
```

---

#### Ingress
HTTP routing rules — one entry point for multiple services.

```
Internet
    │
    ▼
┌──────────┐
│ Ingress  │
│ Controller│
└────┬─────┘
     │
     ├── /api/*    → api-service:80
     ├── /web/*    → web-service:80
     └── /admin/*  → admin-service:80
```

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
spec:
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
```

---

### Scaling

```bash
# Manual scaling
kubectl scale deployment myapp --replicas=5

# Horizontal Pod Autoscaler (auto-scale based on CPU)
kubectl autoscale deployment myapp --min=2 --max=10 --cpu-percent=70
```

```
HPA watches CPU/memory metrics
    │
    ├── CPU > 70%  → scale up (add pods)
    └── CPU < 30%  → scale down (remove pods)
```

---

### Rolling Updates & Rollbacks

```bash
# Update image (triggers rolling update)
kubectl set image deployment/myapp myapp=myapp:2.0

# Check rollout status
kubectl rollout status deployment/myapp

# Rollback to previous version
kubectl rollout undo deployment/myapp
```

```
Rolling Update:
Old: [v1] [v1] [v1] [v1]
Step 1: [v1] [v1] [v1] [v2]
Step 2: [v1] [v1] [v2] [v2]
Step 3: [v1] [v2] [v2] [v2]
Step 4: [v2] [v2] [v2] [v2]
→ Zero downtime!
```

---

### Useful kubectl Commands

```bash
# Get resources
kubectl get pods
kubectl get deployments
kubectl get services
kubectl get nodes

# Describe (detailed info + events)
kubectl describe pod <pod-name>

# Logs
kubectl logs <pod-name>
kubectl logs <pod-name> -f          # follow
kubectl logs <pod-name> -c <container>  # specific container

# Shell into pod
kubectl exec -it <pod-name> -- /bin/bash

# Apply manifest
kubectl apply -f deployment.yaml

# Delete
kubectl delete -f deployment.yaml
kubectl delete pod <pod-name>

# Port forward (local debugging)
kubectl port-forward pod/<pod-name> 8080:8080
```

---

### Namespaces

Logical isolation within a cluster — separate environments, teams, or apps.

```bash
kubectl get pods -n kube-system      # system namespace
kubectl get pods -n production       # your namespace
kubectl create namespace staging
```

---

### K8s vs Docker Compose

| | Docker Compose | Kubernetes |
|---|---|---|
| Scale | Single machine | Multi-node cluster |
| Self-healing | No | Yes (restarts failed pods) |
| Rolling updates | No | Yes |
| Load balancing | Basic | Built-in |
| Use case | Local dev | Production |

---

## Interview Tips

- **Docker**: Know the difference between image and container, how layers work, multi-stage builds
- **K8s**: Know Pod vs Deployment vs Service, how Services route traffic, what etcd does
- **Scaling**: HPA for CPU-based, VPA for resource tuning, Cluster Autoscaler for node scaling
- **Networking**: ClusterIP vs NodePort vs LoadBalancer vs Ingress
- **At senior level**: Discuss resource limits/requests, liveness/readiness probes, PodDisruptionBudgets, and why you'd use StatefulSets for databases
