#!/bin/bash

case "$1" in
  start)
    echo "Starting Naago services..."
    docker-compose up -d --build
    echo "Waiting for services to be ready..."
    sleep 5
    docker-compose ps
    ;;
  
  stop)
    echo "Stopping Naago services..."
    docker-compose down
    ;;
  
  restart)
    echo "Restarting Naago services..."
    docker-compose restart
    ;;
  
  rebuild)
    echo "Rebuilding and restarting app..."
    docker-compose up -d --build app
    ;;
  
  status)
    docker-compose ps
    ;;
  
  logs)
    if [ -z "$2" ]; then
      docker-compose logs -f
    else
      docker-compose logs -f "$2"
    fi
    ;;
  
  shell)
    if [ "$2" = "app" ]; then
      echo "Opening shell in app container..."
      docker exec -it naago-app /bin/sh
    else
      echo "Opening shell in MySQL container..."
      docker exec -it naago-mysql /bin/bash
    fi
    ;;
  
  connect)
    echo "Connecting to MySQL (password: Naago123456)..."
    docker exec -it naago-mysql mysql -u naago -p
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
    echo "⚠️  WARNING: This will delete all database data!"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
      echo "Resetting database..."
      docker-compose down -v
      docker-compose up -d --build
      echo "Database reset complete"
    else
      echo "Reset cancelled"
    fi
    ;;
  
  deploy-commands)
    echo "Deploying Discord commands..."
    docker exec naago-app deno run --allow-all --unstable-detect-cjs deploy-commands.ts
    ;;
  
  *)
    echo "Naago Management Script"
    echo ""
    echo "Usage: $0 {start|stop|restart|rebuild|status|logs|shell|connect|backup|restore|reset|deploy-commands}"
    echo ""
    echo "Commands:"
    echo "  start           - Start all services (MySQL + App)"
    echo "  stop            - Stop all services"
    echo "  restart         - Restart all services"
    echo "  rebuild         - Rebuild and restart app container"
    echo "  status          - Show container status"
    echo "  logs [service]  - Show and follow logs (all or specific service)"
    echo "  shell [app]     - Open shell in app or MySQL container"
    echo "  connect         - Connect to MySQL shell"
    echo "  backup          - Create a database backup"
    echo "  restore <file>  - Restore from a backup file"
    echo "  reset           - Reset database (deletes all data)"
    echo "  deploy-commands - Deploy Discord slash commands"
    echo ""
    echo "Examples:"
    echo "  $0 logs app     - Show app logs"
    echo "  $0 logs mysql   - Show MySQL logs"
    echo "  $0 shell app    - Open shell in app container"
    echo ""
    exit 1
    ;;
esac

