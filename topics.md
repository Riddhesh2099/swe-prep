# Topics to Cover — Senior SWE Interview

---

## 1. Data Structures & Algorithms

### Patterns to Master
| Pattern | Key Problems |
|---|---|
| Sliding Window | Longest substring without repeat, Max sum subarray |
| Two Pointers | 3Sum, Container with most water |
| Fast & Slow Pointers | Linked list cycle, Middle of list |
| Merge Intervals | Merge intervals, Insert interval |
| Cyclic Sort | Find missing number, Find duplicate |
| BFS / DFS | Level order traversal, Number of islands |
| Binary Search | Search rotated array, Find minimum in rotated |
| Dynamic Programming | Coin change, Longest common subsequence, Edit distance |
| Backtracking | Subsets, Permutations, Word search |
| Heap / Top-K | K closest points, Top K frequent elements |
| Trie | Word search II, Implement Trie |
| Graph | Course schedule, Clone graph, Dijkstra |
| Union-Find | Number of connected components, Redundant connection |

### Complexity
- Know time and space complexity for every solution
- Be able to optimize from brute force → better → optimal

---

## 2. System Design (HLD)

### Core Concepts
- **Scalability**: Horizontal vs vertical, stateless services
- **Load Balancing**: Round robin, least connections, consistent hashing
- **Caching**: Write-through, write-back, write-around, eviction policies (LRU, LFU)
- **Databases**:
  - SQL: ACID, indexing, joins, normalization
  - NoSQL: DynamoDB, Cassandra, MongoDB — when to use each
  - Sharding strategies: range, hash, directory-based
  - Replication: leader-follower, multi-leader, leaderless
- **CAP Theorem**: Consistency vs Availability vs Partition tolerance
- **Message Queues**: Kafka (partitions, offsets, consumer groups), SQS, RabbitMQ
- **API Design**: REST best practices, gRPC, pagination, versioning
- **Rate Limiting**: Token bucket, leaky bucket, sliding window counter
- **CDN**: Push vs pull, edge caching
- **Consistent Hashing**: Virtual nodes, ring-based routing
- **Distributed Transactions**: 2PC, Saga pattern
- **Search**: Elasticsearch, inverted index
- **Blob Storage**: S3, object storage patterns

### Systems to Design (Practice These)
1. URL Shortener (TinyURL)
2. Twitter / News Feed (fan-out on write vs read)
3. WhatsApp / Chat System (WebSockets, message delivery guarantees)
4. YouTube / Netflix (video upload, streaming, CDN)
5. Uber / Lyft (geospatial indexing, matching, surge pricing)
6. Rate Limiter (distributed, Redis-based)
7. Distributed Cache (Redis cluster, eviction)
8. Search Autocomplete (Trie, top-K, caching)
9. Notification System (push, email, SMS, fan-out)
10. Distributed Job Scheduler (cron, priority queues, fault tolerance)
11. Key-Value Store (LSM tree, SSTables, compaction)
12. Web Crawler (BFS, politeness, deduplication)

### Framework for Answering
1. Clarify requirements (functional + non-functional)
2. Estimate scale (QPS, storage, bandwidth)
3. Define API endpoints
4. Design data model / schema
5. High-level architecture diagram
6. Deep dive into 1–2 components
7. Discuss trade-offs and bottlenecks

---

## 3. Low Level Design (OOD)

### SOLID Principles
- **S** — Single Responsibility
- **O** — Open/Closed
- **L** — Liskov Substitution
- **I** — Interface Segregation
- **D** — Dependency Inversion

### Design Patterns to Know
| Pattern | Use Case |
|---|---|
| Singleton | Config manager, Logger |
| Factory / Abstract Factory | Object creation without specifying class |
| Builder | Complex object construction |
| Observer | Event systems, pub/sub |
| Strategy | Interchangeable algorithms |
| Decorator | Add behaviour without subclassing |
| Adapter | Interface compatibility |
| Command | Undo/redo, task queues |
| Proxy | Lazy loading, access control |

### LLD Problems to Practice
- Parking Lot
- Library Management System
- Elevator System
- Chess / Snake and Ladder
- Hotel Booking System
- Food Delivery (Zomato/Swiggy)
- Splitwise / Expense Sharing

---

## 4. Behavioral / Leadership

### STAR Method
- **S**ituation — Set the context briefly
- **T**ask — What was your responsibility
- **A**ction — What YOU specifically did (use "I", not "we")
- **R**esult — Quantified outcome

### Stories to Prepare (map to your experience)
| Theme | Your Story Candidate |
|---|---|
| Most impactful project | Oracle Email Notifications (591 → 4000+ contacts) |
| Technical challenge | Dunston lazy parser (5x speed improvement) |
| Failure and learning | (pick one from your experience) |
| Conflict resolution | (cross-team coordination at Amazon/Oracle) |
| Leadership / influence | mhs-ai demo to service owner |
| Ambiguity | APEX team — new payment integrations |
| Mentoring | (if applicable) |

### Common Questions
- Tell me about yourself
- Why are you leaving your current role?
- Tell me about your most impactful project
- Tell me about a time you disagreed with your manager
- Tell me about a time you failed
- How do you handle competing priorities?
- Tell me about a time you influenced without authority
- Where do you see yourself in 5 years?

---

## 5. Resources

### Books
- *System Design Interview Vol 1 & 2* — Alex Xu ([ByteByteGo](https://bytebytego.com))
- *Designing Data-Intensive Applications* — Martin Kleppmann
- *Clean Code* — Robert C. Martin
- *The Pragmatic Programmer* — Hunt & Thomas

### Online Platforms
- [NeetCode.io](https://neetcode.io) — Best structured DSA roadmap
- [LeetCode](https://leetcode.com) — DSA practice
- [HelloInterview](https://www.hellointerview.com) — System design guides and mocks
- [ByteByteGo YouTube](https://www.youtube.com/@ByteByteGo) — Free system design videos
- [System Design Primer (GitHub)](https://github.com/donnemartin/system-design-primer) — Free comprehensive guide
- [Refactoring Guru](https://refactoring.guru/design-patterns) — Design patterns
- [Pramp](https://www.pramp.com) — Free peer mock interviews
- [Interviewing.io](https://interviewing.io) — Anonymous mock interviews with engineers
- [Excalidraw](https://excalidraw.com) — Diagramming for system design practice

### Blogs & Newsletters
- [The Pragmatic Engineer](https://blog.pragmaticengineer.com) — Engineering career and interviews
- [ByteByteGo Newsletter](https://blog.bytebytego.com) — Weekly system design
- [High Scalability](http://highscalability.com) — Real-world architecture case studies
