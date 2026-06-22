-- =============================================
-- k6 부하테스트용 시드 데이터
-- 재실행 가능: 기존 k6-user-1 데이터를 정리 후 재삽입
--
-- 전제: test-login API 또는 이 스크립트로 k6-user-1 계정이 생성됨
--   psql -U postgres -d rememory -f load-test/seed_k6_data.sql
--
-- 결과: k6-user-1 계정 기준
--   추억  20개
--   장소 100개 (추억당 5개)
--   후기 100개 (장소당 1개)
-- =============================================

BEGIN;

-- ─── 1. 기존 k6-user-1 데이터 정리 ───────────────────────────
DELETE FROM review
WHERE place_id IN (
    SELECT p.place_id
    FROM place p
    JOIN memory m ON p.memory_id = m.memory_id
    WHERE m.creator_id = (
        SELECT member_id FROM member
        WHERE oauth_provider = 'TEST' AND oauth_id = 'k6-user-1'
    )
);

DELETE FROM place
WHERE memory_id IN (
    SELECT memory_id FROM memory
    WHERE creator_id = (
        SELECT member_id FROM member
        WHERE oauth_provider = 'TEST' AND oauth_id = 'k6-user-1'
    )
);

DELETE FROM member_memory
WHERE memory_id IN (
    SELECT memory_id FROM memory
    WHERE creator_id = (
        SELECT member_id FROM member
        WHERE oauth_provider = 'TEST' AND oauth_id = 'k6-user-1'
    )
);

DELETE FROM memory
WHERE creator_id = (
    SELECT member_id FROM member
    WHERE oauth_provider = 'TEST' AND oauth_id = 'k6-user-1'
);

-- ─── 시퀀스 보정: 리셋으로 인한 PK 충돌 방지 ────────────────
-- member_memory는 BIGSERIAL이지만 시퀀스가 기존 데이터보다 낮을 수 있음
SELECT setval(
    'member_memory_member_memory_id_seq',
    (SELECT COALESCE(MAX(member_memory_id), 0) FROM member_memory)
);

-- ─── 2. k6-user-1 계정 생성 (이미 있으면 유지) ───────────────
INSERT INTO member (name, email, profile_image_url, oauth_provider, oauth_id, created_at)
VALUES ('k6 테스트 유저', NULL, NULL, 'TEST', 'k6-user-1', NOW())
ON CONFLICT (oauth_provider, oauth_id) DO NOTHING;

-- ─── 3. 추억 20개 생성 ───────────────────────────────────────
INSERT INTO memory (creator_id, name, description, avg_rating, place_count, member_count, show_history_to_new, start_date, end_date, created_at)
SELECT
    (SELECT member_id FROM member WHERE oauth_provider = 'TEST' AND oauth_id = 'k6-user-1'),
    'k6 부하테스트 추억 #' || LPAD(i::text, 2, '0'),
    'k6 부하테스트 ' || i || '번 추억입니다. 총 5개 장소, 각 장소에 후기 1개 포함.',
    0.00,
    0,
    1,
    TRUE,
    CURRENT_DATE - (i * 7 + 90),
    CURRENT_DATE - (i * 7 + 90) + 4,
    NOW() - ((i * 3) || ' hours')::INTERVAL
FROM generate_series(1, 20) AS s(i);

-- ─── 4. member_memory 매핑 ───────────────────────────────────
INSERT INTO member_memory (member_id, memory_id, joined_at)
SELECT
    (SELECT member_id FROM member WHERE oauth_provider = 'TEST' AND oauth_id = 'k6-user-1'),
    memory_id,
    NOW()
FROM memory
WHERE creator_id = (
    SELECT member_id FROM member WHERE oauth_provider = 'TEST' AND oauth_id = 'k6-user-1'
);

-- ─── 5. 장소 100개 생성 (추억당 5개) ────────────────────────────
-- category: RESTAURANT(1), CAFE(2), ATTRACTION(3), ACCOMMODATION(4), RESTAURANT(5)
-- region: 서울 강남구(1), 서울 마포구(2), 부산 해운대구(3), 제주 서귀포시(4), 경기 분당구(5)
INSERT INTO place (
    memory_id, creator_id, name, kakao_place_name, category,
    address, detail_address, kakao_place_id,
    latitude, longitude,
    avg_rating, review_count,
    region_depth1, region_depth2,
    visited_at, created_at, description
)
SELECT
    m.memory_id,
    m.creator_id,
    CASE (j % 4)
        WHEN 1 THEN '레스토랑'
        WHEN 2 THEN '카페'
        WHEN 3 THEN '관광지'
        WHEN 0 THEN '숙소'
    END || ' ' || m.rn || '-' || j,
    CASE (j % 4)
        WHEN 1 THEN '레스토랑'
        WHEN 2 THEN '카페'
        WHEN 3 THEN '관광지'
        WHEN 0 THEN '숙소'
    END || ' ' || m.rn || '-' || j,
    CASE (j % 4)
        WHEN 1 THEN 'RESTAURANT'
        WHEN 2 THEN 'CAFE'
        WHEN 3 THEN 'ATTRACTION'
        WHEN 0 THEN 'ACCOMMODATION'
    END,
    CASE (j % 5)
        WHEN 1 THEN '서울특별시 강남구 테헤란로'
        WHEN 2 THEN '서울특별시 마포구 홍대로'
        WHEN 3 THEN '부산광역시 해운대구 해운대로'
        WHEN 4 THEN '제주특별자치도 서귀포시 중문관광로'
        WHEN 0 THEN '경기도 성남시 분당구 판교로'
    END || ' ' || (m.rn * 5 + j),
    NULL,
    NULL,
    37.4989 + (m.rn::numeric * 0.01) + (j::numeric * 0.001),
    127.0283 + (m.rn::numeric * 0.01) + (j::numeric * 0.001),
    0.00,
    0,
    CASE (j % 5)
        WHEN 1 THEN '서울'
        WHEN 2 THEN '서울'
        WHEN 3 THEN '부산'
        WHEN 4 THEN '제주'
        WHEN 0 THEN '경기'
    END,
    CASE (j % 5)
        WHEN 1 THEN '강남구'
        WHEN 2 THEN '마포구'
        WHEN 3 THEN '해운대구'
        WHEN 4 THEN '서귀포시'
        WHEN 0 THEN '분당구'
    END,
    CURRENT_DATE - (m.rn * 7 + j + 85)::int,
    NOW() - ((m.rn * 5 + j) || ' hours')::INTERVAL,
    'k6 부하테스트용 장소입니다. (memory=' || m.rn || ', place=' || j || ')'
FROM (
    SELECT memory_id, creator_id,
           ROW_NUMBER() OVER (ORDER BY memory_id) AS rn
    FROM memory
    WHERE creator_id = (
        SELECT member_id FROM member
        WHERE oauth_provider = 'TEST' AND oauth_id = 'k6-user-1'
    )
) m
CROSS JOIN generate_series(1, 5) AS p(j);

-- ─── 6. 후기 100개 생성 (장소당 1개, k6-user-1 작성) ────────────
-- 별점: 1.0 ~ 5.0, 0.5 단위, 9개 값이 순환
INSERT INTO review (member_id, place_id, rating, content, visited_at, created_at, updated_at)
SELECT
    p.creator_id,
    p.place_id,
    ROUND(0.5 * ((ROW_NUMBER() OVER (ORDER BY p.place_id) - 1) % 9)::numeric + 1.0, 1),
    'k6 부하테스트 후기입니다. 자동 생성된 테스트 데이터입니다. 장소: ' || p.place_id,
    p.visited_at,
    NOW(),
    NOW()
FROM place p
JOIN memory m ON p.memory_id = m.memory_id
WHERE m.creator_id = (
    SELECT member_id FROM member
    WHERE oauth_provider = 'TEST' AND oauth_id = 'k6-user-1'
);

-- ─── 7. place 통계 갱신 ──────────────────────────────────────
UPDATE place p
SET avg_rating   = r.rating,
    review_count = 1
FROM review r
JOIN member mb ON r.member_id = mb.member_id
WHERE r.place_id = p.place_id
  AND mb.oauth_provider = 'TEST'
  AND mb.oauth_id = 'k6-user-1';

-- ─── 8. memory 통계 갱신 ─────────────────────────────────────
UPDATE memory m
SET avg_rating  = ROUND(stats.avg_r, 2),
    place_count = stats.cnt
FROM (
    SELECT p.memory_id,
           AVG(p.avg_rating) AS avg_r,
           COUNT(*)           AS cnt
    FROM place p
    JOIN memory mm ON p.memory_id = mm.memory_id
    WHERE mm.creator_id = (
        SELECT member_id FROM member
        WHERE oauth_provider = 'TEST' AND oauth_id = 'k6-user-1'
    )
    GROUP BY p.memory_id
) stats
WHERE m.memory_id = stats.memory_id;

-- ─── 9. k6-writer-1 ~ k6-writer-50 계정 생성 ────────────────
-- review-create.js에서 VU당 전용 계정으로 사용 (UNIQUE 충돌 방지)
INSERT INTO member (name, email, profile_image_url, oauth_provider, oauth_id, created_at)
SELECT 'k6 작성자 ' || i, NULL, NULL, 'TEST', 'k6-writer-' || i, NOW()
FROM generate_series(1, 50) AS s(i)
ON CONFLICT (oauth_provider, oauth_id) DO NOTHING;

-- ─── 10. writer 계정을 k6-user-1의 추억에 참여시킴 ──────────
-- 후기 작성 권한 부여 (mmRepository.findActiveByMemoryIdAndMemberId 통과)
INSERT INTO member_memory (member_id, memory_id, joined_at)
SELECT w.member_id, m.memory_id, NOW()
FROM member w
CROSS JOIN (
    SELECT memory_id FROM memory
    WHERE creator_id = (
        SELECT member_id FROM member WHERE oauth_provider = 'TEST' AND oauth_id = 'k6-user-1'
    )
) m
WHERE w.oauth_provider = 'TEST' AND w.oauth_id LIKE 'k6-writer-%'
ON CONFLICT (member_id, memory_id) DO NOTHING;

COMMIT;

-- ─── 결과 확인 ───────────────────────────────────────────────
SELECT '======= k6 시드 데이터 삽입 완료 =======' AS result;

SELECT tbl, cnt
FROM (
    SELECT 1 AS ord, 'memories' AS tbl, COUNT(*) AS cnt
    FROM memory
    WHERE creator_id = (
        SELECT member_id FROM member
        WHERE oauth_provider = 'TEST' AND oauth_id = 'k6-user-1'
    )
    UNION ALL
    SELECT 2, 'places', COUNT(*)
    FROM place
    WHERE memory_id IN (
        SELECT memory_id FROM memory
        WHERE creator_id = (
            SELECT member_id FROM member
            WHERE oauth_provider = 'TEST' AND oauth_id = 'k6-user-1'
        )
    )
    UNION ALL
    SELECT 3, 'reviews (k6-user-1)', COUNT(*)
    FROM review
    WHERE member_id = (
        SELECT member_id FROM member
        WHERE oauth_provider = 'TEST' AND oauth_id = 'k6-user-1'
    )
    UNION ALL
    SELECT 4, 'writer accounts', COUNT(*)
    FROM member
    WHERE oauth_provider = 'TEST' AND oauth_id LIKE 'k6-writer-%'
    UNION ALL
    SELECT 5, 'writer member_memory', COUNT(*)
    FROM member_memory
    WHERE member_id IN (
        SELECT member_id FROM member
        WHERE oauth_provider = 'TEST' AND oauth_id LIKE 'k6-writer-%'
    )
) t
ORDER BY ord;
