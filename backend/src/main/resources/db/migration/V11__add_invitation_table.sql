CREATE TABLE IF NOT EXISTS invitation
(
    invitation_id BIGSERIAL PRIMARY KEY,
    memory_id     BIGINT       NOT NULL REFERENCES memory (memory_id),
    member_id     BIGINT       NOT NULL REFERENCES member (member_id),
    invite_code   VARCHAR(255) NOT NULL,
    max_uses      INT          NOT NULL DEFAULT 0,
    used_count    INT          NOT NULL DEFAULT 0,
    created_at    TIMESTAMP,
    expires_at    TIMESTAMP,
    CONSTRAINT uk_invite_code UNIQUE (invite_code)
);
