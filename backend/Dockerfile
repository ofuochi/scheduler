# Base stage
FROM node:alpine AS base
WORKDIR /usr/src/app

# Copy package files separately to take advantage of caching
COPY package.json yarn.lock ./

# Development Stage
FROM base AS development

# Install all dependencies for development
RUN yarn install

# Copy the rest of the application code
COPY . .

# Copy sample.env to .env
RUN cp sample.env .env

# Build the application
RUN yarn run build

# Production Stage
FROM base AS production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Install only production dependencies
RUN yarn install --production

# Copy the build artifacts from the development stage
COPY --from=development /usr/src/app/dist ./dist

# Copy .env file
COPY --from=development /usr/src/app/.env ./.env

# Start the application
CMD ["node", "dist/main"]
