-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Set up basic security
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nostr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO nostr_user;

-- Optimize for nostr workload
ALTER SYSTEM SET max_connections = '100';
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '128MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET synchronous_commit = 'off';

-- Logging configuration
ALTER SYSTEM SET log_min_duration_statement = '1000';
ALTER SYSTEM SET log_statement = 'none';
ALTER SYSTEM SET log_checkpoints = 'on';

-- Connection settings
ALTER SYSTEM SET tcp_keepalives_idle = '300';
ALTER SYSTEM SET tcp_keepalives_interval = '60';
ALTER SYSTEM SET tcp_keepalives_count = '5';

-- Statement timeout (prevent long-running queries)
ALTER SYSTEM SET statement_timeout = '30s';

-- Vacuum settings
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = '0.1';
ALTER SYSTEM SET autovacuum_analyze_scale_factor = '0.05';
