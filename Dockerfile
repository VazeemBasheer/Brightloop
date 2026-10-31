# Use official lightweight Node.js image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy application code
COPY ai-server.js ./

# Expose server port
ENV PORT=3001
EXPOSE 3001

# Start the AI Express server
CMD ["node", "ai-server.js"]

