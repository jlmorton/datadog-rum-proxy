# Datadog RUM Proxy

This project provides a simple proxy for forwarding Datadog Real User Monitoring (RUM) data from browsers to Datadog, following the [official Datadog proxy guide](https://docs.datadoghq.com/real_user_monitoring/guide/proxy-rum-data/?tab=npm).

## Features
- Forwards RUM data from `/d` endpoint to Datadog intake.
- Supports all Datadog sites (US1, US3, US5, EU, Gov, AP1).
- Handles CORS and removes sensitive headers.
- Adds `X-Forwarded-For` for geoIP accuracy.

## Prerequisites
- [Docker](https://www.docker.com/get-started)

## Build and Run with Docker

### 1. Build the Docker image
```sh
docker build -t datadog-rum-proxy .
```

### 2. Run the container
```sh
docker run -p 3000:3000 datadog-rum-proxy
```

#### Optional: Specify Datadog site
By default, the proxy forwards to the US1 site (`datadoghq.com`). To use another site, set the `DATADOG_SITE` environment variable:

```sh
docker run -p 3000:3000 -e DATADOG_SITE=datadoghq.com jlmorton/datadog-rum-proxy:1.0
```

Supported values:
- `datadoghq.com` (default, US1)
- `us3.datadoghq.com`
- `us5.datadoghq.com`
- `datadoghq.eu`
- `ddog-gov.com`
- `ap1.datadoghq.com`


## Example: Test the Proxy with curl

```sh
curl -X POST 'http://localhost:3000/d?ddforward=/api/v2/rum' \
  -H 'Content-Type: application/json' \
  -d '{"test": "data"}'
```

## License
MIT 
