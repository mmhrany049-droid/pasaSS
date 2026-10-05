# SS study system: build the static site (student app + «پروژه مرکز»), then run the zero-dependency hub server.
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
RUN npm test && npm run check:no-remote-ai && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080 DIST_DIR=/app/dist DATA_DIR=/data
COPY --from=build /app/dist ./dist
COPY server ./server
RUN mkdir -p /data && chown -R node:node /data
USER node
VOLUME ["/data"]
EXPOSE 8080
HEALTHCHECK CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1
CMD ["node", "server/hub-server.mjs"]
