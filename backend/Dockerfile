FROM node:20-slim
WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm install

# Copy source (for initial build)
COPY . .


#ENV DATABASE_URL="postgresql://njirani:njirani_dev_pass@localhost:5432/njirani?schema=public"
# Generate Prisma client
#RUN npx prisma generate

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npm", "run", "dev"]
