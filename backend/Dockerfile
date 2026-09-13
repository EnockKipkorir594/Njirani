FROM node:22-slim

WORKDIR /app

# Patch Debian packages and upgrade npm
RUN apt-get update \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g npm@12.0.2

COPY package*.json ./

RUN npm ci && npm cache clean --force

COPY . .

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]

CMD ["npm", "run", "dev"]
