/**
 * 전체 사용자 플로우 시나리오
 *
 * 1. 추억 목록 조회
 * 2. 추억 상세 조회
 * 3. 장소 목록 조회
 * 4. 장소 상세 조회
 * 5. 장소 후기 목록 조회
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const TOKEN = __ENV.TOKEN;

export const options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    'http_req_duration{flow:memory}': ['p(95)<300'],
    'http_req_duration{flow:place}': ['p(95)<400'],
    'http_req_duration{flow:review}': ['p(95)<500'],
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

  // 각 추억에 대한 장소 ID 수집
  const memoryPlaces = [];
  for (const memory of memories) {
    const placeRes = http.get(`${BASE_URL}/api/place/${memory.id}`, { headers: HEADERS });
    if (placeRes.status !== 200) continue;
    const places = placeRes.json();
    if (!Array.isArray(places) || places.length === 0) continue;
    memoryPlaces.push({
      memoryId: memory.id,
      placeIds: places.map((p) => p.id),
    });
  }

  if (memoryPlaces.length === 0) throw new Error('setup: 장소가 없습니다. seed_k6_data.sql을 먼저 실행하세요.');

  return { memoryPlaces };
}

export default function (data) {
  const entry = data.memoryPlaces[Math.floor(Math.random() * data.memoryPlaces.length)];
  const { memoryId, placeIds } = entry;
  const placeId = placeIds[Math.floor(Math.random() * placeIds.length)];

  group('memory', () => {
    const listRes = http.get(`${BASE_URL}/api/memory?sortType=DATE_DESC`, {
      headers: HEADERS,
      tags: { flow: 'memory' },
    });
    check(listRes, { '추억 목록 200': (r) => r.status === 200 });

    const detailRes = http.get(`${BASE_URL}/api/memory/${memoryId}`, {
      headers: HEADERS,
      tags: { flow: 'memory' },
    });
    check(detailRes, { '추억 상세 200': (r) => r.status === 200 });
  });

  sleep(0.3);

  group('place', () => {
    const listRes = http.get(`${BASE_URL}/api/place/${memoryId}`, {
      headers: HEADERS,
      tags: { flow: 'place' },
    });
    check(listRes, { '장소 목록 200': (r) => r.status === 200 });

    const detailRes = http.get(`${BASE_URL}/api/place/${memoryId}/${placeId}`, {
      headers: HEADERS,
      tags: { flow: 'place' },
    });
    check(detailRes, { '장소 상세 200': (r) => r.status === 200 });
  });

  sleep(0.3);

  group('review', () => {
    const res = http.get(
      `${BASE_URL}/api/review/memory/${memoryId}/place/${placeId}/all`,
      {
        headers: HEADERS,
        tags: { flow: 'review' },
      }
    );
    check(res, { '후기 목록 200': (r) => r.status === 200 });
  });

  sleep(0.5);
}
