FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci && npm cache clean --force

COPY . .

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]

CMD ["npm", "run", "dev"]
