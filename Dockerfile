# Base image
FROM node:20-alpine

# Install bash, ghostscript, and ghostscript-fonts
RUN apk update && apk add --no-cache bash ghostscript ghostscript-fonts

# Increase Node heap size
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Working Directory
WORKDIR /app

# Copy only package files first (better caching - best practice)
COPY package*.json ./

# Install node modules
RUN npm install

# Copy remaining app code
COPY . .

# Expose a port to allow external access
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]
