-- =============================================
-- V1__init.sql
-- Rememory 초기 테이블 생성
-- =============================================

-- 1. member
CREATE TABLE member
(
    member_id         BIGSERIAL PRIMARY KEY,
    name              VARCHAR(255),
    email             VARCHAR(255),
    profile_image_url VARCHAR(255),
    oauth_provider    VARCHAR(50),
    oauth_id          VARCHAR(255),
    created_at        TIMESTAMP,
    deleted_at        TIMESTAMP,
    CONSTRAINT uk_oauth UNIQUE (oauth_provider, oauth_id)
);

-- 2. memory
CREATE TABLE memory
(
    memory_id            BIGSERIAL PRIMARY KEY,
    creator_id           BIGINT       NOT NULL REFERENCES member (member_id),
    name                 VARCHAR(255),
    description          TEXT,
    avg_rating           NUMERIC(3, 2),
    place_count          INT          NOT NULL DEFAULT 0,
    show_history_to_new  BOOLEAN      NOT NULL DEFAULT TRUE,
    start_date           DATE,
    end_date             DATE,
    created_at           TIMESTAMP,
    deleted_at           TIMESTAMP
);

-- 3. member_memory
CREATE TABLE member_memory
(
    member_memory_id BIGSERIAL PRIMARY KEY,
    member_id        BIGINT NOT NULL REFERENCES member (member_id),
    memory_id        BIGINT NOT NULL REFERENCES memory (memory_id),
    joined_at        TIMESTAMP,
    left_at          TIMESTAMP,
    CONSTRAINT uk_member_memory UNIQUE (member_id, memory_id)
);

-- 4. memory_photo
CREATE TABLE memory_photo
(
    memory_photo_id BIGSERIAL PRIMARY KEY,
    memory_id       BIGINT NOT NULL REFERENCES memory (memory_id),
    register_id     BIGINT NOT NULL REFERENCES member (member_id),
    image_url       VARCHAR(255),
    created_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);

-- 5. place
CREATE TABLE place
(
    place_id        BIGSERIAL PRIMARY KEY,
    memory_id       BIGINT         NOT NULL REFERENCES memory (memory_id),
    creator_id      BIGINT         NOT NULL REFERENCES member (member_id),
    name            VARCHAR(255),
    category        VARCHAR(50),
    address         VARCHAR(255),
    kakao_place_id  VARCHAR(255),
    latitude        NUMERIC(10, 7),
    longitude       NUMERIC(10, 7),
    avg_rating      NUMERIC(3, 2),
    review_count    INT            NOT NULL DEFAULT 0,
    region_depth1   VARCHAR(50),
    region_depth2   VARCHAR(50),
    visited_at      DATE,
    created_at      TIMESTAMP,
    deleted_at      TIMESTAMP,
    CONSTRAINT uk_place_kakao UNIQUE (memory_id, kakao_place_id)
);

-- 6. place_photo
CREATE TABLE place_photo
(
    place_photo_id BIGSERIAL PRIMARY KEY,
    place_id       BIGINT NOT NULL REFERENCES place (place_id),
    member_id      BIGINT NOT NULL REFERENCES member (member_id),
    image_url      VARCHAR(255),
    created_at     TIMESTAMP,
    deleted_at     TIMESTAMP
);

-- 7. review
CREATE TABLE review
(
    review_id  BIGSERIAL PRIMARY KEY,
    member_id  BIGINT        NOT NULL REFERENCES member (member_id),
    place_id   BIGINT        NOT NULL REFERENCES place (place_id),
    rating     NUMERIC(2, 1),
    content    TEXT,
    visited_at DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT uk_review UNIQUE (place_id, member_id)
);

-- 8. invitation
CREATE TABLE invitation
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
