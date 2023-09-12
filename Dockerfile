FROM node:20-buster-slim

ARG sha
ENV COMMIT_SHA=$sha
ARG environment
ENV ENVIRONMENT=$environment

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
    && apt-get install -yq build-essential python3 git \
    && npm install -g pnpm

# Create a folder for compiling
WORKDIR /tmp
COPY package.json .
COPY pnpm-lock.yaml .
COPY tsconfig.json .
COPY src ./src
RUN pnpm install \
    && pnpm run build

# Prepare production folder
ENV NODE_ENV=production

WORKDIR /app
COPY package.json .
COPY pnpm-lock.yaml .
RUN pnpm install \
    && cp -r /tmp/dist/ .
RUN rm -rf /tmp

# Set start command
CMD ["node", "/app/dist/index.js", "--trace-events-enabled", "--trace-warnings"]
