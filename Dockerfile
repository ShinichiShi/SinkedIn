# Use Node.js LTS as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and lock files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --production

# Copy all files into the container
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the default Next.js port
EXPOSE 3000

# Run the Next.js app
CMD ["npm", "start"]
