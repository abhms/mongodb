# MongoDB Sharding Lab (`mongodb-sharding-lab`)

This hands-on lab deploys an 8-container production-style MongoDB Sharded Cluster using Docker Compose.

---

## 1. Cluster Components

| Component | Container Name(s) | Replica Set Name | Host Port | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Config Server** | `config` | `configRS` | `27023` | Stores cluster metadata & chunk routing |
| **Mongos Router** | `mongos` | N/A | `27020` | Stateless query router for client connections |
| **Shard 1 (3-node RS)** | `shard1a`, `shard1b`, `shard1c` | `shard1RS` | `27021`, `27024`, `27025` | Data partition 1 |
| **Shard 2 (3-node RS)** | `shard2a`, `shard2b`, `shard2c` | `shard2RS` | `27022`, `27026`, `27027` | Data partition 2 |

---

## 2. Fast-Start Execution

### Step 1: Start All 8 Containers
```bash
docker compose up -d
```

### Step 2: Initialize Config Server & Shards
```bash
# Initialize Config Server (configRS)
docker exec -i config mongosh < scripts/init-config-server.js

# Initialize Shard 1 (shard1RS) & Shard 2 (shard2RS)
docker exec -i shard1a mongosh --eval 'rs.initiate({ _id: "shard1RS", members: [{ _id: 0, host: "shard1a:27017" }, { _id: 1, host: "shard1b:27017" }, { _id: 2, host: "shard1c:27017" }] })'
docker exec -i shard2a mongosh --eval 'rs.initiate({ _id: "shard2RS", members: [{ _id: 0, host: "shard2a:27017" }, { _id: 1, host: "shard2b:27017" }, { _id: 2, host: "shard2c:27017" }] })'
```

### Step 3: Add Shards to Cluster & Enable Sharding
```bash
# Add Shards to mongos
docker exec -i mongos mongosh < scripts/add-shards.js

# Enable sharding and shard collection
docker exec -i mongos mongosh < scripts/enable-sharding.js
```

### Step 4: Seed 100,000 Documents
```bash
docker exec -i mongos mongosh < scripts/seed-data.js
```

---

## 3. Authentication & Security

This cluster is configured to require authentication. To enable this securely between nodes, we use a shared `mongo-keyfile` generated and mapped into all 8 containers.

### Keyfile Setup (Done)
1. **Generate the keyfile**:
   ```bash
   openssl rand -base64 756 > data/mongo-keyfile
   chmod 400 data/mongo-keyfile
   ```
2. **Configuration**: The `docker-compose.yml` mounts this file to `/data/mongo-keyfile` and starts all processes with the `--keyFile` flag, which inherently enables `--auth`.
3. **Security**: `mongo-keyfile` is added to `.gitignore` so the sensitive key is never committed to source control.

### Connecting with Auth
To connect securely from your terminal or Compass:
```text
mongodb://admin:StrongAdminPassword@localhost:27020/admin?authSource=admin
```

---

## 4. In-Depth Documentation

For the full hands-on walkthroughs and conceptual deep-dives, see:
- [`docs/architecture.md`](docs/architecture.md) — Comprehensive visual topology and data flow.
- [`docs/replication.md`](docs/replication.md) — Replication mechanics within each shard.
- [`docs/sharding.md`](docs/sharding.md) — Chunk splitting, manual chunk migration, scatter-gather vs targeted queries, and cheat sheets.

---

## 5. Teardown
```bash
docker compose down -v
```
