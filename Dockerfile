FROM denoland/deno:2.5.6

RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libexpat1-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY deno.json deno.lock* ./
COPY . .

RUN deno cache index.ts deploy-commands.ts
RUN deno install --allow-scripts=npm:canvas --entrypoint index.ts
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]

