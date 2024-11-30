-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL UNIQUE,
    pubkey VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    kind INTEGER NOT NULL,
    tags JSONB NOT NULL DEFAULT '[]',
    content TEXT NOT NULL,
    sig VARCHAR(128) NOT NULL,
    author VARCHAR(64)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_pubkey ON events(pubkey);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_kind ON events(kind);
CREATE INDEX IF NOT EXISTS idx_events_author ON events(author);

-- Create generic_tags table
CREATE TABLE IF NOT EXISTS generic_tags (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL,
    tag_name VARCHAR(255) NOT NULL,
    tag_value TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
);

-- Create indexes for generic_tags
CREATE INDEX IF NOT EXISTS idx_generic_tags_event_id ON generic_tags(event_id);
CREATE INDEX IF NOT EXISTS idx_generic_tags_tag_name ON generic_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_generic_tags_tag_value ON generic_tags(tag_value);
CREATE INDEX IF NOT EXISTS idx_generic_tags_created_at ON generic_tags(created_at DESC);

-- Create nip05 table
CREATE TABLE IF NOT EXISTS nip05 (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    pubkey VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, pubkey)
);
