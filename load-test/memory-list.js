import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const TOKEN = __ENV.TOKEN;

export const options = {
  vus: 50,
  duration: '30s',
};

const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
};

export default function () {
  const res = http.get(`${BASE_URL}/api/memory?sortType=DATE_DESC`, {
    headers: HEADERS,
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response is array': (r) => Array.isArray(r.json()),
  });

  sleep(0.5);
}
