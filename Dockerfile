# StreamValet Backend Dockerfile
FROM node:18-alpine

# Install ffmpeg
RUN apk add --no-cache ffmpeg

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy server source code
COPY server ./server

# Expose backend port
EXPOSE 4000

# Start the server
CMD ["npm", "start", "--prefix", "server"]
