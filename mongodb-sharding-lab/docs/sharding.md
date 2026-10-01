# MongoDB Sharding: Step-by-Step Practical Guide

This guide walks through the exact commands required to initialize a sharded cluster, enable sharding, insert data, and manually split/move chunks for better understanding of data distribution.

## 1. Initialize the Replica Sets

Before configuring the router (`mongos`), you must initialize the Config Server and all Shards.

**Initialize Config Server:**
```bash
docker exec -it config mongosh
```
```javascript
rs.initiate({ _id: "configRS", configsvr: true, members: [{ _id: 0, host: "config:27017" }] })
exit
```

**Initialize Shard 1:**
```bash
docker exec -it shard1a mongosh
```
```javascript
rs.initiate({
  _id: "shard1RS",
  members: [
    { _id: 0, host: "shard1a:27017" },
    { _id: 1, host: "shard1b:27017" },
    { _id: 2, host: "shard1c:27017" }
  ]
})
exit
```

**Initialize Shard 2:**
```bash
docker exec -it shard2a mongosh
```
```javascript
rs.initiate({
  _id: "shard2RS",
  members: [
    { _id: 0, host: "shard2a:27017" },
    { _id: 1, host: "shard2b:27017" },
    { _id: 2, host: "shard2c:27017" }
  ]
})
exit
```

---

## 2. Add Shards to the Cluster

Once replica sets are running, connect to the query router (`mongos`) and add the shards. **All remaining commands will be run inside `mongos`.**

```bash
docker exec -it mongos mongosh
```
```javascript
// Add both shards to the cluster
sh.addShard("shard1RS/shard1a:27017,shard1b:27017,shard1c:27017")
sh.addShard("shard2RS/shard2a:27017,shard2b:27017,shard2c:27017")

// Verify they were added
sh.status()
```

---

## 3. Enable Sharding and Set Up the Collection

We will create a database called `ecommerce` and shard the `orders` collection based on `orderId`.

```javascript
// Enable sharding on the 'ecommerce' database
sh.enableSharding("ecommerce")

// Create an index on the intended shard key (required before sharding)
use ecommerce
db.orders.createIndex({ orderId: 1 })

// Shard the collection using 'orderId' as the shard key
sh.shardCollection("ecommerce.orders", { orderId: 1 })
```

---

## 4. Insert Seed Data

Let's insert some dummy data to populate the chunks.

```javascript
use ecommerce

// Insert 100,000 dummy documents
var bulk = db.orders.initializeUnorderedBulkOp();
for (var i = 1; i <= 100000; i++) {
    bulk.insert({ orderId: i, product: "Item_" + i, amount: Math.random() * 100 });
}
bulk.execute();
```

---

## 5. Splitting Chunks

Initially, MongoDB puts all data into a single chunk on a single primary shard (e.g., `shard2RS`). We can manually split this chunk at `orderId = 50000`.

```javascript
// Split the chunk exactly at orderId: 50000
sh.splitAt("ecommerce.orders", { orderId: 50000 })
```

**Note:** Splitting a chunk just creates two logical chunks (MinKey → 50000 and 50000 → MaxKey) on the *same* shard. It doesn't move the data.

---

## 6. Moving Chunks (Data Distribution)

To physically distribute the data across your shards, we must move one of those chunks to the other shard.

```javascript
// Move the chunk that contains orderId: 50000 to shard1RS
sh.moveChunk(
    "ecommerce.orders",
    { orderId: 50000 },
    "shard1RS"
)
```

---

## 7. Verify Data Distribution

After moving the chunk, verify that the data is now split physically across both shards.

**Check Shard Distribution:**
```javascript
use ecommerce
db.orders.getShardDistribution()
```
*You should see output indicating that chunks and data size are now divided between `shard1RS` and `shard2RS`.*

**Query Routing:**
When you query specific `orderId`s, the `mongos` router instantly knows which shard holds the data:
```javascript
// This goes to the shard holding MinKey -> 50000
db.orders.findOne({ orderId: 10000 })

// This goes to the shard holding 50000 -> MaxKey
db.orders.findOne({ orderId: 75000 })
```

**Check Chunk Metadata:**
To see exactly how MongoDB sees the chunks internally:
```javascript
use config

// Find chunks for the ecommerce.orders collection
db.collections.findOne({ _id: "ecommerce.orders" })
// Note the uuid from the output above, and use it below:

db.chunks.find({
    uuid: UUID("<replace-with-uuid-from-above>")
}).sort({
    "min.orderId": 1
}).pretty()
```
