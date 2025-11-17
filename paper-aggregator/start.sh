#!/bin/bash

# Admin mode functions
show_admin_menu() {
    clear
    echo "========================================="
    echo "Snark Express - Admin Mode"
    echo "========================================="
    echo ""
    echo "1. View Database Statistics"
    echo "2. Reset Database (WARNING: Deletes all data!)"
    echo "3. View Recent Papers"
    echo "4. View Configuration (.env)"
    echo "5. Generate Secure Admin Key"
    echo "6. Backup Database"
    echo "7. Test Admin API"
    echo "8. Configure Email Whitelist"
    echo "9. Exit Admin Mode"
    echo ""
    echo -n "Choose an option (1-9): "
}

admin_mode() {
    cd backend

    # Check if .env exists
    if [ ! -f ".env" ]; then
        echo "Error: .env file not found. Creating from example..."
        cp .env.example .env
    fi

    # Get admin key from .env
    ADMIN_KEY=$(grep ADMIN_KEY .env | cut -d '=' -f2-)

    while true; do
        show_admin_menu
        read choice

        case $choice in
            1)
                echo ""
                echo "Fetching database statistics..."
                curl -s http://localhost:3001/api/admin/stats \
                    -H "X-Admin-Key: $ADMIN_KEY" | jq . 2>/dev/null || \
                    curl -s http://localhost:3001/api/admin/stats \
                    -H "X-Admin-Key: $ADMIN_KEY"
                echo ""
                echo "Press Enter to continue..."
                read
                ;;
            2)
                echo ""
                echo "WARNING: This will delete ALL data!"
                echo -n "Are you sure? Type 'yes' to confirm: "
                read confirm
                if [ "$confirm" = "yes" ]; then
                    echo "Resetting database..."
                    curl -s -X POST http://localhost:3001/api/admin/reset-database \
                        -H "X-Admin-Key: $ADMIN_KEY" | jq . 2>/dev/null || \
                        curl -s -X POST http://localhost:3001/api/admin/reset-database \
                        -H "X-Admin-Key: $ADMIN_KEY"
                else
                    echo "Cancelled."
                fi
                echo ""
                echo "Press Enter to continue..."
                read
                ;;
            3)
                echo ""
                echo "Recent papers:"
                if [ -f "data/database.sqlite" ]; then
                    sqlite3 data/database.sqlite "
                    SELECT
                        p.id,
                        substr(p.title, 1, 50) || '...' as title,
                        u.username,
                        p.created_at
                    FROM papers p
                    LEFT JOIN users u ON p.submitter_id = u.id
                    ORDER BY p.created_at DESC
                    LIMIT 10;
                    " 2>/dev/null || echo "Database not found or sqlite3 not installed."
                else
                    echo "Database not found."
                fi
                echo ""
                echo "Press Enter to continue..."
                read
                ;;
            4)
                echo ""
                echo "Current configuration (.env):"
                echo "-----------------------------------"
                cat .env | grep -v "SECRET" | grep -v "KEY" || cat .env
                echo "-----------------------------------"
                echo ""
                echo "Note: Secrets are hidden for security."
                echo ""
                echo "Press Enter to continue..."
                read
                ;;
            5)
                echo ""
                echo "Generating secure admin key..."
                NEW_KEY=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
                echo ""
                echo "Generated key: $NEW_KEY"
                echo ""
                echo -n "Update .env with this key? (y/n): "
                read update
                if [ "$update" = "y" ]; then
                    sed -i.bak "s/ADMIN_KEY=.*/ADMIN_KEY=$NEW_KEY/" .env
                    echo "Updated! Please restart the server."
                    ADMIN_KEY=$NEW_KEY
                fi
                echo ""
                echo "Press Enter to continue..."
                read
                ;;
            6)
                echo ""
                if [ -f "data/database.sqlite" ]; then
                    BACKUP_DIR="backups"
                    mkdir -p $BACKUP_DIR
                    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
                    BACKUP_FILE="$BACKUP_DIR/database.$TIMESTAMP.sqlite"
                    cp data/database.sqlite "$BACKUP_FILE"
                    echo "Backup created: $BACKUP_FILE"
                    echo "Database size: $(du -h data/database.sqlite | cut -f1)"
                else
                    echo "Database not found."
                fi
                echo ""
                echo "Press Enter to continue..."
                read
                ;;
            7)
                echo ""
                echo "Testing admin API connection..."
                echo ""
                echo "Health check:"
                curl -s http://localhost:3001/api/health | jq . 2>/dev/null || \
                    curl -s http://localhost:3001/api/health
                echo ""
                echo ""
                echo "Admin stats (with current key):"
                curl -s http://localhost:3001/api/admin/stats \
                    -H "X-Admin-Key: $ADMIN_KEY" | jq . 2>/dev/null || \
                    curl -s http://localhost:3001/api/admin/stats \
                    -H "X-Admin-Key: $ADMIN_KEY"
                echo ""
                echo "Press Enter to continue..."
                read
                ;;
            8)
                echo ""
                echo "Current Email Whitelist Configuration:"
                echo "-----------------------------------"
                grep ALLOWED_EMAILS .env || echo "ALLOWED_EMAILS not set"
                echo "-----------------------------------"
                echo ""
                echo "Options:"
                echo "1. Allow all emails (open registration)"
                echo "2. Set specific emails"
                echo "3. Set domain whitelist"
                echo "4. Back to admin menu"
                echo ""
                echo -n "Choose option (1-4): "
                read email_choice

                case $email_choice in
                    1)
                        sed -i.bak "s/ALLOWED_EMAILS=.*/ALLOWED_EMAILS=/" .env
                        echo "Updated! Registration is now open to all."
                        echo "Restart server to apply changes."
                        ;;
                    2)
                        echo -n "Enter comma-separated emails: "
                        read emails
                        sed -i.bak "s/ALLOWED_EMAILS=.*/ALLOWED_EMAILS=$emails/" .env
                        echo "Updated! Restart server to apply changes."
                        ;;
                    3)
                        echo -n "Enter comma-separated domains (with @): "
                        read domains
                        sed -i.bak "s/ALLOWED_EMAILS=.*/ALLOWED_EMAILS=$domains/" .env
                        echo "Updated! Restart server to apply changes."
                        ;;
                    4)
                        ;;
                esac
                echo ""
                echo "Press Enter to continue..."
                read
                ;;
            9)
                echo ""
                echo "Exiting admin mode..."
                cd ..
                return
                ;;
            *)
                echo ""
                echo "Invalid option. Please try again."
                sleep 1
                ;;
        esac
    done
}

# Check if running in admin mode
if [ "$1" = "admin" ] || [ "$1" = "--admin" ] || [ "$1" = "-a" ]; then
    echo "========================================="
    echo "Snark Express - Admin Mode"
    echo "========================================="
    echo ""
    echo "Checking if server is running..."
    if ! curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "Warning: Backend server is not running."
        echo "Please start the server first with: ./start.sh"
        echo ""
        echo -n "Continue anyway? (y/n): "
        read continue
        if [ "$continue" != "y" ]; then
            exit 0
        fi
    fi
    admin_mode
    exit 0
fi

echo "========================================="
echo "Snark Express - Setup & Start"
echo "========================================="
echo ""
echo "Usage:"
echo "  ./start.sh          - Start the application"
echo "  ./start.sh admin    - Enter admin mode"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "Node version: $(node -v)"
echo "npm version: $(npm -v)"
echo ""

# Backend setup
echo "Setting up backend..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

echo "Initializing database..."
npm run init-db

echo "Starting backend server..."
npm run dev &
BACKEND_PID=$!

cd ..

# Frontend setup
echo ""
echo "Setting up frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "========================================="
echo "Setup complete!"
echo "========================================="
echo ""
echo "Backend running on: http://localhost:3001"
echo "Frontend running on: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
