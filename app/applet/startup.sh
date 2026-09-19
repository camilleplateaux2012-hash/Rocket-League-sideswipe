#!/bin/bash
# startup.sh - Idempotent, non-blocking startup script for the workspace dev server

# Check if the server is already running on port 8080
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/ | grep -q "200" ; then
  echo "Dev server is already up and healthy on 127.0.0.1:8080."
  exit 0
fi

echo "Starting dev server on 127.0.0.1:8080..."
# Run the start command in the background
nohup npm run dev > /app/applet/dev-server.log 2>&1 &

# Wait briefly for server to bind
sleep 3

if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/ | grep -q "200" ; then
  echo "Dev server started successfully!"
else
  echo "Warning: Dev server started but could not verify port 8080. Check /app/applet/dev-server.log."
fi

exit 0
