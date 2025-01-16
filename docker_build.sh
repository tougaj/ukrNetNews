#!/usr/bin/env bash

sudo docker image prune -f
sudo docker build -t ukrnet_loader .
