#!/bin/sh
set -eu

persistent_root="${PROTOTYPE_PERSISTENT_ROOT:-/data}"
mkdir -p "$persistent_root"
chown nextjs:nodejs "$persistent_root"

exec runuser -u nextjs -- "$@"
