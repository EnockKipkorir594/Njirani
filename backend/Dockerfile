# ---- build stage ----
    FROM node:22-trixie-slim AS build
    WORKDIR /app
    
    RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/* \
        && npm install -g npm@latest
    
    # Approve install scripts npm 11 blocks (native builds) BEFORE installing
    COPY package*.json ./
    COPY package*.json ./
    RUN npm ci \
        && npm install-scripts approve bcrypt @prisma/engines prisma \
        && npm rebuild bcrypt @prisma/engines prisma \
        && npm cache clean --force
    
 
    # Compile TypeScript and generate the Prisma client
    COPY . .
    RUN DATABASE_URL="postgresql://build:build@localhost:5432/build_db" \
    npx prisma generate \
    && npm run build \
    && mkdir -p dist/generated \
    && cp -r src/generated/prisma dist/generated/

    RUN npm prune --omit=dev
    
    # ---- runtime stage ----
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
