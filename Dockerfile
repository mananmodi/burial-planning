FROM node:22-bookworm

WORKDIR /app

# Install dependencies first so Docker can reuse this layer when source files change.
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm ci \
    && npm --prefix server ci \
    && npm --prefix client ci

# Copy the application source and build the React client.
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["npm", "run", "start"]