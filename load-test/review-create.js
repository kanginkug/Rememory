/**
 * POST /api/review — 후기 작성 (비관적 락 포함)
 *
 * 락 흐름:
 *   Review INSERT → placeRepository.updateRatingOnCreate()
 *     → SELECT FOR UPDATE on place → avg_rating 갱신 → Memory avg_rating 재계산
 *
 * 락 경합 설계:
 *   - VU마다 전용 계정(k6-writer-N)을 사용해 UNIQUE(place_id, member_id) 충돌 방지
 *   - __ITER 기반으로 모든 VU가 같은 이터레이션에서 같은 장소를 타깃
 *     → 50개 VU가 동일한 Place 행에 동시에 SELECT FOR UPDATE → 락 경합 발생
 *
 * 이터레이션 구조:
 *   1. POST /api/review   (create)  → SELECT FOR UPDATE on place
 *   2. GET  /api/review/… (get id)  → reviewId 획득
 *   3. DEL  /api/review/… (delete)  → SELECT FOR UPDATE on place (재작성 허용)
 *
 * 사전 조건:
 *   seed_k6_data.sql 실행 완료 (k6-writer-1~50 계정 + member_memory 세팅)
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const VUS = 50;

export const options = {
  vus: VUS,
  duration: '30s',
  thresholds: {
    // 전체 요청 (create + get + delete 혼합)
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.01'],
    // create 단계만 별도 추적 (락 대기 시간 포함)
    'http_req_duration{op:create}': ['p(95)<1000'],
    'http_req_duration{op:delete}': ['p(95)<800'],
  },
};

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export function setup() {
  // ── 1. VU 전용 writer 토큰 발급 (k6-writer-1 ~ k6-writer-50)
  const writers = [];
  for (let i = 1; i <= VUS; i++) {
    const res = http.post(
      `${BASE_URL}/api/auth/test-login`,
      JSON.stringify({ testUserId: `k6-writer-${i}` }),
      { headers: JSON_HEADERS }
    );
    if (res.status !== 200) {
      throw new Error(`setup: k6-writer-${i} 로그인 실패 (status=${res.status})`);
    }
    writers.push(res.json('accessToken'));
  }

  // ── 2. k6-user-1 토큰으로 (memoryId, placeId) 쌍 수집
  //       writer들은 seed_k6_data.sql에서 이 메모리들의 member로 등록되어 있음
  const mainToken = http.post(
    `${BASE_URL}/api/auth/test-login`,
    JSON.stringify({ testUserId: 'k6-user-1' }),
    { headers: JSON_HEADERS }
  ).json('accessToken');

  const memRes = http.get(`${BASE_URL}/api/memory?sortType=DATE_DESC`, {
    headers: { Authorization: `Bearer ${mainToken}` },
  });
  if (memRes.status !== 200) throw new Error('setup: 추억 목록 조회 실패');

  const memories = memRes.json();
  if (!Array.isArray(memories) || memories.length === 0) {
    throw new Error('setup: 추억이 없습니다. seed_k6_data.sql을 먼저 실행하세요.');
  }

  const pairs = [];
  for (const memory of memories) {
    const placeRes = http.get(`${BASE_URL}/api/place/${memory.id}`, {
      headers: { Authorization: `Bearer ${mainToken}` },
    });
    if (placeRes.status !== 200) continue;
    const places = placeRes.json();
    if (!Array.isArray(places)) continue;
    for (const place of places) {
      pairs.push({ memoryId: memory.id, placeId: place.id });
    }
  }

  if (pairs.length === 0) {
    throw new Error('setup: 장소가 없습니다. seed_k6_data.sql을 먼저 실행하세요.');
  }

  return { writers, pairs };
}

export default function (data) {
  // VU 인덱스 기반 전용 토큰 — 서로 다른 member → UNIQUE 충돌 없음
  const token = data.writers[(__VU - 1) % data.writers.length];
  const headers = authHeaders(token);

  // 모든 VU가 같은 이터레이션에서 같은 장소를 타깃
  // → 50개 VU가 동시에 동일한 Place 행에 락 요청 → 경합 발생
  const pair = data.pairs[__ITER % data.pairs.length];

  // ── 1. 후기 작성 (SELECT FOR UPDATE on place 포함)
  const createRes = http.post(
    `${BASE_URL}/api/review`,
    JSON.stringify({
      memoryId: pair.memoryId,
      placeId: pair.placeId,
      rating: 3.0,
      content: 'k6 부하테스트 후기',
      visitedAt: '2025-01-01',
    }),
    { headers, tags: { op: 'create' } }
  );

  const created = check(createRes, {
    '후기 작성 201': (r) => r.status === 201,
  });

  if (!created) {
    // UNIQUE 충돌(이전 이터레이션 삭제 미완) 또는 기타 오류 → 스킵
    sleep(0.3);
    return;
  }

  // ── 2. 작성한 후기 ID 조회 (삭제에 필요)
  const getRes = http.get(
    `${BASE_URL}/api/review/memory/${pair.memoryId}/place/${pair.placeId}`,
    { headers, tags: { op: 'get' } }
  );

  if (getRes.status !== 200) {
    sleep(0.3);
    return;
  }

  const reviewId = getRes.json('reviewId');

  // ── 3. 후기 삭제 (SELECT FOR UPDATE on place, 다음 이터레이션 재작성 허용)
  const deleteRes = http.del(
    `${BASE_URL}/api/review/memory/${pair.memoryId}/place/${pair.placeId}/review/${reviewId}`,
    null,
    { headers, tags: { op: 'delete' } }
  );

  check(deleteRes, {
    '후기 삭제 204': (r) => r.status === 204,
  });

  sleep(0.5);
}
