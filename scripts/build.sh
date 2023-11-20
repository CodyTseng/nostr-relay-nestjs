#!/bin/bash 

GIT_COMMIT_SHA=$(git log -1 --pretty=%h)
REPO="nostr-relay-nestjs:"
TAG="$REPO$GIT_COMMIT_SHA"
LATEST="${REPO}latest"
docker build -t "$TAG" -t "$LATEST" --build-arg GIT_COMMIT_SHA="$GIT_COMMIT_SHA" . 