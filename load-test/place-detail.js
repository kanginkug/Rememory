import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const TOKEN = __ENV.TOKEN;

export const options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const HEADERS = { Authorization: `Bearer ${TOKEN}` };

export function setup() {
  const memRes = http.get(`${BASE_URL}/api/memory?sortType=DATE_DESC`, { headers: HEADERS });
  if (memRes.status !== 200) throw new Error(`setup: 추억 목록 조회 실패 (status=${memRes.status})`);

  const memories = memRes.json();
  if (!Array.isArray(memories) || memories.length === 0) {
    throw new Error('setup: 추억이 없습니다. seed_k6_data.sql을 먼저 실행하세요.');
  }

  const pairs = [];
  for (const memory of memories) {
    const placeRes = http.get(`${BASE_URL}/api/place/${memory.id}`, { headers: HEADERS });
    if (placeRes.status !== 200) continue;
    const places = placeRes.json();
    if (!Array.isArray(places)) continue;
    for (const place of places) {
      pairs.push({ memoryId: memory.id, placeId: place.id });
    }
  }

  if (pairs.length === 0) throw new Error('setup: 장소가 없습니다. seed_k6_data.sql을 먼저 실행하세요.');

  return { pairs };
}

/** GET /api/place/{memoryId}/{placeId} — 장소 상세 조회 */
export default function (data) {
  const pair = data.pairs[Math.floor(Math.random() * data.pairs.length)];

  const res = http.get(`${BASE_URL}/api/place/${pair.memoryId}/${pair.placeId}`, { headers: HEADERS });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has placeId': (r) => r.json('id') === pair.placeId,
  });

  sleep(0.5);
}
