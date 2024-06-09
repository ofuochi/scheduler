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

# Build the application
RUN yarn run build

# Production Stage
FROM nginx:alpine

# Copy the build artifacts from the development stage
COPY --from=development /usr/src/app/build /usr/share/nginx/html

# Copy custom Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port Nginx is running on
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
