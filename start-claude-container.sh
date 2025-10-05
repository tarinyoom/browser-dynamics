#!/usr/bin/env bash

podman build -t sph-dev:fedora42 .

podman run \
  --rm -it \
  --userns=keep-id \
  --workdir /work \
  --mount type=bind,source="$HOME/.local/share/claude",target=/home/dev/.local/share/claude,rw,Z \
  --mount type=bind,source="$HOME/.local/state/claude",target=/home/dev/.local/state/claude,rw,Z \
  --mount type=bind,source="$HOME/.local/bin/claude",target=/home/dev/.local/bin/claude,rw,Z \
  --mount type=bind,source="$HOME/.claude",target=/home/dev/.claude,rw,Z \
  --mount type=bind,source="$HOME/.claude.json",target=/home/dev/.claude.json,rw,Z \
  --mount type=bind,source="$PWD",target=/work,rw,Z \
  sph-dev:fedora42 bash
