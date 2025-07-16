FROM node:18-slim

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .

# Run Prisma generate
RUN npx prisma generate

# Expose port 
EXPOSE 8080

# Start server
CMD ["npm", "start"]
