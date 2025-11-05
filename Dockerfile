FROM node:20.19.5-slim

WORKDIR /app

COPY ./ ./

RUN npm ci

CMD ["sh", "-c", "echo 'Container started correctly' && while :; do sleep 3600; done"]