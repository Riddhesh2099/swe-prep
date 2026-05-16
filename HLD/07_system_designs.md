# System Design Worked Examples

---

## Framework (Use Every Time)

1. **Clarify requirements** (5 min): Functional + non-functional
2. **Estimate scale** (3 min): QPS, storage, bandwidth
3. **Define API** (5 min): Key endpoints
4. **Data model** (5 min): Schema, DB choice
5. **High-level design** (10 min): Components and data flow
6. **Deep dive** (15 min): 1–2 critical components
7. **Trade-offs** (5 min): What you'd do differently at different scales

---

## 1. URL Shortener (TinyURL)

### Requirements
- Functional: Shorten URL, redirect to original, custom aliases (optional)
- Non-functional: 100M URLs/day, low latency reads, high availability

### Estimation
- Write: 100M/day = ~1200 QPS
- Read: 10:1 read/write = 12,000 QPS
- Storage: 100M × 500 bytes = 50 GB/day

### API
```
POST /shorten { url, custom_alias? } → { short_url }
GET /{short_code} → 301/302 redirect
```

### Data Model
```
urls table:
  short_code  VARCHAR(8) PK
  long_url    TEXT
  created_at  TIMESTAMP
  expires_at  TIMESTAMP
  user_id     BIGINT
```

### Short Code Generation
- **Option 1**: Hash (MD5/SHA256) of long URL → take first 7 chars → collision check
- **Option 2**: Base62 encode auto-increment ID (a-z, A-Z, 0-9 = 62 chars, 7 chars = 62^7 = 3.5 trillion)
- **Option 3**: Pre-generate random codes, store in pool

### Architecture
```
Client → CDN → Load Balancer → API Servers → Cache (Redis) → DB (MySQL)
```
- Cache: Store short_code → long_url mappings (high read:write ratio)
- 301 vs 302: 301 (permanent, browser caches) vs 302 (temporary, always hits server — better for analytics)

### Deep Dive: Avoiding Collisions
- Use distributed ID generator (Snowflake) for unique IDs
- Base62 encode the ID → guaranteed unique, no collision check needed

---

## 2. Twitter / News Feed

### Requirements
- Functional: Post tweet, follow users, view home timeline
- Non-functional: 300M DAU, 50K QPS reads, eventual consistency OK for feed

### Fan-out Strategies

#### Fan-out on Write (Push)
- When user tweets, push to all followers' feed caches immediately
- **Pros**: Fast reads (pre-computed feed)
- **Cons**: Expensive for celebrities (millions of followers), wasted work for inactive users

#### Fan-out on Read (Pull)
- When user opens feed, fetch tweets from all followed users
- **Pros**: No wasted work, simple writes
- **Cons**: Slow reads (N queries for N followees)

#### Hybrid (Twitter's actual approach)
- Regular users: fan-out on write
- Celebrities (>10K followers): fan-out on read
- Merge celebrity tweets at read time

### Data Model
```
users: user_id, username, follower_count
tweets: tweet_id, user_id, content, created_at
follows: follower_id, followee_id
feed_cache: user_id → [tweet_ids] (Redis sorted set by timestamp)
```

### Architecture
```
Post Tweet:
  API → Tweet Service → DB + Message Queue
  Message Queue → Fan-out Service → Update follower feed caches

Read Feed:
  API → Feed Service → Redis (feed cache) → Tweet Service (fetch content)
```

---

## 3. WhatsApp / Chat System

### Requirements
- Functional: 1:1 messaging, group chat, online status, message delivery receipts
- Non-functional: Low latency (<100ms), 50B messages/day, message ordering

### Connection Management
- **WebSocket**: Persistent connection for real-time messaging
- Each chat server maintains WebSocket connections
- Connection service maps user_id → server

### Message Flow (1:1)
```
Sender → WebSocket → Chat Server A
Chat Server A → Message Queue (Kafka)
Message Queue → Chat Server B (receiver's server)
Chat Server B → WebSocket → Receiver
```

### Message Storage
- **Recent messages**: Cassandra (high write throughput, time-series)
- **Media**: S3 + CDN
- Message ID: Snowflake (time-ordered, unique)

### Delivery Receipts
- Sent: Message stored in server
- Delivered: Receiver's device acknowledged
- Read: Receiver opened conversation

### Group Chat
- Message sent to group → fan-out to all members
- For large groups: async fan-out via message queue

### Online Status
- Heartbeat every 5 seconds
- Store last_seen in Redis with TTL
- Presence service broadcasts status changes to friends

---

## 4. YouTube / Netflix (Video Streaming)

### Requirements
- Functional: Upload video, stream video, search, recommendations
- Non-functional: 500 hours uploaded/minute, billions of views/day

### Video Upload Flow
```
Client → Upload Service → Raw Storage (S3)
                       → Message Queue
                       → Transcoding Service (multiple resolutions/formats)
                       → Processed Storage (S3)
                       → CDN
                       → Metadata DB (update status)
```

### Video Streaming
- **Adaptive Bitrate Streaming (ABR)**: Client switches quality based on bandwidth
- **HLS / DASH**: Video split into small segments (2–10 seconds)
- CDN serves segments from edge closest to user
- Client player requests next segment before current ends

### Storage
- Video files: S3 (object storage)
- Metadata: MySQL (video info, user data)
- Comments: Cassandra
- View counts: Redis (approximate, batch flush to DB)
- Search index: Elasticsearch

### Recommendations
- Collaborative filtering (users who watched X also watched Y)
- Content-based filtering (similar tags, categories)
- Offline ML pipeline → precompute recommendations → store in Redis

---

## 5. Rate Limiter

### Requirements
- Limit requests per user/IP per time window
- Distributed (multiple API servers)
- Low latency overhead

### Algorithm: Sliding Window Counter (Redis)
```python
def is_allowed(user_id, limit=100, window=60):
    key = f"rate:{user_id}"
    now = time.time()
    window_start = now - window
    
    pipe = redis.pipeline()
    pipe.zremrangebyscore(key, 0, window_start)  # remove old entries
    pipe.zadd(key, {str(now): now})              # add current request
    pipe.zcard(key)                               # count requests
    pipe.expire(key, window)                      # set TTL
    results = pipe.execute()
    
    return results[2] <= limit
```

### Architecture
```
Client → API Gateway (rate limit check) → Backend Services
                    ↓
              Redis Cluster (counters)
```

### Rules Engine
- Different limits per endpoint, user tier, API key
- Store rules in config service or DB
- Cache rules in memory with periodic refresh

---

## 6. Notification System

### Requirements
- Functional: Push notifications, email, SMS
- Non-functional: 10M notifications/day, at-least-once delivery

### Architecture
```
Event Sources → Notification Service → Message Queue
                                    → Push Worker (FCM/APNs)
                                    → Email Worker (SendGrid/SES)
                                    → SMS Worker (Twilio)
```

### Components
- **Notification Service**: Validates, enriches, routes notifications
- **Message Queue**: Decouples and buffers (Kafka per channel)
- **Workers**: Channel-specific delivery (retry on failure)
- **Template Service**: Personalized message rendering
- **User Preference Service**: Respect opt-outs, quiet hours, channel preferences

### Reliability
- Retry with exponential backoff
- DLQ for failed notifications
- Idempotency key to prevent duplicates on retry
- Track delivery status in DB

---

## 7. Distributed Cache (Redis Cluster)

### Requirements
- High availability, low latency, horizontal scaling

### Architecture
- Consistent hashing across N shards
- Each shard: 1 primary + 2 replicas
- Automatic failover (Redis Sentinel or Cluster mode)

### Cache Warming
- On startup, pre-populate cache from DB
- Prevents thundering herd on cold start

### Eviction
- LRU policy for general cache
- TTL for session data
- Monitor hit rate; if < 80%, investigate access patterns

---

## 8. Design a Key-Value Store

### Requirements
- Get(key), Put(key, value), Delete(key)
- High availability, eventual consistency

### Storage Engine
- **LSM Tree** (Log-Structured Merge Tree): Optimized for writes
  - Write to in-memory memtable
  - Flush to SSTable on disk when full
  - Background compaction merges SSTables
  - Used in: Cassandra, RocksDB, LevelDB

- **B-Tree**: Optimized for reads
  - In-place updates
  - Used in: MySQL InnoDB, PostgreSQL

### Replication
- Leaderless with quorum (W=2, R=2, N=3)
- Gossip protocol for failure detection
- Vector clocks for conflict detection

### Bloom Filter
- Probabilistic data structure
- Check if key exists before disk lookup
- False positives possible, false negatives impossible
- Reduces unnecessary disk reads for non-existent keys

---

## Interview Tips

- **Don't jump to solution** — spend time on requirements and estimation
- **Draw diagrams** — boxes and arrows, label data flows
- **Justify every choice** — "I chose Cassandra because we need high write throughput and time-series access pattern"
- **Proactively discuss failure modes** — what if the cache goes down? What if a DB shard fails?
- **Scale incrementally** — start simple, then add complexity as scale demands
