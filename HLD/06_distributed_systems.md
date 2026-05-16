# Distributed Systems — Consistent Hashing, Consensus, Transactions

---

## 1. Consistent Hashing

### The Problem
- With N servers, naive hashing: `server = hash(key) % N`
- Adding/removing a server changes N → almost all keys remap → cache invalidation storm

### The Solution: Consistent Hashing
- Map both servers and keys onto a circular ring (0 to 2^32)
- Key is assigned to the first server clockwise on the ring
- Adding/removing a server only affects keys between it and its predecessor

### Virtual Nodes
- Each physical server has multiple positions (virtual nodes) on the ring
- More even distribution, especially with heterogeneous servers
- Typical: 100–200 virtual nodes per physical server
- Used in: Cassandra, DynamoDB, Redis Cluster

### Benefits
- Adding a server: only ~K/N keys need to move (K = total keys, N = servers)
- Removing a server: only that server's keys need to move
- Minimal disruption to the system

---

## 2. Consensus Algorithms

### The Problem
- Distributed nodes must agree on a single value (leader, log entry, config)
- Nodes can fail, messages can be delayed or lost

### Paxos
- Classic consensus algorithm (Lamport, 1989)
- Two phases: Prepare/Promise and Accept/Accepted
- Notoriously difficult to understand and implement correctly
- Used in: Google Chubby, some older systems

### Raft (more practical)
- Designed to be understandable
- Three roles: **Leader**, **Follower**, **Candidate**
- **Leader election**: Followers timeout → become candidate → request votes → majority wins
- **Log replication**: Leader receives writes → appends to log → replicates to followers → commits when majority ack
- **Safety**: Only nodes with up-to-date log can become leader

#### Raft Key Properties
- At most one leader per term
- Leader has all committed entries
- Entries committed only when stored on majority of nodes
- Used in: etcd, CockroachDB, TiKV, Consul

### ZooKeeper (ZAB protocol)
- Coordination service for distributed systems
- Leader election, distributed locks, configuration management
- Used by: Kafka (older versions), HBase, Hadoop

---

## 3. Distributed Transactions

### The Problem
- Transaction spans multiple services/databases
- Need atomicity across all of them

### Two-Phase Commit (2PC)
**Phase 1 (Prepare)**:
- Coordinator asks all participants: "Can you commit?"
- Each participant locks resources and responds Yes/No

**Phase 2 (Commit/Abort)**:
- If all Yes: Coordinator sends Commit
- If any No: Coordinator sends Abort

**Problems**:
- Coordinator is single point of failure
- Participants block waiting for coordinator (holding locks)
- Not partition tolerant

### Saga Pattern
- Break distributed transaction into sequence of local transactions
- Each step publishes event/message triggering next step
- On failure: execute compensating transactions to undo previous steps

**Choreography-based Saga**:
- Services react to events, no central coordinator
- Pros: Loose coupling
- Cons: Hard to track overall state, complex error handling

**Orchestration-based Saga**:
- Central orchestrator tells each service what to do
- Pros: Easier to track, centralized error handling
- Cons: Orchestrator can become bottleneck

**Example: Order placement**
```
1. Create Order (pending)
2. Reserve Inventory → on fail: Cancel Order
3. Charge Payment → on fail: Release Inventory, Cancel Order
4. Ship Order → on fail: Refund Payment, Release Inventory, Cancel Order
5. Mark Order Complete
```

---

## 4. Leader Election

### Why needed
- Designate one node to coordinate work (avoid conflicts)
- Used in: primary DB selection, distributed locks, job scheduling

### Approaches
- **ZooKeeper**: Create ephemeral sequential node; lowest sequence number wins
- **etcd/Raft**: Built-in leader election
- **Redis (Redlock)**: Acquire lock on majority of N Redis nodes

---

## 5. Distributed Locks

### Use Cases
- Prevent duplicate processing
- Coordinate access to shared resource
- Distributed cron jobs (only one instance runs)

### Redis-based Lock
```
SET lock_key unique_value NX PX 30000
# NX = only set if not exists
# PX = expire in 30 seconds
```
- Release: only delete if value matches (Lua script for atomicity)
- **Redlock**: Acquire on majority of N independent Redis nodes for safety

### Problems with Distributed Locks
- Lock holder can pause (GC, network) and lock expires → two holders
- Use fencing tokens (monotonically increasing number) to detect stale lock holders

---

## 6. Clock Synchronization

### The Problem
- Clocks on different machines drift
- Can't rely on timestamps for ordering events

### Logical Clocks (Lamport Timestamps)
- Each event increments a counter
- On message send: include counter
- On message receive: `max(local, received) + 1`
- Captures causality: if A → B, then timestamp(A) < timestamp(B)
- Doesn't capture concurrency

### Vector Clocks
- Each node maintains a vector of counters (one per node)
- Captures causality and concurrency
- Used in: Dynamo, Riak

### Hybrid Logical Clocks (HLC)
- Combines physical time with logical clock
- Used in: CockroachDB, YugabyteDB

---

## 7. Failure Detection

### Heartbeat
- Nodes send periodic heartbeats
- If no heartbeat within timeout → node considered failed
- Simple but can have false positives (slow network ≠ dead node)

### Phi Accrual Failure Detector
- Probabilistic failure detection
- Returns suspicion level (phi value) rather than binary alive/dead
- Used in: Cassandra, Akka

### Gossip Protocol
- Nodes randomly share state with other nodes
- Information propagates like a rumor
- Eventually all nodes know about failures
- Used in: Cassandra, DynamoDB, Consul

---

## 8. Data Consistency Patterns

### Read Repair
- On read, compare values from multiple replicas
- If inconsistent, repair the stale replica
- Used in: Cassandra, Dynamo

### Anti-Entropy
- Background process compares replicas and syncs differences
- Uses Merkle trees to efficiently find differences

### Quorum
- W + R > N guarantees at least one node has latest value
- N = total replicas, W = write quorum, R = read quorum
- Common: N=3, W=2, R=2 (strong consistency)
- N=3, W=1, R=1 (high availability, eventual consistency)

---

## 9. Service Discovery

### Client-Side Discovery
- Client queries service registry (Consul, Eureka)
- Client selects instance and makes request
- Pros: Client controls load balancing
- Cons: Client must implement discovery logic

### Server-Side Discovery
- Client sends request to load balancer
- Load balancer queries registry and routes
- Pros: Simple client
- Cons: Extra hop, load balancer must be highly available

### Service Mesh (Sidecar Pattern)
- Sidecar proxy (Envoy) handles discovery, load balancing, retries, circuit breaking
- Application code doesn't need to know about infrastructure
- Examples: Istio, Linkerd

---

## Interview Tips

- Consistent hashing comes up in almost every distributed system design — know it cold
- For any system requiring coordination, mention **leader election** and **distributed locks**
- Saga pattern is the go-to answer for distributed transactions at scale
- At senior level: discuss **failure modes** — what happens when coordinator fails in 2PC, when lock holder crashes, when network partitions
