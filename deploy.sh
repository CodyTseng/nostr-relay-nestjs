#!/bin/bash
set -e

# Safety check for script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$SCRIPT_DIR" == *"/nostr-relay-nestjs" ]]; then
    echo -e "\n❌ \033[1;31mERROR: Deploy script cannot be run from within the project directory!\033[0m"
    echo -e "\n⚠️  Please follow these steps:\n"
    echo -e "1. Copy the deploy script to the parent directory:"
    echo -e "   \033[1;36mcp deploy.sh ../deploy-nostr.sh\033[0m"
    echo -e "\n2. Change to the parent directory:"
    echo -e "   \033[1;36mcd ..\033[0m"
    echo -e "\n3. Make the script executable:"
    echo -e "   \033[1;36mchmod +x deploy-nostr.sh\033[0m"
    echo -e "\n4. Run the deployment:"
    echo -e "   \033[1;36m./deploy-nostr.sh\033[0m"
    echo -e "\nFor more information, please read the deployment section in README.md\n"
    exit 1
fi

# Configuration
DEPLOY_DIR="/opt/maiqr-relay"
PM2_NAME="nostr-relay"
BACKUP_DIR="/opt/backups/nostr-relay"
BACKUP_ENV="$BACKUP_DIR/env.backup"
BACKUP_TIMESTAMP="$BACKUP_DIR/backup_time"
MAX_BACKUPS=6
MAX_DAYS=60

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to rotate old backups
rotate_backups() {
    local backup_dir=$1
    echo -e "${YELLOW}Rotating old backups...${NC}"
    
    # Create dated backup directory
    local current_date=$(date +%Y%m%d_%H%M%S)
    local new_backup_dir="${backup_dir}/backup_${current_date}"
    mkdir -p "$new_backup_dir"
    
    # Move current backup to dated directory if it exists
    if [ -f "$BACKUP_ENV" ]; then
        mv "$BACKUP_ENV" "${new_backup_dir}/env.backup"
    fi
    if [ -f "$BACKUP_TIMESTAMP" ]; then
        mv "$BACKUP_TIMESTAMP" "${new_backup_dir}/backup_time"
    fi
    
    # Delete old backups
    local backup_count=$(ls -1d ${backup_dir}/backup_* 2>/dev/null | wc -l)
    local cutoff_date=$(date -v-${MAX_DAYS}d +%Y%m%d_%H%M%S)
    
    # Process each backup directory
    for backup in ${backup_dir}/backup_*; do
        if [ -d "$backup" ]; then
            backup_date=$(basename "$backup" | cut -d'_' -f2-)
            
            # Delete if older than MAX_DAYS
            if [[ "$backup_date" < "$cutoff_date" ]]; then
                echo "Removing old backup: $backup (older than ${MAX_DAYS} days)"
                rm -rf "$backup"
                continue
            fi
            
            # Keep track of remaining backups for MAX_BACKUPS check
            remaining_backups+=("$backup")
        fi
    done
    
    # Sort remaining backups by date (oldest first) and remove excess
    if [ ${#remaining_backups[@]} -gt $MAX_BACKUPS ]; then
        local excess=$((${#remaining_backups[@]} - $MAX_BACKUPS))
        for ((i=0; i<$excess; i++)); do
            echo "Removing excess backup: ${remaining_backups[$i]}"
            rm -rf "${remaining_backups[$i]}"
        done
    fi
}

echo -e "${GREEN}Starting Nostr Relay deployment...${NC}"

# Create backup directory with proper isolation
mkdir -p $BACKUP_DIR
chmod 700 $BACKUP_DIR

# Backup existing deployment
if [ -d $DEPLOY_DIR ]; then
    echo -e "${YELLOW}Backing up existing deployment...${NC}"
    if [ -f $DEPLOY_DIR/.env ]; then
        # Verify this is indeed a Nostr Relay env file
        if grep -q "NOSTR_" $DEPLOY_DIR/.env || grep -q "RELAY_" $DEPLOY_DIR/.env; then
            cp $DEPLOY_DIR/.env $BACKUP_ENV
            date +%s > $BACKUP_TIMESTAMP
            # Rotate backups after successful backup
            rotate_backups "$BACKUP_DIR"
        else
            echo -e "${RED}Warning: Found unexpected .env file. Skipping backup to prevent corruption.${NC}"
            exit 1
        fi
    fi
    mv $DEPLOY_DIR ${DEPLOY_DIR}.old
fi

echo -e "${GREEN}Cloning latest version...${NC}"
git clone https://github.com/HumanjavaEnterprises/nostr-relay-nestjs.git $DEPLOY_DIR
cd $DEPLOY_DIR
git checkout master

# Restore environment configuration with validation
if [ -f $BACKUP_ENV ] && [ -f $BACKUP_TIMESTAMP ]; then
    BACKUP_TIME=$(cat $BACKUP_TIMESTAMP)
    CURRENT_TIME=$(date +%s)
    BACKUP_AGE=$((CURRENT_TIME - BACKUP_TIME))
    
    # Only restore if backup is less than 1 hour old
    if [ $BACKUP_AGE -lt 3600 ]; then
        echo -e "${GREEN}Restoring environment configuration...${NC}"
        if grep -q "NOSTR_" $BACKUP_ENV || grep -q "RELAY_" $BACKUP_ENV; then
            cp $BACKUP_ENV .env
        else
            echo -e "${RED}Error: Backup env file appears to be invalid. Aborting.${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Error: Backup env file is too old (>1 hour). Aborting for safety.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}Installing dependencies...${NC}"
npm install

echo -e "${GREEN}Building application...${NC}"
npm run build

echo -e "${GREEN}Copying views to dist...${NC}"
mkdir -p dist/views
cp -r src/views/* dist/views/

echo -e "${GREEN}Setting proper permissions...${NC}"
chown -R root:root .
chmod -R 755 .

# Update PM2 process
if pm2 list | grep -q "$PM2_NAME"; then
    echo -e "${GREEN}Reloading existing PM2 process...${NC}"
    pm2 reload $PM2_NAME
else
    echo -e "${GREEN}Starting new PM2 process...${NC}"
    NODE_ENV=production pm2 start dist/src/main.js --name $PM2_NAME
fi

# Save PM2 process list without affecting other processes
pm2 save

# Clean up old deployment
if [ -d ${DEPLOY_DIR}.old ]; then
    rm -rf ${DEPLOY_DIR}.old
fi

echo -e "${GREEN}Waiting for service to start...${NC}"
sleep 5

echo -e "${GREEN}Service status:${NC}"
pm2 show $PM2_NAME

echo -e "${GREEN}Deployment completed successfully!${NC}"
