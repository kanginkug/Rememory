-- soft delete 패턴 조회 성능 개선용 부분 인덱스
-- WHERE deleted_at IS NULL / left_at IS NULL 조건이 항상 포함되므로 살아있는 행만 인덱싱

CREATE INDEX idx_memory_creator ON memory(creator_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_place_memory ON place(memory_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_place_photo_place ON place_photo(place_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_review_photo_review ON review_photo(review_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_member_memory_memory ON member_memory(memory_id) WHERE left_at IS NULL;
