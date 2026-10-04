FROM node:24.16.0-slim

WORKDIR /app

# Required by curl-impersonate
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

# Where `impers` keeps libcurl-impersonate, fixed so the build can prefetch it
ENV IMPER_CACHE_DIR=/app/.impers

# Copy only package files for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Prefetch and verify libcurl-impersonate: impers silently falls back to plain libcurl when the download fails,
# which Discogs blocks, so fail the build rather than at runtime
RUN node --input-type=module -e "import { fetch, isUsingImpersonate } from 'impers'; const res = await fetch('https://www.google.com/generate_204', { impersonate: 'chrome' }); if (!(await isUsingImpersonate())) throw new Error('impers fell back to plain libcurl'); console.log('impers verified', res.status)"

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