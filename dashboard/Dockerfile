# Build the static dashboard and serve it with nginx.
# Build context must be the REPO ROOT (so loading_times.csv is available to copy):
#   docker build -f dashboard/Dockerfile -t perfscope .
#   docker run --rm -p 8080:80 perfscope   # -> http://localhost:8080
#
# Or use dashboard/docker-compose.yml:
#   docker compose -f dashboard/docker-compose.yml up --build

# ---- build stage ----
# Mirror the repo layout so copy-data.mjs finds ../loading_times.csv.
FROM node:20-alpine AS build
WORKDIR /repo/dashboard

# Install deps first for better layer caching.
COPY dashboard/package.json dashboard/package-lock.json* ./
RUN npm ci || npm install

# Source-of-truth CSV at the repo root, then the dashboard source.
COPY loading_times.csv /repo/loading_times.csv
COPY dashboard/ ./

RUN npm run build

# ---- serve stage ----
FROM nginx:1.27-alpine AS serve
COPY --from=build /repo/dashboard/dist /usr/share/nginx/html
# SPA fallback + long cache for hashed assets.
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  location / { try_files $uri /index.html; }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
