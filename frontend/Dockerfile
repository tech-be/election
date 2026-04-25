FROM node:20-slim AS deps

WORKDIR /app

COPY package.json package-lock.json* /app/
RUN npm ci || npm install


FROM node:20-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
COPY . /app

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/.next /app/.next

EXPOSE 3000

CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0", "--port", "3000"]
