# ─── Stage 1: Build Java (auth) ─────────────────────────
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build-auth
WORKDIR /app
COPY services/auth-service/pom.xml ./
COPY services/auth-service/src ./src
RUN mvn package -DskipTests -q

# ─── Stage 2: Build Java (product) ─────────────────────
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build-product
WORKDIR /app
COPY services/product-service/pom.xml ./
COPY services/product-service/src ./src
RUN mvn package -DskipTests -q

# ─── Stage 3: Install Python deps ──────────────────────
FROM python:3.11-slim AS build-python
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    && rm -rf /var/lib/apt/lists/*
COPY services/audit-service/requirements.txt /tmp/audit-req.txt
COPY services/ai-engine/requirements.txt /tmp/ai-req.txt
COPY services/notification-service/requirements.txt /tmp/notif-req.txt
RUN pip install --no-cache-dir -r /tmp/audit-req.txt -r /tmp/ai-req.txt -r /tmp/notif-req.txt

# ─── Stage 4: Install Node deps ────────────────────────
FROM node:20-alpine AS build-node
COPY services/payment-service/package.json /tmp/payment/package.json
RUN cd /tmp/payment && npm install --omit=dev

# ─── Stage 5: Final image ──────────────────────────────
# Uses Debian Bookworm nodejs (18.x) to avoid nodesource curl-bash failures.
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-21-jre-headless \
    nodejs \
    npm \
    && pip install --no-cache-dir supervisor \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy Python deps and executables from build stage
COPY --from=build-python /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=build-python /usr/local/bin/uvicorn /usr/local/bin/uvicorn

# Copy Java JARs
COPY --from=build-auth /app/target/*.jar /app/auth-service.jar
COPY --from=build-product /app/target/*.jar /app/product-service.jar

# Copy Node.js apps
COPY --from=build-node /tmp/payment/node_modules /app/payment-service/node_modules
COPY services/payment-service/src /app/payment-service/src
COPY services/payment-service/package.json /app/payment-service/

# Copy Python apps
COPY services/ai-engine /app/ai-engine
COPY services/notification-service /app/notification-service
COPY services/audit-service /app/audit-service

# Copy gateway
COPY infra/all-in-one/gateway /app/gateway

# Copy supervisor config
COPY infra/all-in-one/supervisord.conf /etc/supervisor/supervisord.conf

EXPOSE 8080

CMD ["/usr/local/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
