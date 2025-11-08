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

COPY deno.json ./
COPY drizzle.config.ts ./
COPY types ./types
COPY db/schema ./db/schema
COPY db/migrations ./db/migrations
COPY db/connection.ts ./db/connection.ts
COPY db/migrate.ts ./db/migrate.ts
COPY naagoLib ./naagoLib
COPY commands ./commands
COPY dto ./dto
COPY index.ts ./
COPY deploy-commands.ts ./

RUN deno cache index.ts deploy-commands.ts
RUN deno install --allow-scripts=npm:canvas --entrypoint index.ts

COPY . .
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]

