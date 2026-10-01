// Add Shard 1 and Shard 2 to the cluster via mongos
sh.addShard("shard1RS/shard1a:27017,shard1b:27017,shard1c:27017");
sh.addShard("shard2RS/shard2a:27017,shard2b:27017,shard2c:27017");

print("Shards added. Current Cluster Status:");
sh.status();
