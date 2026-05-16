# HLD Fundamentals — Scalability, Load Balancing, CAP Theorem

---

## 1. Scalability

### Vertical Scaling (Scale Up)
- Add more CPU, RAM, or storage to a single machine
- **Pros**: Simple, no code changes, low latency (no network hops)
- **Cons**: Hard limit (biggest machine available), single point of failure, expensive
- **When to use**: Early stage, databases (up to a point), stateful services

### Horizontal Scaling (Scale Out)
- Add more machines to distribute load
- **Pros**: Theoretically unlimited, fault tolerant, cost-effective with commodity hardware
- **Cons**: Complexity (distributed systems problems), stateless requirement, data consistency challenges
- **When to use**: Web servers, API servers, stateless microservices

### Stateless vs Stateful Services
- **Stateless**: Each request contains all info needed. Easy to scale horizontally. (e.g., REST APIs)
- **Stateful**: Server remembers client state between requests. Hard to scale. (e.g., WebSocket connections, sessions)
- **Solution for stateful**: Externalize state to shared store (Redis, DB) so any server can handle any request

---

## 2. Load Balancing

### What it does
Distributes incoming traffic across multiple servers to prevent any single server from becoming a bottleneck.

### Algorithms
| Algorithm | Description | Best For |
|---|---|---|
| Round Robin | Requests distributed sequentially | Homogeneous servers, equal request cost |
| Weighted Round Robin | Servers get traffic proportional to weight | Heterogeneous server capacities |
| Least Connections | Route to server with fewest active connections | Long-lived connections (WebSockets) |
| IP Hash | Hash client IP to always route to same server | Session persistence without sticky sessions |
| Random | Random server selection | Simple, low overhead |
| Least Response Time | Route to fastest responding server | Latency-sensitive applications |

### Layer 4 vs Layer 7 Load Balancing
- **L4 (Transport)**: Routes based on IP/TCP. Fast, no content inspection. (e.g., AWS NLB)
- **L7 (Application)**: Routes based on HTTP headers, URL, cookies. Smarter routing, SSL termination. (e.g., AWS ALB, Nginx)

### Health Checks
- Load balancers periodically ping servers
- Remove unhealthy servers from rotation automatically
- Active (LB pings server) vs Passive (LB monitors traffic)

### Single Point of Failure
- Load balancer itself can fail → use active-passive or active-active LB pairs
- DNS-based load balancing as a fallback

---

## 3. CAP Theorem

### The Theorem
In a distributed system, you can only guarantee **2 of 3**:
- **C**onsistency — Every read receives the most recent write
- **A**vailability — Every request receives a response (not necessarily latest data)
- **P**artition Tolerance — System continues operating despite network partitions

### The Reality
Network partitions **will** happen. So the real choice is **CP vs AP**:

| Choice | Behaviour | Examples |
|---|---|---|
| CP | Returns error or timeout if can't guarantee consistency | HBase, Zookeeper, etcd |
| AP | Returns potentially stale data but always responds | Cassandra, DynamoDB, CouchDB |
| CA | Only possible without partitions (single node) | Traditional RDBMS (PostgreSQL, MySQL) |

### Interview Tip
Don't just state CAP — explain the **trade-off for your specific system**:
- Banking system → CP (can't show wrong balance)
- Social media feed → AP (slightly stale feed is fine)
- Shopping cart → AP with eventual consistency (availability > consistency)

---

## 4. Consistency Models

From strongest to weakest:

### Strong Consistency
- After a write completes, all subsequent reads return that value
- Expensive — requires coordination across nodes
- Used in: financial systems, inventory management

### Linearizability
- Operations appear instantaneous and in real-time order
- Strongest form of consistency
- Used in: distributed locks, leader election

### Sequential Consistency
- All operations appear in some sequential order, same order seen by all nodes
- Weaker than linearizability (no real-time guarantee)

### Causal Consistency
- Causally related operations seen in order; concurrent operations may differ
- Used in: collaborative editing, comment threads

### Eventual Consistency
- Given no new updates, all replicas will eventually converge
- Highest availability, lowest latency
- Used in: DNS, shopping carts, social media likes

### Read-Your-Writes Consistency
- After a write, the same client always reads that value
- Important for user-facing apps (e.g., after posting a comment, you see it)

---

## 5. Availability & Reliability

### Availability Numbers
| Availability | Downtime/year | Downtime/month |
|---|---|---|
| 99% (2 nines) | 3.65 days | 7.2 hours |
| 99.9% (3 nines) | 8.76 hours | 43.8 minutes |
| 99.99% (4 nines) | 52.6 minutes | 4.4 minutes |
| 99.999% (5 nines) | 5.26 minutes | 26 seconds |

### Reliability Patterns
- **Redundancy**: Multiple instances, no single point of failure
- **Failover**: Automatic switch to backup on failure (active-passive or active-active)
- **Circuit Breaker**: Stop calling a failing service to prevent cascade failures
- **Retry with Backoff**: Retry failed requests with exponential backoff + jitter
- **Bulkhead**: Isolate failures to prevent them spreading (separate thread pools per service)
- **Timeout**: Always set timeouts on external calls

---

## 6. Back-of-Envelope Estimation

### Key Numbers to Know
| Operation | Latency |
|---|---|
| L1 cache reference | 0.5 ns |
| L2 cache reference | 7 ns |
| RAM access | 100 ns |
| SSD random read | 150 µs |
| HDD seek | 10 ms |
| Network round trip (same DC) | 0.5 ms |
| Network round trip (cross-continent) | 150 ms |

### Storage
- 1 char = 1 byte
- 1 int = 4 bytes
- 1 UUID = 16 bytes
- 1 image (compressed) ≈ 300 KB
- 1 video (1 min, 720p) ≈ 50 MB

### Estimation Framework
1. **QPS**: Daily active users × actions per day / 86,400 seconds
2. **Peak QPS**: QPS × 2–3x
3. **Storage**: QPS × data size per request × retention period
4. **Bandwidth**: QPS × data size per request

### Example: Twitter
- 300M DAU, 5 tweets/day = 1.5B tweets/day = ~17,000 QPS
- Peak: ~50,000 QPS
- Tweet size: 280 chars + metadata ≈ 1 KB
- Storage: 17,000 × 1 KB = 17 MB/s = ~1.5 TB/day

---

## Interview Tips

- Always clarify **functional vs non-functional requirements** first
- State your **assumptions** explicitly
- Think about **bottlenecks** at each layer
- Discuss **trade-offs**, not just solutions
- At senior level: proactively identify failure modes and how to handle them
