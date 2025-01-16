#!/usr/bin/env bash

docker image prune -f
docker build -t ukrnet_loader .
