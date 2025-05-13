FROM node:18-alpine

# Update repositories and install dependencies
RUN apk update && \
    apk add --no-cache \
    python3 \
    make \
    g++ \
    pixman-dev \
    cairo-dev \
    pango-dev

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port your Express app listens on
EXPOSE 3000

# Command to run your application
CMD [ "npm", "run", "serve" ]