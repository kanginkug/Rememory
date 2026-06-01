-- =============================================
-- V3__fix_review_unique_constraint.sql
-- review 테이블 UNIQUE 제약 → 부분 인덱스 교체
-- 문제: UNIQUE(place_id, member_id) 제약이 deleted_at 무관하게 적용되어
--       soft delete 후 동일 멤버가 리뷰 재작성 시 UNIQUE 위반 발생
-- 해결: deleted_at IS NULL 인 레코드에만 UNIQUE 적용하는 부분 인덱스로 교체
-- =============================================

-- 기존 UNIQUE 제약 제거
ALTER TABLE review DROP CONSTRAINT uk_review;

-- 부분 인덱스로 교체
CREATE UNIQUE INDEX uk_review_active ON review(place_id, member_id) WHERE deleted_at IS NULL;
