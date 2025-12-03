##
# Production Dockerfile
##

###
# Base image declaration
###
FROM node:20.5-alpine AS base

ENV APPDIR=/app

###
# Client build stage
###
FROM base AS client-build

WORKDIR ${APPDIR}/client

COPY client/package*.json ./
RUN npm ci

COPY interfaces ../interfaces
COPY client ./

# Build argument for the app version (to be injected into the application)
ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}

# Build argument for feature flags
ARG VITE_ENABLED_FEATURES='[]'
ENV VITE_ENABLED_FEATURES=${VITE_ENABLED_FEATURES}

RUN npm run build

###
# Server build stage
###
FROM base AS server-build

WORKDIR ${APPDIR}/server

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY server/package*.json ./
RUN npm ci

COPY interfaces ../interfaces
COPY server ./
RUN npm run build
RUN rm -r src

###
# Main image build
###
FROM base AS main

# Install all dependencies (GDAL & others for Puppeteer)
RUN apk update && apk add \
  gdal-tools \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  font-noto-emoji

# Add non-root user with explicit UID and GID
RUN addgroup --system --gid 1001 appGroup && \
  adduser --system --uid 1001 appUser

WORKDIR ${APPDIR}

COPY --chown=appUser:appGroup --from=server-build ${APPDIR}/server ./
COPY --chown=appUser:appGroup --from=client-build ${APPDIR}/client/dist ./static/

ENV TZ=Europe/Helsinki

# Define Chromium path, as it was not installed in the previous phase
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Don't run the app as root
USER appUser

CMD ["npm", "start"]
