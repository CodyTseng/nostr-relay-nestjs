# Building layer
FROM node:lts-alpine3.20 as build

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
FROM node:lts-alpine3.20 as production

# Set environment variables
ARG GIT_COMMIT_SHA
ARG DATABASE_URL
ARG RELAY_PUBKEY
ARG WHITELIST


ENV NODE_ENV=production

ENV GIT_COMMIT_SHA $GIT_COMMIT_SHA
ENV DATABASE_URL $DATABASE_URL
ENV RELAY_PUBKEY $RELAY_PUBKEY
ENV WHITELIST $WHITELIST

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