# Replication in Sharded Clusters

How replication integrates into sharding to provide high availability per shard.

---

## 1. Why Every Shard Must Be a Replica Set

In MongoDB, **sharding provides horizontal scaling**, while **replication provides fault tolerance and high availability**.

Without replication, if a single shard host crashes, the data stored on that shard becomes completely unavailable, causing incomplete query results or total cluster errors.

```
+-------------------------------------------------------------+
|                     MongoDB Sharded Cluster                 |
|                                                             |
|   Shard 1 (shard1RS)                   Shard 2 (shard2RS)   |
|   +-----------------------+            +------------------+ |
|   | Primary:   shard1a    |            | Primary: shard2a | |
|   | Secondary: shard1b    |            | Secondary:shard2b| |
|   | Secondary: shard1c    |            | Secondary:shard2c| |
|   +-----------------------+            +------------------+ |
|                                                             |
+-------------------------------------------------------------+
```

---

## 2. Config Server Replication (`configRS`)

The Config Server stores the entire cluster's state:
- Chunk ranges and their shard mappings.
- Routing tables and version epochs.
- Collection partition flags.

In production, `configRS` is deployed as a 3-member replica set to ensure metadata resilience. In this lab, it runs with `--configsvr --replSet configRS`.

---

## 3. Shard Replication (`shard1RS` & `shard2RS`)

Each shard is configured with `--shardsvr --replSet <RS_NAME>`.

- **Write Flow**: Writes for a chunk routed to `shard1RS` are sent by `mongos` to `shard1a` (the Primary).
- **Oplog Replication**: `shard1b` and `shard1c` continuously tail `shard1a`'s oplog and apply changes.
- **Failover**: If `shard1a` is stopped or fails, `shard1b` and `shard1c` elect a new Primary automatically. `mongos` automatically discovers the new Primary without downtime.
