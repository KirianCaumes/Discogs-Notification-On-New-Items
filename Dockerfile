FROM node:24.11.0-slim

WORKDIR /app

# Copy only package files for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Create non-root user for security
RUN useradd -m -u 10001 usr

# Give usr permission
RUN chown usr:usr /app

# Copy source code
COPY --chown=usr:usr . .

# Switch to non-root user
USER usr

# Default command
CMD ["sh", "-c", "echo 'Container started correctly' && while :; do sleep 3600; done"]