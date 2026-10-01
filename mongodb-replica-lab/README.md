# MongoDB Replica Set Lab (`mongodb-replica-lab`)

This hands-on lab provisions a 3-node MongoDB Replica Set (`rs0`) using Docker Compose to demonstrate data redundancy, write concerns, and automatic failover.

---

## 1. Architecture

- **`mongo1`**: Port `27017` (Candidate Primary)
- **`mongo2`**: Port `27018` (Secondary)
- **`mongo3`**: Port `27019` (Secondary)
- **Replica Set Name**: `rs0`

---

## 2. Quick Start

### Step 1: Start the Containers
```bash
docker compose up -d
```

### Step 2: Initialize the Replica Set
Connect to `mongo1` and initialize `rs0`:
```bash
docker exec -it mongo1 mongosh
```
```javascript
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017" },
    { _id: 1, host: "mongo2:27017" },
    { _id: 2, host: "mongo3:27017" }
  ]
})
```
Alternatively, execute the automated script:
```bash
docker exec -i mongo1 mongosh < scripts/init-replica.js
```

### Step 3: Verify Status
```javascript
rs.status()
```

---

## 3. Hands-on Experiments

### Experiment A: Write with Majority Concern
```javascript
use testdb

db.inventory.insertOne(
  { item: "laptop", qty: 25 },
  { writeConcern: { w: "majority" } }
)

db.inventory.find()
```

### Experiment B: Test Automatic Failover
1. Stop the current primary container (`mongo1`):
   ```bash
   docker stop mongo1
   ```
2. Connect to `mongo2` or `mongo3`:
   ```bash
   docker exec -it mongo2 mongosh
   ```
3. Run `rs.status()` to verify that either `mongo2` or `mongo3` has been automatically elected as the new `PRIMARY`.
4. Restart `mongo1`:
   ```bash
   docker start mongo1
   ```
5. Observe `mongo1` rejoin as a `SECONDARY` and catch up with oplog sync.

---

## 4. Teardown
```bash
docker compose down -v
```
Or run:
```bash
bash scripts/cleanup.sh
```
