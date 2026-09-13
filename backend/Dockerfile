# Use the latest Node.js 22 LTS slim image
FROM node:22-trixie-slim

WORKDIR /app

# Upgrade system packages to patch Debian-level vulnerabilities
# Upgrade npm to latest stable to fix bundled dependency vulnerabilities
RUN apt-get update \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g npm@latest

# Copy dependency manifests first for Docker layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

EXPOSE 8000

CMD ["node", "dist/index.js"]
