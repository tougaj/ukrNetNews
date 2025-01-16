#!/usr/bin/env bash

sudo docker run --rm -it -v ./output/:/app/output -e SECTIONS="main russianaggression politics" ukrnet_loader
