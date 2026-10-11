FROM node:22-alpine AS web
WORKDIR /web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM python:3.13-slim
WORKDIR /app
COPY pyproject.toml ./
COPY atlas/ ./atlas/
RUN pip install --no-cache-dir . \
    && useradd --create-home --uid 10001 atlas \
    && mkdir /app/.atlas \
    && chown -R atlas:atlas /app
COPY --from=web /web/dist ./web/dist
USER atlas
EXPOSE 8765
CMD ["python", "-m", "atlas", "serve", "--host", "0.0.0.0", "--port", "8765"]
