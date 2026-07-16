# Use official Node.js LTS image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Ensure the DB file and path are writable
VOLUME ["/usr/src/app/data"]
ENV DB_PATH=/usr/src/app/smallsteps.db

# Expose the port
EXPOSE 5000

# Start the server
CMD [ "node", "server.js" ]
