#!/bin/bash

case "$1" in
  start)
    echo "Starting Naago services (PRODUCTION)..."
    docker-compose up -d --build
    echo "Waiting for services to be ready..."
    sleep 5
    docker-compose ps
    ;;
  
  dev)
    echo "Starting Naago services (DEVELOPMENT with hot reloading)..."
    docker-compose -f docker-compose.dev.yml up -d --build
    echo "Waiting for services to be ready..."
    sleep 5
    docker-compose -f docker-compose.dev.yml ps
    echo ""
    echo "✅ Development mode active - code changes will auto-reload!"
    ;;
  
  stop)
    echo "Stopping Naago services..."
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
    ;;
  
  restart)
    echo "Restarting Naago services..."
    docker-compose restart
    ;;
  
  restart-dev)
    echo "Restarting Naago services (DEV)..."
    docker-compose -f docker-compose.dev.yml restart
    ;;
  
  rebuild)
    echo "Rebuilding and restarting app (PRODUCTION)..."
    docker-compose up -d --build app
    ;;
  
  rebuild-dev)
    echo "Rebuilding and restarting app (DEVELOPMENT)..."
    docker-compose -f docker-compose.dev.yml up -d --build app
    ;;
  
  status)
    docker-compose ps
    ;;
  
  logs)
    if [ "$2" = "dev" ]; then
      echo "Showing DEV logs..."
      if [ -z "$3" ]; then
        docker-compose -f docker-compose.dev.yml logs -f
      else
        docker-compose -f docker-compose.dev.yml logs -f "$3"
      fi
    else
      if [ -z "$2" ]; then
        docker-compose logs -f
      else
        docker-compose logs -f "$2"
      fi
    fi
    ;;
  
  shell)
    if [ "$2" = "dev" ]; then
      echo "Opening shell in DEV app container..."
      docker exec -it naago-app-dev /bin/sh
    elif [ "$2" = "app" ]; then
      echo "Opening shell in app container..."
      docker exec -it naago-app /bin/sh
    else
      echo "Opening shell in MySQL container..."
      docker exec -it naago-mysql /bin/bash
    fi
    ;;
  
  connect)
    if [ "$2" = "dev" ]; then
      echo "Connecting to MySQL DEV (password: Naago123456)..."
      docker exec -it naago-mysql-dev mysql -u naago -p
    else
      echo "Connecting to MySQL (password: Naago123456)..."
      docker exec -it naago-mysql mysql -u naago -p
    fi
    ;;
  
  backup)
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    echo "Creating backup: $BACKUP_FILE"
    docker exec naago-mysql mysqldump -u root -prootpassword naago > "$BACKUP_FILE"
    echo "Backup created: $BACKUP_FILE"
    ;;
  
  restore)
    if [ -z "$2" ]; then
      echo "Usage: $0 restore <backup-file>"
      exit 1
    fi
    echo "Restoring from: $2"
    docker exec -i naago-mysql mysql -u root -prootpassword naago < "$2"
    echo "Restore completed"
    ;;
  
  reset)
    MODE="${2:-prod}"
    echo "⚠️  WARNING: This will delete all database data!"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
      if [ "$MODE" = "dev" ]; then
        echo "Resetting DEV database..."
        docker-compose -f docker-compose.dev.yml down -v
        docker-compose -f docker-compose.dev.yml up -d --build
      else
        echo "Resetting PROD database..."
        docker-compose down -v
        docker-compose up -d --build
      fi
      echo "Database reset complete"
    else
      echo "Reset cancelled"
    fi
    ;;
  
  deploy-commands)
    if [ "$2" = "dev" ]; then
      echo "Deploying Discord commands (DEV)..."
      docker exec naago-app-dev deno run --allow-all --unstable-detect-cjs deploy-commands.ts
    else
      echo "Deploying Discord commands (PROD)..."
      docker exec naago-app deno run --allow-all --unstable-detect-cjs deploy-commands.ts
    fi
    ;;
  
  *)
    echo "Naago Management Script"
    echo ""
    echo "Usage: $0 {command} [options]"
    echo ""
    echo "🚀 Main Commands:"
    echo "  start              - Start all services in PRODUCTION mode"
    echo "  dev                - Start all services in DEVELOPMENT mode (with hot reloading)"
    echo "  stop               - Stop all services (both prod and dev)"
    echo "  restart            - Restart all services (production)"
    echo "  restart-dev        - Restart all services (development)"
    echo "  rebuild            - Rebuild and restart app (production)"
    echo "  rebuild-dev        - Rebuild and restart app (development)"
    echo ""
    echo "📊 Monitoring:"
    echo "  status             - Show container status"
    echo "  logs [dev] [svc]   - Show and follow logs"
    echo "                       Examples: logs, logs dev, logs app, logs dev app"
    echo ""
    echo "🔧 Shell Access:"
    echo "  shell [app|dev]    - Open shell in container"
    echo "                       Examples: shell app, shell dev, shell (mysql)"
    echo "  connect [dev]      - Connect to MySQL shell"
    echo ""
    echo "💾 Database:"
    echo "  backup             - Create a database backup"
    echo "  restore <file>     - Restore from a backup file"
    echo "  reset [dev]        - Reset database (deletes all data)"
    echo ""
    echo "⚙️  Discord:"
    echo "  deploy-commands [dev] - Deploy Discord slash commands"
    echo ""
    echo "💡 Quick Start:"
    echo "  Development: $0 dev && $0 logs dev app"
    echo "  Production:  $0 start"
    echo ""
    exit 1
    ;;
esac

