FROM node:20-slim

WORKDIR /app

# Patch Debian packages and upgrade npm
RUN apt-get update \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g npm@10.9.9

COPY package*.json ./

RUN npm ci && npm cache clean --force

COPY . .

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]

CMD ["npm", "run", "dev"]
