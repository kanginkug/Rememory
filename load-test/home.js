/**
 * 홈 화면 부하테스트
 *
 * 홈 진입 시 브라우저가 병렬로 호출하는 3개 API를 http.batch()로 동시 실행:
 *   1. GET /api/place/best       — 우리 추억 장소 베스트 (5개)
 *   2. GET /api/memory?sortType=DATE_DESC — 최근 추억 카드 (3~4개)
 *   3. GET /api/review/recent    — 내 추억 최근 리뷰 (10개)
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const TOKEN = __ENV.TOKEN;

export const options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    // 홈 화면 전체 로딩 기준 (가장 느린 API 기준)
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    // API별 개별 기준
    'http_req_duration{api:place_best}': ['p(95)<400'],
    'http_req_duration{api:memory_list}': ['p(95)<400'],
    'http_req_duration{api:review_recent}': ['p(95)<300'],
  },
};

const HEADERS = { Authorization: `Bearer ${TOKEN}` };

/** 홈 화면 진입: 3개 API 병렬 호출 */
export default function () {
  const responses = http.batch([
    {
      method: 'GET',
      url: `${BASE_URL}/api/place/best`,
      params: { headers: HEADERS, tags: { api: 'place_best' } },
    },
    {
      method: 'GET',
      url: `${BASE_URL}/api/memory?sortType=DATE_DESC`,
      params: { headers: HEADERS, tags: { api: 'memory_list' } },
    },
    {
      method: 'GET',
      url: `${BASE_URL}/api/review/recent`,
      params: { headers: HEADERS, tags: { api: 'review_recent' } },
    },
  ]);

  check(responses[0], { '베스트 장소 200': (r) => r.status === 200 });
  check(responses[1], { '최근 추억 200': (r) => r.status === 200 });
  check(responses[2], { '최근 리뷰 200': (r) => r.status === 200 });

  sleep(1);
}
