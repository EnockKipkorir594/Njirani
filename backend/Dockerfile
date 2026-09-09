FROM node:20-slim

WORKDIR /app

# Upgrade npm to a version with patched transitive dependencies
RUN npm install -g npm@10.9.9

COPY package*.json ./

RUN npm ci && npm cache clean --force

COPY . .

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]

CMD ["npm", "run", "dev"]
