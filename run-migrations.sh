#!/bin/bash

# Script to run database migrations
# Usage: ./run-migrations.sh [backup|run|revert|check]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Function to print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to backup database
backup_database() {
    print_info "Creating database backup..."
    
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    mysqldump -h"${DB_HOST:-localhost}" \
              -P"${DB_PORT:-3306}" \
              -u"${DB_USER:-root}" \
              -p"${DB_PASSWORD}" \
              "${DB_NAME:-iqx}" > "backups/$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        print_success "Backup created: backups/$BACKUP_FILE"
    else
        print_error "Backup failed!"
        exit 1
    fi
}

# Function to check database connection
check_connection() {
    print_info "Checking database connection..."
    
    mysql -h"${DB_HOST:-localhost}" \
          -P"${DB_PORT:-3306}" \
          -u"${DB_USER:-root}" \
          -p"${DB_PASSWORD}" \
          -e "SELECT 1;" "${DB_NAME:-iqx}" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        print_success "Database connection successful"
        return 0
    else
        print_error "Cannot connect to database"
        return 1
    fi
}

# Function to show migration status
show_migration_status() {
    print_info "Checking migration status..."
    
    mysql -h"${DB_HOST:-localhost}" \
          -P"${DB_PORT:-3306}" \
          -u"${DB_USER:-root}" \
          -p"${DB_PASSWORD}" \
          "${DB_NAME:-iqx}" \
          -e "SELECT * FROM migrations ORDER BY timestamp DESC;"
    
    print_info "\nMigration files in src/migrations/:"
    ls -lh src/migrations/*.ts 2>/dev/null || echo "No migration files found"
}

# Function to run migrations
run_migrations() {
    print_info "Running migrations..."
    
    npm run migration:run
    
    if [ $? -eq 0 ]; then
        print_success "Migrations completed successfully!"
        show_migration_status
    else
        print_error "Migration failed!"
        exit 1
    fi
}

# Function to revert migrations
revert_migrations() {
    print_warning "Reverting last migration..."
    
    npm run migration:revert
    
    if [ $? -eq 0 ]; then
        print_success "Migration reverted successfully!"
        show_migration_status
    else
        print_error "Revert failed!"
        exit 1
    fi
}

# Main script
echo "======================================"
echo "   Database Migration Manager"
echo "======================================"
echo ""

# Create backups directory if it doesn't exist
mkdir -p backups

# Check connection first
if ! check_connection; then
    exit 1
fi

# Parse command
COMMAND=${1:-help}

case $COMMAND in
    backup)
        backup_database
        ;;
    run)
        backup_database
        run_migrations
        ;;
    revert)
        backup_database
        revert_migrations
        ;;
    check)
        show_migration_status
        ;;
    full)
        print_info "Running full migration process with backup..."
        backup_database
        run_migrations
        print_success "\n✅ All done! Your database is up to date."
        ;;
    *)
        echo "Usage: $0 [backup|run|revert|check|full]"
        echo ""
        echo "Commands:"
        echo "  backup  - Create database backup only"
        echo "  run     - Backup and run pending migrations"
        echo "  revert  - Backup and revert last migration"
        echo "  check   - Show current migration status"
        echo "  full    - Backup and run all migrations (recommended)"
        echo ""
        exit 1
        ;;
esac

echo ""
echo "======================================"
print_success "Operation completed!"
echo "======================================"

