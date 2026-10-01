# MongoDB Hands-On Engineering Labs

A structured, production-grade repository for learning, testing, and mastering **MongoDB Replica Sets** and **Sharded Clusters** using Docker.

---

## 📁 Repository Structure

```
mongodb-labs/
├── README.md                          # Master Project Overview & Quick Reference
│
├── docs/                              # Global Concepts & Architecture Theory
│   ├── mongodb-basics.md              # Documents, BSON, Collections & Indexes
│   ├── replica-sets.md                # HA, Oplog, Elections, Read/Write Concerns
│   ├── sharding.md                    # Core Sharding Mechanics, Chunks & Cheat Sheet
│   └── troubleshooting.md             # Common Setup Errors & Debugging Solutions
│
├── mongodb-replica-lab/               # Standalone 3-Node Replica Set Lab
│   ├── docker-compose.yml             # 3-Node mongo cluster (mongo1, mongo2, mongo3)
│   ├── README.md                      # Lab Guide & Failover Experiments
│   ├── data/                          # Data directory
│   └── scripts/
│       ├── init-replica.js            # Replica set initialization script
│       ├── test-failover.js           # Majority write & election verification script
│       └── cleanup.sh                 # Environment reset script
│
└── mongodb-sharding-lab/              # 8-Container Sharded Cluster Lab
    ├── docker-compose.yml             # 2 Shards (3 nodes each) + Config RS + Mongos
    ├── README.md                      # Sharding Lab Guide & Fast-Start Commands
    ├── data/                          # Data directory
    ├── docs/
    │   ├── architecture.md            # Topology & routing data flow
    │   ├── replication.md             # Replication within shards
    │   └── sharding.md                # Chunk splitting, migration & scatter-gather
    └── scripts/
        ├── init-config-server.js      # Config Server replica set initialization
        ├── init-shards.js             # Shard replica sets initialization
        ├── add-shards.js              # Add shards to cluster via mongos
        ├── enable-sharding.js         # Enable DB & collection sharding on orderId
        └── seed-data.js               # Bulk insert 100,000 order documents
```

---

## 🧠 The Sharding Mental Model

Keep this diagram in mind when reasoning about MongoDB distributed queries:

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

1. **Shard Key** determines the chunk routing boundaries.
2. **Chunk** is a range of data assigned to a specific shard.
3. **Shard** is an independent Replica Set (Primary + Secondaries).
4. **Replica Set** guarantees high availability, data redundancy, and automatic failover.

---

## ⚡ Fast-Start Cheat Sheet

### 1. Connect to Router
```bash
docker exec -it mongos mongosh
```

### 2. Enable Sharding & Shard Collection
```javascript
use ecommerce
sh.enableSharding("ecommerce")
db.orders.createIndex({ orderId: 1 })
sh.shardCollection("ecommerce.orders", { orderId: 1 })
```

### 3. Check Distribution & Chunks
```javascript
db.orders.getShardDistribution()
sh.status()
```

### 4. Split & Move Chunks Manually
```javascript
// Split chunk at orderId = 50000
sh.splitAt("ecommerce.orders", { orderId: 50000 })

// Move upper half to shard1RS
sh.moveChunk("ecommerce.orders", { orderId: 50000 }, "shard1RS")
```

---

## 📚 Documentation Index

- [**MongoDB Basics**](docs/mongodb-basics.md)
- [**Replica Sets Deep-Dive**](docs/replica-sets.md)
- [**Sharding Guide & Cheat Sheet**](docs/sharding.md)
- [**Troubleshooting & Error Resolutions**](docs/troubleshooting.md)
- [**Sharding Lab Architecture**](mongodb-sharding-lab/docs/architecture.md)
