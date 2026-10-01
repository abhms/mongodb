// Commands for initializing shard1RS and shard2RS
// Run inside shard1a:
// rs.initiate({ _id: "shard1RS", members: [{ _id: 0, host: "shard1a:27017" }, { _id: 1, host: "shard1b:27017" }, { _id: 2, host: "shard1c:27017" }] });

// Run inside shard2a:
// rs.initiate({ _id: "shard2RS", members: [{ _id: 0, host: "shard2a:27017" }, { _id: 1, host: "shard2b:27017" }, { _id: 2, host: "shard2c:27017" }] });

print("To initialize shard1RS, run on shard1a:");
print('rs.initiate({ _id: "shard1RS", members: [{ _id: 0, host: "shard1a:27017" }, { _id: 1, host: "shard1b:27017" }, { _id: 2, host: "shard1c:27017" }] })');

print("To initialize shard2RS, run on shard2a:");
print('rs.initiate({ _id: "shard2RS", members: [{ _id: 0, host: "shard2a:27017" }, { _id: 1, host: "shard2b:27017" }, { _id: 2, host: "shard2c:27017" }] })');
