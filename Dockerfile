FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Koyeb requires a listening port for health checks
ENV PORT=8000
EXPOSE 8000

CMD ["npm", "start"]
