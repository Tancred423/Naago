# M'naago

A FFXIV Discord Bot built with Deno and TypeScript

## Features

- 🎮 Character profile lookup from FFXIV Lodestone
- 📰 Automated Lodestone news notifications (Topics, Notices, Maintenances,
  Updates, Status)
- 🎨 Customizable profile themes
- ⭐ Character favorites system
- ✅ Character verification
- 🐳 Fully containerized with Docker

## Quick Start

### Prerequisites

- Docker & Docker Compose
- (Optional) Deno 2.x for local development

### Running with Docker (Recommended)

1. **Configure the bot**

   Update environment variables in `docker-compose.yml` under the `app` service:
   ```yaml
   environment:
     - DISCORD_TOKEN=your_discord_bot_token
     - DISCORD_CLIENT_ID=your_client_id
     - DISCORD_GUILD_ID=your_guild_id
     - DB_PASS=your_database_password
     # ... other variables as needed
   ```

2. **Start all services**
   ```bash
   ./docker.sh start
   ```

3. **Deploy Discord commands**
   ```bash
   ./docker.sh deploy-commands
   ```

4. **View logs**
   ```bash
   ./docker.sh logs
   ./docker.sh logs app    # App only
   ./docker.sh logs mysql  # MySQL only
   ```

5. **Access phpMyAdmin**

   Database management UI available at http://localhost:8080

### Local Development with Deno

1. **Configure environment**
   ```bash
   cp .env.skel .env
   # Edit .env with your credentials
   # Use DB_HOST=localhost for local development
   ```

2. **Install dependencies**
   ```bash
   deno cache --allow-scripts=npm:canvas index.ts
   ```

3. **Start database and run migrations**
   ```bash
   docker-compose up -d mysql
   # Wait for MySQL to be ready (about 10 seconds), then run migrations
   deno task db:migrate
   ```

4. **Run the bot**
   ```bash
   deno task deploy-commands  # Deploy Discord commands
   deno task start            # Start the bot
   ```

## Configuration

All configuration is managed through environment variables:

- **For Local Development**: Use `.env` file (copy from `.env.skel`)
- **For Docker**: Set environment variables in `docker-compose.yml`

See `ENV_SETUP.md` for detailed documentation on all available environment
variables.

Key environment variables:

- `DISCORD_CLIENT_ID`, `DISCORD_TOKEN`, `DISCORD_GUILD_ID` - Discord bot
  credentials
- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_DATABASE` - Database connection
- `NAAGOSTONE_HOST`, `NAAGOSTONE_PORT` - Naago API server settings

**Important**: Use `DB_HOST=localhost` for local development and `DB_HOST=mysql`
for Docker. Use `NAAGOSTONE_HOST=localhost` for local and
`NAAGOSTONE_HOST=host.docker.internal` for Docker.

## Management Commands

```bash
./docker.sh start              # Start all services
./docker.sh stop               # Stop all services
./docker.sh restart            # Restart all services
./docker.sh rebuild            # Rebuild app container
./docker.sh status             # Show container status
./docker.sh logs [service]     # View logs
./docker.sh shell [app]        # Open container shell
./docker.sh connect            # Connect to MySQL
./docker.sh backup             # Backup database
./docker.sh restore <file>     # Restore database
./docker.sh deploy-commands    # Deploy Discord commands
```

## Architecture

```
┌─────────────────┐
│   Discord Bot   │
│  (Deno + TS)    │
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
┌───▼───┐  ┌──▼──────┐
│ MySQL │  │ Naago   │
│  DB   │  │  API    │
└───────┘  └─────────┘
```

## Docker Services

- **naago-app** - Main Discord bot (Deno)
- **naago-mysql** - MySQL 8.0 database
- Network: `naago-network` (bridge)

## Development

### Deno Tasks

```bash
deno task dev      # Run with hot reload
deno task start    # Run in production mode
deno task coms     # Deploy Discord commands
deno task cache    # Cache dependencies
deno task check    # Type check code
```

### Project Structure

```
.
├── commands/          # Discord slash commands
├── dto/              # Data transfer objects
├── naagoLib/         # Core utilities
├── images/           # Static assets
├── themes/           # Profile themes
├── db/init/          # Database schemas
├── Dockerfile        # App container
├── docker-compose.yml
└── deno.json         # Deno configuration
```

## Contributing

This bot requires a companion API server (Naago API) for fetching FFXIV
character data from the Lodestone.

## License

ISC
