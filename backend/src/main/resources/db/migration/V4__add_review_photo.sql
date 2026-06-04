CREATE TABLE review_photo
(
    review_photo_id BIGSERIAL PRIMARY KEY,
    review_id       BIGINT NOT NULL REFERENCES review (review_id),
    member_id       BIGINT NOT NULL REFERENCES member (member_id),
    image_url       VARCHAR(255),
    create_at       TIMESTAMP,
    deleted_at      TIMESTAMP
);
