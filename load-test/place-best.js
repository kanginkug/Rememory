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

/** GET /api/place/best — 내 베스트 장소 (평점 높은 순) */
export default function () {
  const res = http.get(`${BASE_URL}/api/place/best`, { headers: HEADERS });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response is array': (r) => Array.isArray(r.json()),
  });

  sleep(0.5);
}
