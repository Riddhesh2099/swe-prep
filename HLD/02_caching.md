# Caching — Redis, CDN, Eviction, Invalidation

---

## 1. Why Cache?

- Reduce latency (memory access ~100ns vs DB ~10ms)
- Reduce load on databases and downstream services
- Improve throughput and scalability
- Rule of thumb: cache data that is **read frequently** and **changes infrequently**

---

## 2. Cache Write Strategies

### Write-Through
- Write to cache AND database simultaneously
- **Pros**: Cache always consistent with DB, no data loss on crash
- **Cons**: Higher write latency (two writes), cache may store data never read again
- **Use when**: Read-heavy workloads where consistency matters

### Write-Back (Write-Behind)
- Write to cache only; async write to DB later
- **Pros**: Low write latency, batching possible
- **Cons**: Risk of data loss if cache crashes before DB write
- **Use when**: Write-heavy workloads, can tolerate some data loss (e.g., analytics counters)

### Write-Around
- Write directly to DB, bypass cache
- Cache is populated only on read (cache miss)
- **Pros**: Cache not polluted with write-once data
- **Cons**: First read always a cache miss (higher latency)
- **Use when**: Data written once and rarely read (e.g., log files)

---

## 3. Cache Read Strategies

### Cache-Aside (Lazy Loading)
- Application checks cache first
- On miss: fetch from DB, populate cache, return data
- Most common pattern
```
data = cache.get(key)
if data is None:
    data = db.query(key)
    cache.set(key, data, ttl=300)
return data
```
- **Pros**: Only requested data is cached, resilient to cache failure
- **Cons**: Cache miss penalty (3 trips), potential stale data

### Read-Through
- Cache sits in front of DB
- On miss: cache fetches from DB automatically
- Application only talks to cache
- **Pros**: Simpler application code
- **Cons**: Cache miss still slow, cold start problem

---

## 4. Cache Eviction Policies

| Policy | Description | Best For |
|---|---|---|
| LRU (Least Recently Used) | Evict least recently accessed item | General purpose, temporal locality |
| LFU (Least Frequently Used) | Evict least frequently accessed item | Popularity-based access patterns |
| FIFO | Evict oldest inserted item | Simple, queue-like workloads |
| Random | Evict random item | Simple, low overhead |
| TTL (Time-To-Live) | Evict after fixed time | Data with known staleness window |

**Redis default**: LRU (configurable)

---

## 5. Cache Invalidation

The hardest problem in caching. Three main strategies:

### TTL-Based Expiry
- Set a time-to-live on every cache entry
- Simple, automatic, but data can be stale up to TTL duration
- Good default for most use cases

### Event-Driven Invalidation
- When DB is updated, explicitly delete/update cache entry
- More complex but more accurate
- Risk: race conditions between cache delete and next read

### Cache-Aside with Version/ETag
- Store version number with cached data
- On read, compare version with DB; invalidate if mismatch
- More consistent but adds complexity

### Write-Through Invalidation
- Always update cache on write
- Keeps cache fresh but adds write latency

---

## 6. Redis

### Data Structures
| Type | Use Case |
|---|---|
| String | Simple key-value, counters, session tokens |
| Hash | User profiles, object fields |
| List | Message queues, activity feeds (ordered) |
| Set | Unique tags, friend lists, deduplication |
| Sorted Set (ZSet) | Leaderboards, rate limiting, priority queues |
| Bitmap | Feature flags, user activity tracking |
| HyperLogLog | Approximate unique count (e.g., unique visitors) |
| Streams | Event log, message queue with consumer groups |

### Redis for Rate Limiting
```
# Sliding window using sorted set
ZADD user:123:requests <timestamp> <request_id>
ZREMRANGEBYSCORE user:123:requests 0 <window_start>
count = ZCARD user:123:requests
if count > limit: reject
```

### Redis for Distributed Locking (Redlock)
- Use `SET key value NX PX <ttl>` for atomic lock acquisition
- Release only if value matches (prevents releasing another client's lock)
- Redlock algorithm uses majority of N Redis nodes for safety

### Redis Persistence
- **RDB (Snapshot)**: Periodic snapshots to disk. Fast restart, some data loss possible.
- **AOF (Append-Only File)**: Log every write. Slower but more durable.
- **Both**: Use RDB for backups, AOF for durability

### Redis Cluster
- Shards data across multiple nodes using consistent hashing (16384 hash slots)
- Each shard has primary + replicas
- Automatic failover if primary fails

---

## 7. CDN (Content Delivery Network)

### What it does
- Caches static assets (images, JS, CSS, videos) at edge servers geographically close to users
- Reduces latency, offloads origin server traffic

### Push vs Pull CDN
| | Push CDN | Pull CDN |
|---|---|---|
| How | You upload content to CDN proactively | CDN fetches from origin on first request |
| Best for | Large files, predictable content | Dynamic content, unpredictable access |
| Example | Uploading a new video | News article images |

### Cache-Control Headers
- `Cache-Control: max-age=86400` — cache for 1 day
- `Cache-Control: no-cache` — must revalidate with origin
- `Cache-Control: no-store` — never cache (sensitive data)
- `ETag` — version identifier for conditional requests

---

## 8. Common Caching Problems

### Cache Stampede (Thundering Herd)
- Many requests hit DB simultaneously when a popular cache entry expires
- **Solutions**:
  - Mutex/lock: only one request fetches from DB, others wait
  - Probabilistic early expiry: randomly refresh before TTL expires
  - Background refresh: async refresh before expiry

### Cache Penetration
- Requests for data that doesn't exist in DB or cache (e.g., invalid IDs)
- Cache never populated, DB hammered
- **Solutions**:
  - Cache null results with short TTL
  - Bloom filter to check existence before DB query

### Cache Avalanche
- Many cache entries expire at the same time → DB overwhelmed
- **Solutions**:
  - Add random jitter to TTL values
  - Stagger cache population
  - Circuit breaker on DB

---

## Interview Tips

- Always mention **TTL** when discussing caching — interviewers want to see you think about staleness
- For any system with high read traffic, proactively suggest caching
- Discuss **what to cache** (hot data), **where** (client, CDN, app server, DB), and **invalidation strategy**
- At senior level: discuss cache consistency trade-offs and failure modes (stampede, avalanche)
