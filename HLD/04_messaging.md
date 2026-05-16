# Messaging — Kafka, SQS, RabbitMQ, Pub/Sub Patterns

---

## 1. Why Message Queues?

- **Decoupling**: Producer and consumer don't need to know about each other
- **Async processing**: Producer doesn't wait for consumer to finish
- **Load leveling**: Absorb traffic spikes, smooth out processing
- **Reliability**: Messages persisted until consumed, survive consumer crashes
- **Fan-out**: One message delivered to multiple consumers

---

## 2. Core Concepts

### Message Queue vs Message Stream
| | Queue | Stream |
|---|---|---|
| Consumption | Message consumed once, then deleted | Message retained, can be replayed |
| Model | Point-to-point | Pub/sub or consumer groups |
| Examples | SQS, RabbitMQ | Kafka, Kinesis |

### At-Most-Once vs At-Least-Once vs Exactly-Once
| Guarantee | Description | Risk |
|---|---|---|
| At-most-once | Message sent once, may be lost | Data loss |
| At-least-once | Message retried until acknowledged, may duplicate | Duplicate processing |
| Exactly-once | Message processed exactly once | Complex, expensive |

**Most systems use at-least-once + idempotent consumers** (easier than exactly-once)

### Idempotency
- Processing the same message multiple times has the same effect as once
- Implement by: deduplication ID, checking if already processed before acting

---

## 3. Apache Kafka

### Architecture
- **Topic**: Named stream of messages (like a table in a DB)
- **Partition**: Topic split into ordered, immutable log segments
- **Offset**: Position of a message within a partition
- **Producer**: Writes messages to topics
- **Consumer**: Reads messages from topics
- **Consumer Group**: Multiple consumers sharing partitions of a topic
- **Broker**: Kafka server storing partitions
- **ZooKeeper / KRaft**: Cluster coordination (ZooKeeper being replaced by KRaft)

### Partitioning
- Messages with same key go to same partition (ordering guaranteed per key)
- Different keys distributed across partitions (parallelism)
- Number of partitions = max parallelism for consumers in a group
- One partition can only be consumed by one consumer in a group at a time

### Replication
- Each partition has one leader and N-1 followers
- Producers/consumers talk to leader
- Followers replicate from leader
- `replication.factor=3` is standard for production
- `min.insync.replicas=2` ensures at least 2 replicas have the message before ack

### Consumer Groups
- Each consumer group gets all messages (independent consumption)
- Within a group, each partition assigned to exactly one consumer
- Enables both pub/sub (multiple groups) and queue (one group, multiple consumers)

### Retention
- Messages retained by time (default 7 days) or size
- Consumers can replay from any offset
- Enables event sourcing, audit logs, reprocessing

### Kafka Use Cases
- Event streaming (user activity, clickstream)
- Log aggregation
- Change Data Capture (CDC) from databases
- Microservice communication
- Real-time analytics pipeline

### Kafka vs Traditional Queue
| | Kafka | RabbitMQ/SQS |
|---|---|---|
| Message retention | Retained (replayable) | Deleted after consumption |
| Ordering | Per partition | Per queue (FIFO) |
| Throughput | Very high (millions/sec) | High (thousands/sec) |
| Consumer model | Pull | Push or Pull |
| Use case | Streaming, event log | Task queue, RPC |

---

## 4. Amazon SQS

### Types
- **Standard Queue**: At-least-once, best-effort ordering, nearly unlimited throughput
- **FIFO Queue**: Exactly-once, strict ordering, 300 TPS (3000 with batching)

### Key Features
- **Visibility Timeout**: Message hidden from other consumers while being processed
- **Dead Letter Queue (DLQ)**: Messages that fail processing N times go here
- **Long Polling**: Consumer waits up to 20s for messages (reduces empty responses)
- **Message Retention**: 1 minute to 14 days (default 4 days)

### SQS vs Kafka
- SQS: Managed, simple, no replay, good for task queues
- Kafka: Self-managed (or MSK), replayable, high throughput, streaming

---

## 5. RabbitMQ

### Concepts
- **Exchange**: Receives messages from producers, routes to queues
- **Queue**: Stores messages until consumed
- **Binding**: Rule connecting exchange to queue
- **Routing Key**: Used by exchange to decide which queue

### Exchange Types
| Type | Routing | Use Case |
|---|---|---|
| Direct | Exact routing key match | Task routing |
| Fanout | Broadcast to all bound queues | Notifications |
| Topic | Pattern matching on routing key | Flexible routing |
| Headers | Match on message headers | Complex routing |

### RabbitMQ vs Kafka
- RabbitMQ: Push-based, complex routing, lower throughput, message deleted after ack
- Kafka: Pull-based, simple routing, very high throughput, message retained

---

## 6. Pub/Sub Pattern

### How it works
- **Publisher** sends message to a **topic/channel**
- **Subscribers** register interest in topics
- Message broker delivers to all subscribers
- Publishers and subscribers are fully decoupled

### Use Cases
- Notification systems (email, push, SMS)
- Real-time updates (stock prices, sports scores)
- Event-driven microservices
- Cache invalidation across services

### Fan-out Pattern
```
Order Placed Event
    ├── Inventory Service (reduce stock)
    ├── Email Service (send confirmation)
    ├── Analytics Service (track conversion)
    └── Recommendation Service (update model)
```

---

## 7. Message Queue Patterns

### Work Queue (Task Queue)
- Multiple workers consume from same queue
- Each message processed by exactly one worker
- Used for: background jobs, email sending, image processing

### Request-Reply (RPC over Queue)
- Producer sends request with reply-to queue and correlation ID
- Consumer processes and sends response to reply-to queue
- Used for: async RPC, microservice communication

### Dead Letter Queue (DLQ)
- Messages that fail processing after N retries
- Allows investigation without blocking main queue
- Always configure DLQ in production

### Outbox Pattern
- Write to DB and message queue atomically
- Store message in DB outbox table in same transaction
- Separate process reads outbox and publishes to queue
- Solves dual-write problem (DB write + queue publish)

---

## 8. Choosing a Messaging System

| Requirement | Choice |
|---|---|
| Simple task queue, managed | SQS Standard |
| Ordered task queue | SQS FIFO |
| Complex routing | RabbitMQ |
| High throughput streaming | Kafka |
| Real-time pub/sub | Redis Pub/Sub, Google Pub/Sub |
| Event sourcing | Kafka |
| Exactly-once processing | Kafka (transactions) or SQS FIFO |

---

## Interview Tips

- Always mention **at-least-once delivery + idempotent consumers** as the practical approach
- For any async workflow, draw the message flow explicitly
- Discuss **DLQ** — interviewers want to see you think about failure handling
- Kafka questions: know partitions, consumer groups, and offset management
- At senior level: discuss **ordering guarantees**, **backpressure**, and **consumer lag monitoring**
