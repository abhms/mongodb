#!/bin/bash
set -e

echo "Stopping and removing MongoDB Replica Set containers and volumes..."
docker compose down -v
echo "Cleanup completed successfully."
