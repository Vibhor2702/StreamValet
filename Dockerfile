# StreamValet Backend Dockerfile
FROM node:18-alpine

# Install ffmpeg
RUN apk add --no-cache ffmpeg

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY server/package*.json ./server/
RUN cd server && npm install

COPY client/package*.json ./client/
RUN cd client && npm install

# CRITICAL: Copy source code AND assets
COPY . .

# Explicitly ensure demo assets are preserved if they weren't caught by "COPY . ."
COPY demo_assets ./demo_assets

# Expose backend port
EXPOSE 4000

# Start the server
CMD ["npm", "start", "--prefix", "server"]
