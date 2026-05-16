# Databases — SQL, NoSQL, Sharding, Replication, Indexing

---

## 1. SQL vs NoSQL

### SQL (Relational)
- Structured data with predefined schema
- ACID transactions
- Strong consistency
- Joins across tables
- Examples: PostgreSQL, MySQL, Oracle

**Use when**:
- Complex queries and relationships
- Strong consistency required (banking, inventory)
- Data is structured and schema is stable
- Reporting and analytics with joins

### NoSQL
- Flexible/dynamic schema
- Horizontal scaling built-in
- Eventual consistency (usually)
- No joins (denormalized)
- Examples: MongoDB, Cassandra, DynamoDB, Redis

**Use when**:
- Massive scale (billions of records)
- High write throughput
- Flexible or evolving schema
- Simple access patterns (key-value, document)

### NoSQL Types
| Type | Examples | Best For |
|---|---|---|
| Key-Value | Redis, DynamoDB | Sessions, caching, simple lookups |
| Document | MongoDB, Firestore | User profiles, product catalogs |
| Wide-Column | Cassandra, HBase | Time-series, IoT, write-heavy |
| Graph | Neo4j, Amazon Neptune | Social networks, recommendation engines |

---

## 2. ACID Properties

- **Atomicity**: Transaction is all-or-nothing
- **Consistency**: DB moves from one valid state to another
- **Isolation**: Concurrent transactions don't interfere
- **Durability**: Committed transactions survive crashes

### Isolation Levels (weakest to strongest)
| Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|---|---|---|---|
| Read Uncommitted | ✓ possible | ✓ possible | ✓ possible |
| Read Committed | ✗ prevented | ✓ possible | ✓ possible |
| Repeatable Read | ✗ prevented | ✗ prevented | ✓ possible |
| Serializable | ✗ prevented | ✗ prevented | ✗ prevented |

**Default in most DBs**: Read Committed (PostgreSQL) or Repeatable Read (MySQL InnoDB)

---

## 3. BASE (NoSQL alternative to ACID)

- **B**asically **A**vailable: System guarantees availability
- **S**oft state: State may change over time even without input
- **E**ventually consistent: System will become consistent over time

---

## 4. Indexing

### B-Tree Index (default)
- Balanced tree structure
- Good for range queries, equality, ORDER BY
- Used in: PostgreSQL, MySQL for most indexes

### Hash Index
- O(1) lookup for exact equality
- Cannot do range queries
- Used in: Redis, some in-memory DBs

### Composite Index
- Index on multiple columns
- Order matters: `(a, b, c)` index helps queries on `a`, `a+b`, `a+b+c` but NOT `b` alone
- **Leftmost prefix rule**

### Covering Index
- Index contains all columns needed by query
- No need to fetch actual row (index-only scan)
- Fastest possible read

### When NOT to index
- Columns with low cardinality (e.g., boolean, gender)
- Tables with heavy write load (indexes slow down writes)
- Small tables (full scan is faster)

### Index Trade-offs
- Speeds up reads, slows down writes (index must be updated)
- Takes storage space
- Too many indexes = slow inserts/updates

---

## 5. Replication

### Leader-Follower (Master-Slave)
- One leader handles all writes
- Followers replicate from leader, handle reads
- **Pros**: Simple, read scaling, failover possible
- **Cons**: Leader is write bottleneck, replication lag, failover complexity

### Synchronous vs Asynchronous Replication
- **Sync**: Leader waits for follower to confirm before acknowledging write. Strong consistency, higher latency.
- **Async**: Leader acknowledges immediately, replicates in background. Lower latency, potential data loss on failover.
- **Semi-sync**: At least one follower must confirm (MySQL semi-sync)

### Multi-Leader (Multi-Master)
- Multiple nodes accept writes
- **Pros**: Write availability, geographic distribution
- **Cons**: Write conflicts must be resolved (last-write-wins, CRDTs, manual)
- **Use when**: Multi-datacenter, offline-capable apps

### Leaderless (Dynamo-style)
- Any node accepts writes
- Quorum reads/writes: W + R > N for consistency
- **Examples**: Cassandra, DynamoDB, Riak
- **Pros**: High availability, no failover needed
- **Cons**: Conflict resolution, read repair complexity

---

## 6. Sharding (Horizontal Partitioning)

Splitting data across multiple DB nodes.

### Range-Based Sharding
- Shard by value range (e.g., user IDs 1–1M on shard 1, 1M–2M on shard 2)
- **Pros**: Simple, range queries efficient
- **Cons**: Hot spots (e.g., new users all go to last shard)

### Hash-Based Sharding
- Hash the shard key, assign to shard by hash % N
- **Pros**: Even distribution
- **Cons**: Range queries require all shards, resharding is painful

### Consistent Hashing
- Hash both keys and nodes onto a ring
- Key goes to nearest node clockwise
- Adding/removing nodes only affects adjacent keys (minimal resharding)
- **Virtual nodes**: Each physical node has multiple positions on ring for better balance
- **Used in**: Cassandra, DynamoDB, Redis Cluster

### Directory-Based Sharding
- Lookup table maps keys to shards
- **Pros**: Flexible, easy resharding
- **Cons**: Lookup table is a bottleneck and single point of failure

### Shard Key Selection
- High cardinality (many distinct values)
- Even distribution
- Aligns with access patterns
- Avoid hot keys (e.g., celebrity user ID)

### Problems with Sharding
- Cross-shard joins are expensive or impossible
- Cross-shard transactions are complex
- Resharding requires data migration

---

## 7. Common Database Patterns

### Read Replicas
- Offload read traffic from primary
- Acceptable for slightly stale reads
- Common in: reporting, analytics, search

### CQRS (Command Query Responsibility Segregation)
- Separate read and write models
- Write model: normalized, ACID
- Read model: denormalized, optimized for queries
- Often combined with Event Sourcing

### Event Sourcing
- Store sequence of events, not current state
- Rebuild state by replaying events
- **Pros**: Full audit log, time travel, easy event-driven integration
- **Cons**: Complexity, eventual consistency, event schema evolution

### Polyglot Persistence
- Use different databases for different parts of the system
- e.g., PostgreSQL for transactions, Redis for sessions, Elasticsearch for search, S3 for blobs

---

## 8. Choosing the Right Database

| Requirement | Choice |
|---|---|
| Complex queries, joins, ACID | PostgreSQL / MySQL |
| Massive write throughput, time-series | Cassandra |
| Flexible document storage | MongoDB |
| Key-value, caching, sessions | Redis |
| Full-text search | Elasticsearch |
| Graph relationships | Neo4j |
| Object/blob storage | S3 |
| Analytics / OLAP | BigQuery, Redshift, Snowflake |
| Message queue | Kafka, SQS |

---

## Interview Tips

- Always justify your DB choice with **specific requirements** (scale, consistency, query patterns)
- Mention **indexing strategy** when discussing DB schema
- For high-scale systems, proactively bring up **sharding and replication**
- Discuss **replication lag** and how your system handles stale reads
- At senior level: discuss **failure scenarios** — what happens if primary fails, if a shard goes down
