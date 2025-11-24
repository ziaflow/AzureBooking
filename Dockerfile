# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json files for caching
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
# Install client and server dependencies
RUN cd client && npm install
RUN cd server && npm install

# Copy source code
COPY . .

# Build the project (Client + Server)
# This runs 'npm run build:project' which builds both and then 'copyfiles' to dist/
RUN npm run package

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder /app/dist ./

# Install production dependencies for the server
# We need to copy server/package.json to root of dist or install manually
# The 'dist' folder contains server.js but not node_modules.
# We need to install dependencies that server.js needs.
COPY server/package*.json ./
RUN npm install --only=production

# Expose port
EXPOSE 8080

# Environment variables should be passed at runtime
# ENV PORT=8080

# Start the server
CMD ["node", "server.js"]
