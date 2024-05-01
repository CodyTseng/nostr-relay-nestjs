# Building layer
FROM node:18-alpine as build

WORKDIR /app

# Copy configuration files
COPY tsconfig*.json ./
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code to the container
COPY . .

# Build the application
RUN npm run build

# Production layer
FROM node:18-alpine as production

# Set environment variables
ARG GIT_COMMIT_SHA
ENV GIT_COMMIT_SHA $GIT_COMMIT_SHA
ENV NODE_ENV=production

WORKDIR /app

# Copy dependencies files
COPY package*.json ./

# Copy resources files
COPY resources ./resources

# Install runtime dependecies (without dev/test dependecies)
RUN npm ci --omit=dev

# Copy production build
COPY --from=build /app/dist .

# Start the application
CMD npm run migration:run && node src/main