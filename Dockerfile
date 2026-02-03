FROM node:24.11.0-slim

WORKDIR /app

# Copy only package files for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Install Playwright browser
RUN npx playwright install --with-deps chromium

# Create non-root user for security
RUN useradd -m -u 10001 discogs

# Copy source code
COPY --chown=discogs:discogs . .

# Switch to non-root user
USER discogs

# Default command
CMD ["sh", "-c", "echo 'Container started correctly' && while :; do sleep 3600; done"]