#!/usr/bin/env bash

pm2 start "node dist/ptLoader.js -l" --name ukrNetLoader --restart-delay 300000 --time
