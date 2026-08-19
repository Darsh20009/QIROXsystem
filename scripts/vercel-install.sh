#!/usr/bin/env bash
# yarn avoids the "Exit handler never called!" npm v10 bug
# that occurs on Linux/macOS with packages that have native bindings (canvas, bcrypt)
set -u

for attempt in 1 2 3; do
  rm -rf node_modules

  if yarn install --ignore-scripts --non-interactive --network-timeout 300000; then
    echo "Dependencies installed successfully on attempt ${attempt}"
    exit 0
  fi

  echo "Dependency install attempt ${attempt} failed; retrying..."
  sleep 5
done

echo "Dependencies could not be installed after 3 attempts"
exit 1
