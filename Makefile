# Makefile for Datadog RUM Proxy Docker image

# Set these variables as needed
IMAGE ?= datadog-rum-proxy
TAG ?= latest
DOCKERHUB_USER ?= <your-dockerhub-username>

.PHONY: build
build:
	docker build -t $(IMAGE):$(TAG) .

.PHONY: push
push:
	@if [ "$(DOCKERHUB_USER)" = "<your-dockerhub-username>" ]; then \
	  echo "Please set DOCKERHUB_USER to your Docker Hub username."; \
	  exit 1; \
	fi
	docker tag $(IMAGE):$(TAG) $(DOCKERHUB_USER)/$(IMAGE):$(TAG)
	docker push $(DOCKERHUB_USER)/$(IMAGE):$(TAG)

.PHONY: login
login:
	docker login

# Usage:
#   make login                # Log in to Docker Hub
#   make build                # Build the Docker image
#   make push DOCKERHUB_USER=youruser [TAG=tag] [IMAGE=image] 