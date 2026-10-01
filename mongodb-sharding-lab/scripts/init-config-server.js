// Initialize configRS Replica Set for Config Server
rs.initiate({
  _id: "configRS",
  configsvr: true,
  members: [
    { _id: 0, host: "config:27017" }
  ]
});
