# MongoDB Sharding Guide & Cheat Sheet

A comprehensive reference for understanding, configuring, and operating MongoDB Sharded Clusters.

---

## 1. The Sharding Architecture & Mental Model

Sharding partitions large collections across multiple independent replica sets (shards) to achieve horizontal scalability for both storage and throughput.

```
                    Application / Client
                             |
                             v
                          mongos (Query Router)
                             |
                    Shard Key: { orderId: 1 }
                             |
                             v
                           Chunk
                        /          \
                       /            \
                      v              v
                 shard1RS        shard2RS
                    |                |
                  P S S            P S S
```

### Core Hierarchy
- **Shard Key** $\rightarrow$ Determines chunk mapping and query routing.
- **Chunk** $\rightarrow$ A contiguous range of shard key values assigned to a specific shard.
- **Shard** $\rightarrow$ A replica set holding a subset of the cluster's chunks.
- **Replica Set** $\rightarrow$ 1 Primary + N Secondaries for high availability.
- **Config Server** $\rightarrow$ Holds cluster metadata, chunk mappings, and routing table.
- **Mongos** $\rightarrow$ Stateless query router that interfaces with clients.

---

## 2. Complete Command Cheat Sheet (In Order of Use)

### Step 1: Connect to `mongos`
From your terminal:
```bash
docker exec -it mongos mongosh
```

---

### Step 2: Switch Database
```javascript
use ecommerce
```

---

### Step 3: Enable Sharding for a Database
```javascript
sh.enableSharding("ecommerce")
```

---

### Step 4: Shard a Collection
Index the shard key field, then shard the collection:
```javascript
// Shard key on orderId
sh.shardCollection(
    "ecommerce.orders",
    { orderId: 1 }
)
```

Check the collection's sharding configuration from the `config` database:
```javascript
use config

db.collections.findOne({
    _id: "ecommerce.orders"
})
```
*You will see `key: { orderId: 1 }` along with the collection's unique UUID.*

---

### Step 5: Insert Test Data
Generate 100,000 orders:
```javascript
use ecommerce

for (let i = 1; i <= 100000; i++) {
    db.orders.insertOne({
        orderId: i,
        userId: i % 10000,
        amount: Math.floor(Math.random() * 10000),
        status: "completed"
    })
}
```

Check total document count:
```javascript
db.orders.countDocuments()
```

---

### Step 6: Check Shard Distribution
```javascript
db.orders.getShardDistribution()
```
*This command displays total data size, document counts, chunk counts, and percentages per shard.*

---

### Step 7: Inspect Chunks
First, retrieve the collection UUID:
```javascript
use config

db.collections.findOne({ _id: "ecommerce.orders" })
// Example output: UUID('f52d69c4-a476-41c4-abcb-1b03f52a3fc2')
```

Then query the chunks table:
```javascript
db.chunks.find({
    uuid: UUID("YOUR_COLLECTION_UUID_HERE")
}).sort({
    "min.orderId": 1
}).pretty()
```
*Shows chunk boundary ranges (`min` and `max`) and their assigned `shard`.*

---

### Step 8: Split a Chunk
Split a chunk at `orderId = 50000`:
```javascript
use ecommerce

sh.splitAt(
    "ecommerce.orders",
    { orderId: 50000 }
)
```

**What happens visually:**
```
Before:
MinKey ─────────────────────────────── MaxKey
               ONE CHUNK (shard2RS)

After:
MinKey ─────────── 50000 ───────────── MaxKey
  Chunk 1 (shard2RS)    Chunk 2 (shard2RS)
```

> **Important Note:** `splitAt()` divides a chunk into two contiguous ranges on the *same* shard. It does **not** move data to another shard automatically unless the balancer triggers or manual migration is initiated.

---

### Step 9: Move a Chunk to Another Shard
Move the chunk containing `orderId = 50000` to `shard1RS`:
```javascript
sh.moveChunk(
    "ecommerce.orders",
    { orderId: 50000 },
    "shard1RS"
)
```

**After migration:**
```
Chunk 1: MinKey -> 50000  ==> shard2RS
Chunk 2: 50000  -> MaxKey ==> shard1RS
```

---

### Step 10: Check Cluster Status
```javascript
sh.status()
```
Displays:
- Shard list & connection strings
- Active mongos instances
- Balancer state
- Database and collection partition status
- Chunk ranges and distribution

---

### Step 11: Targeted Query (Using Shard Key)
Because `orderId` is the shard key, `mongos` routes directly to the specific shard holding that key:
```javascript
use ecommerce

// Routed directly to shard2RS (Chunk: MinKey -> 50000)
db.orders.findOne({ orderId: 10000 })

// Routed directly to shard1RS (Chunk: 50000 -> MaxKey)
db.orders.findOne({ orderId: 75000 })
```

---

### Step 12: Scatter-Gather Query (Without Shard Key)
When querying fields that are **not** part of the shard key:
```javascript
db.orders.find({ userId: 5000 })
```
Because `userId` is not the shard key, `mongos` cannot determine which shard holds matching records. It must query **all shards** and merge the results. This is called a **scatter-gather query**.

---

## 3. Essential Commands Summary

| Task | Command |
| :--- | :--- |
| **Enable Sharding on DB** | `sh.enableSharding("<dbname>")` |
| **Shard Collection** | `sh.shardCollection("<dbname>.<collection>", { <key>: 1 })` |
| **Split Chunk** | `sh.splitAt("<dbname>.<collection>", { <key>: <value> })` |
| **Move Chunk** | `sh.moveChunk("<dbname>.<collection>", { <key>: <value> }, "<shardId>")` |
| **Check Distribution** | `db.<collection>.getShardDistribution()` |
| **Cluster Overview** | `sh.status()` |
| **Inspect Chunks** | `use config; db.chunks.find({ uuid: <uuid> })` |
