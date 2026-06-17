ALTER TABLE member
ADD COLUMN refresh_token VARCHAR(512),
ADD COLUMN refresh_token_expires_at TIMESTAMP;
