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

/** 테스트 시작 전 1회 실행: 추억 목록에서 ID 목록을 수집한다 */
export function setup() {
  const res = http.get(`${BASE_URL}/api/memory?sortType=DATE_DESC`, {
    headers: HEADERS,
  });

  if (res.status !== 200) {
    throw new Error(`setup: 추억 목록 조회 실패 (status=${res.status})`);
  }

  const memories = res.json();
  if (!Array.isArray(memories) || memories.length === 0) {
    throw new Error('setup: 조회된 추억이 없습니다. 테스트 계정에 추억을 먼저 생성하세요.');
  }

  return { memoryIds: memories.map((m) => m.id) };
}

export default function (data) {
  const memoryId = data.memoryIds[Math.floor(Math.random() * data.memoryIds.length)];

  const res = http.get(`${BASE_URL}/api/memory/${memoryId}`, {
    headers: HEADERS,
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has memoryId': (r) => r.json('id') === memoryId,
  });

  sleep(0.5);
}
