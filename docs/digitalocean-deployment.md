# DigitalOcean Deployment Guide

This guide provides step-by-step instructions for deploying the Nostr relay on DigitalOcean.

## Prerequisites

1. A DigitalOcean account
2. A domain name pointed to DigitalOcean nameservers
3. SSH access to your DigitalOcean droplet

## Droplet Setup

1. Create a new droplet with the following specifications:
   - Ubuntu 22.04 LTS
   - Basic Plan
   - Regular CPU (Minimum 4GB RAM / 2 CPUs)
   - Choose a datacenter region close to your target users
   - Enable monitoring
   - Add your SSH key

2. Create DNS records:
   ```
   A record: relay.yourdomain.com → Your droplet IP
   ```

## Deployment Steps

1. **Prepare Your Environment File**

   Create a `.env` file with your configuration:
   ```env
   # Database Configuration
   DATABASE_URL=postgresql://nostr_user:your_password_here@localhost:5432/nostr_relay
   DATABASE_MAX_CONNECTIONS=50
   DATABASE_MIN_CONNECTIONS=5
   DATABASE_SSL=true

   # Server Configuration
   PORT=3000
   HOST=127.0.0.1

   # Relay Information
   RELAY_NAME="Your Relay Name"
   RELAY_DESCRIPTION="Your relay description"
   RELAY_PUBKEY="your-relay-public-key"
   RELAY_CONTACT="admin@yourdomain.com"
   ```

2. **Prepare Deployment Package**

   On your local machine:
   ```bash
   # Create deployment package
   tar -czf nostr-relay-clean.tar.gz \
       --exclude='node_modules' \
       --exclude='.git' \
       --exclude='*.log' \
       .
   ```

3. **Upload Files to Server**

   ```bash
   # Copy deployment files
   scp nostr-relay-clean.tar.gz root@your-droplet-ip:/tmp/
   scp deploy/scripts/deploy-digitalocean.sh root@your-droplet-ip:/tmp/
   scp .env root@your-droplet-ip:/tmp/
   ```

4. **Run Deployment Script**

   SSH into your droplet:
   ```bash
   ssh root@your-droplet-ip
   ```

   Update the script variables:
   ```bash
   vim /tmp/deploy-digitalocean.sh
   # Update DOMAIN and email address
   ```

   Run the deployment:
   ```bash
   chmod +x /tmp/deploy-digitalocean.sh
   /tmp/deploy-digitalocean.sh
   ```

## Post-Deployment Steps

1. **Verify Installation**

   Test the NIP-11 information endpoint:
   ```bash
   curl -i -H "Accept: application/nostr+json" https://relay.yourdomain.com
   ```

2. **Monitor the Application**

   Check PM2 status:
   ```bash
   pm2 status
   pm2 logs maiqr-relay
   ```

3. **Setup Database Backups**

   Create a backup script:
   ```bash
   sudo -u postgres pg_dump nostr_relay > /opt/backups/nostr_relay_$(date +%Y%m%d).sql
   ```

   Add to crontab:
   ```bash
   0 0 * * * /path/to/backup-script.sh
   ```

4. **Configure Monitoring**

   - Enable DigitalOcean monitoring
   - Set up alerts for:
     - CPU usage
     - Memory usage
     - Disk space
     - Database connections

## Security Recommendations

1. **Firewall Rules**
   ```bash
   # Verify UFW status
   sudo ufw status
   ```

2. **SSL Certificate**
   ```bash
   # Check certificate status
   certbot certificates
   ```

3. **Database Security**
   ```bash
   # Check PostgreSQL configuration
   sudo -u postgres psql -c "SHOW ssl;"
   sudo -u postgres psql -c "SHOW max_connections;"
   ```

4. **File Permissions**
   ```bash
   # Verify application permissions
   ls -la /opt/maiqr-relay
   ```

## Maintenance

1. **Log Rotation**
   PM2 log rotation is configured automatically. Verify settings:
   ```bash
   pm2 conf pm2-logrotate
   ```

2. **Database Maintenance**
   ```bash
   # Run VACUUM ANALYZE weekly
   sudo -u postgres psql nostr_relay -c "VACUUM ANALYZE;"
   ```

3. **SSL Certificate Renewal**
   Certbot auto-renewal is configured. Verify with:
   ```bash
   sudo certbot renew --dry-run
   ```

4. **Updates**
   ```bash
   # System updates
   sudo apt update
   sudo apt upgrade

   # Node.js updates
   npm update
   ```

## Troubleshooting

1. **Check Application Logs**
   ```bash
   pm2 logs maiqr-relay
   ```

2. **Check Nginx Logs**
   ```bash
   tail -f /var/log/nginx/error.log
   ```

3. **Check Database Logs**
   ```bash
   tail -f /var/log/postgresql/postgresql-*.log
   ```

4. **Common Issues**

   - If WebSocket connections fail:
     ```bash
     # Check Nginx configuration
     nginx -t
     # Check PM2 status
     pm2 status
     ```

   - If database connections fail:
     ```bash
     # Check PostgreSQL status
     systemctl status postgresql
     # Check connections
     sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
     ```

## Scaling

As your relay grows, consider:

1. **Database Optimization**
   - Increase `shared_buffers`
   - Tune `work_mem`
   - Add indexes for common queries

2. **Application Scaling**
   - Increase PM2 instances
   - Consider load balancing
   - Monitor memory usage

3. **Droplet Upgrades**
   - Monitor resource usage
   - Plan for vertical scaling
   - Consider horizontal scaling for high loads
