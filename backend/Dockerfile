# ---- build stage: npm lives and dies here ----
    FROM node:22-trixie-slim AS build
    WORKDIR /app
    
    RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/* \
        && npm install -g npm@latest
    
    COPY package*.json ./
    RUN npm ci --omit=dev && npm cache clean --force
    COPY . .
    
    # ---- runtime stage: no npm, no npx, no corepack ----
    FROM node:22-trixie-slim
    WORKDIR /app
    
    RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/* \
        && rm -rf /usr/local/lib/node_modules/npm \
                  /usr/local/lib/node_modules/corepack \
        && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
    
    COPY --from=build /app/node_modules ./node_modules
    COPY --from=build /app/dist ./dist
    COPY --from=build /app/package.json ./package.json
    
    EXPOSE 8000
    CMD ["node", "dist/index.js"]
