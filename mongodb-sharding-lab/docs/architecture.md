# Sharded Cluster Architecture

A comprehensive technical architecture document for the MongoDB Sharding Lab.

---

## 1. Topological Diagram

```
                                  +-----------------------+
                                  | Client / mongosh CLI  |
                                  +-----------+-----------+
                                              |
                                              | Connects on port 27020
                                              v
                                  +-----------------------+
                                  |     mongos (Router)   |
                                  +-----------+-----------+
                                              |
                      +-----------------------+-----------------------+
                      |                                               |
             Fetches cluster metadata                        Routes data reads/writes
                      |                                               |
                      v                                               v
        +---------------------------+                +---------------------------------+
        |   Config Server (config)  |                |         Sharded Storage         |
        |   Replica Set: configRS   |                +----------------+----------------+
        |   Port: 27023             |                                 |
        +---------------------------+                                 |
                                             +------------------------+------------------------+
                                             |                                                 |
                                             v                                                 v
                              +-----------------------------+                   +-----------------------------+
                              |        Shard 1 (shard1RS)   |                   |        Shard 2 (shard2RS)   |
                              +-----------------------------+                   +-----------------------------+
                              | Primary:   shard1a (27021)  |                   | Primary:   shard2a (27022)  |
                              | Secondary: shard1b (27024)  |                   | Secondary: shard2b (27026)  |
                              | Secondary: shard1c (27025)  |                   | Secondary: shard2c (27027)  |
                              +-----------------------------+                   +-----------------------------+
```

---

## 2. Component Specifications

### 1. `mongos` Query Router
- **Role**: Entry point for all client requests.
- **Port**: Host `27020` $\rightarrow$ Container `27017`.
- **Command**: `mongos --configdb configRS/config:27017 --bind_ip_all`.
- **Characteristics**: Stateless; does not hold persistent data. Caches routing metadata from the Config Server in memory.

### 2. Config Server (`config`)
- **Role**: Authoritative catalog for cluster metadata, shard boundaries, and chunk mappings.
- **Port**: Host `27023` $\rightarrow$ Container `27017`.
- **Command**: `mongod --configsvr --replSet configRS --port 27017 --bind_ip_all`.

### 3. Shard 1 Replica Set (`shard1RS`)
- **Members**:
  - `shard1a` (Port `27021`)
  - `shard1b` (Port `27024`)
  - `shard1c` (Port `27025`)
- **Command**: `mongod --shardsvr --replSet shard1RS --port 27017 --bind_ip_all`.

### 4. Shard 2 Replica Set (`shard2RS`)
- **Members**:
  - `shard2a` (Port `27022`)
  - `shard2b` (Port `27026`)
  - `shard2c` (Port `27027`)
- **Command**: `mongod --shardsvr --replSet shard2RS --port 27017 --bind_ip_all`.

---

## 3. Data Routing Lifecycle

1. **Client Request**: Client queries `db.orders.find({ orderId: 75000 })`.
2. **Metadata Lookup**: `mongos` inspects the cached routing table for collection `ecommerce.orders`.
3. **Chunk Matching**: Finds that `orderId: 75000` falls within range `[50000, MaxKey)`.
4. **Targeted Dispatch**: Dispatches the query directly to `shard1RS` (the shard owning that chunk range).
5. **Replica Set Execution**: Primary of `shard1RS` executes query and returns data to `mongos`.
6. **Response**: `mongos` returns results to client transparently.
