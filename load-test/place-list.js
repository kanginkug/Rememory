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
  const res = http.get(`${BASE_URL}/api/memory?sortType=DATE_DESC`, { headers: HEADERS });
  if (res.status !== 200) throw new Error(`setup: 추억 목록 조회 실패 (status=${res.status})`);

  const memories = res.json();
  if (!Array.isArray(memories) || memories.length === 0) {
    throw new Error('setup: 추억이 없습니다. seed_k6_data.sql을 먼저 실행하세요.');
  }

  return { memoryIds: memories.map((m) => m.id) };
}

/** GET /api/place/{memoryId} — 추억 내 전체 장소 목록 */
export default function (data) {
  const memoryId = data.memoryIds[Math.floor(Math.random() * data.memoryIds.length)];

  const res = http.get(`${BASE_URL}/api/place/${memoryId}`, { headers: HEADERS });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response is array': (r) => Array.isArray(r.json()),
  });

  sleep(0.5);
}
