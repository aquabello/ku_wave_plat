#!/bin/bash

case "$1" in
  api)
    pnpm --filter @ku/api start:dev
    ;;
  console)
    pnpm --filter @ku/console dev
    ;;
  nfc)
    pnpm --filter @ku/nfc dev
    ;;
  all)
    pnpm dev
    ;;
  *)
    echo "Usage: ./dev.sh [api|console|nfc|all]"
    ;;
esac
