# Rememory 부하 테스트 (k6)

## k6 설치 (Windows)

### Chocolatey
```powershell
choco install k6
```

### winget
```powershell
winget install k6 --source winget
```

### 직접 다운로드
https://k6.io/docs/get-started/installation/ 에서 Windows installer(.msi) 다운로드 후 설치

설치 확인:
```powershell
k6 version
```

---

## 테스트용 JWT 발급

백엔드에 내장된 테스트 전용 로그인 API(`POST /api/auth/test-login`)를 사용합니다.
**`prod` 프로필에서는 이 엔드포인트가 비활성화됩니다.**

### curl (Git Bash / WSL)
```bash
curl -s -X POST http://localhost:8080/api/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"testUserId": "k6-user-1"}' \
  | jq -r '.accessToken'
```

### PowerShell
```powershell
$body = '{"testUserId": "k6-user-1"}'
$res  = Invoke-RestMethod -Method Post `
          -Uri "http://localhost:8080/api/auth/test-login" `
          -ContentType "application/json" `
          -Body $body
$TOKEN = $res.accessToken
```

- `testUserId`는 임의 문자열이며, 최초 호출 시 해당 ID로 테스트 계정이 자동 생성됩니다.
- 이후 동일한 `testUserId`로 호출하면 기존 계정을 재사용합니다.
- `memory-detail.js`는 setup 단계에서 해당 계정의 추억 목록을 조회합니다.  
  테스트 전에 해당 계정으로 추억을 1개 이상 생성해 두어야 합니다.

---

## 더미데이터 생성

`load-test/seed_k6_data.sql`로 테스트 계정(`k6-user-1`)에 추억·장소·후기 더미데이터를 생성합니다.

```powershell
Get-Content load-test/seed_k6_data.sql | docker exec -i rememory-postgres psql -U inkug -d rememory
```

- 추억(memory) 20개, 장소(place) 100개(추억당 5개), 후기(review) 100개(장소당 1개) 생성
- `review-create.js` 동시성 테스트용으로 `k6-writer-1 ~ k6-writer-50` 전용 계정과
  `member_memory` 매핑(50명 × 20개 추억 = 1000건)도 함께 생성
- 기존 데이터를 정리한 뒤 새로 생성 (재실행 가능)
- 생성 결과 확인:

```powershell
docker exec -it rememory-postgres psql -U inkug -d rememory -c "SELECT COUNT(*) FROM memory WHERE creator_id = (SELECT member_id FROM member WHERE oauth_id = 'k6-user-1');"
```

---

## 실행 명령어

> 읽기 API는 50 VUs × 30초, p(95) < 500ms / 에러율 < 1% 기준.
> `review-create.js`(쓰기, 비관적 락)는 동일 조건에 create p(95) < 1000ms, delete p(95) < 800ms 기준 추가.

```powershell
# JWT 발급 (PowerShell)
$res   = Invoke-RestMethod -Method Post -Uri "http://localhost:8080/api/auth/test-login" -ContentType "application/json" -Body '{"testUserId": "k6-user-1"}'
$TOKEN = $res.accessToken
```

| 파일 | 대상 API | 설명 |
|------|----------|------|
| `memory-list.js`   | GET /api/memory | 추억 목록 |
| `memory-detail.js` | GET /api/memory/{id} | 추억 상세 |
| `place-list.js`    | GET /api/place/{memoryId} | 장소 목록 |
| `place-detail.js`  | GET /api/place/{memoryId}/{placeId} | 장소 상세 |
| `place-best.js`    | GET /api/place/best | 베스트 장소 |
| `review-all.js`    | GET /api/review/memory/{memoryId}/place/{placeId}/all | 장소 전체 후기 |
| `review-recent.js`  | GET /api/review/recent | 최근 후기 |
| `review-create.js`  | POST /api/review (create→get→delete) | **비관적 락 쓰기** |
| `scenario-full.js`  | 위 5개 API 순차 호출 | 전체 사용자 플로우 |

```bash
# 단일 API 테스트 (읽기)
k6 run --env TOKEN=<토큰> load-test/memory-list.js
k6 run --env TOKEN=<토큰> load-test/memory-detail.js
k6 run --env TOKEN=<토큰> load-test/place-list.js
k6 run --env TOKEN=<토큰> load-test/place-detail.js
k6 run --env TOKEN=<토큰> load-test/place-best.js
k6 run --env TOKEN=<토큰> load-test/review-all.js
k6 run --env TOKEN=<토큰> load-test/review-recent.js

# 쓰기(비관적 락) 테스트 — k6-writer-1~50 계정을 setup에서 자동 발급
k6 run --env TOKEN=<토큰> load-test/review-create.js

# 전체 플로우 시나리오 (추억→장소→후기 순차 조회)
k6 run --env TOKEN=<토큰> load-test/scenario-full.js
```

### BASE_URL 변경 (기본값: http://localhost:8080)
```bash
k6 run \
  --env BASE_URL=https://api.rememory.example.com \
  --env TOKEN=<토큰> \
  load-test/scenario-full.js
```

### review-create.js 재실행 시 주의사항
- 1인 1후기 제약(`UNIQUE(place_id, member_id)`) 때문에, 각 VU는 작성 → 삭제를 반복하는
  구조로 작성되어 있습니다.
- 직전 실행이 비정상 종료(Ctrl+C 등)되어 후기가 삭제되지 못한 상태로 남아 있으면,
  다음 실행에서 UNIQUE 충돌로 일부 이터레이션이 스킵될 수 있습니다.
- 이 경우 `seed_k6_data.sql`을 재실행해 데이터를 초기화한 뒤 다시 테스트하세요.

---

## 결과 지표 해석

```
✓ status is 200

checks.........................: 99.87%  ✓ 8990  ✗ 11
http_req_duration..............: avg=42ms  min=8ms  med=35ms  max=612ms  p(90)=78ms  p(95)=120ms  p(99)=310ms
http_req_failed................: 0.12%   ✓ 11    ✗ 8990
iterations.....................: 9001    150.01/s
```

| 지표 | 설명 | 목표 기준 |
|------|------|-----------|
| `http_req_duration p(95)` | 요청의 95%가 이 시간 안에 완료됨. SLA 기준으로 가장 많이 씀 | < 500ms |
| `http_req_duration p(99)` | 요청의 99%가 이 시간 안에 완료됨. 꼬리 지연(tail latency) 확인 | < 1s |
| `http_req_failed` | 네트워크 오류 또는 4xx/5xx 응답 비율. 0에 가까울수록 좋음 | < 1% |
| `iterations` | 전체 반복 횟수 및 초당 처리량(RPS). 처리 능력 지표 | 높을수록 좋음 |
| `checks` | `check()` 검증 통과율. 응답 내용이 올바른지 확인 | 100% |

### p95/p99가 높을 때 체크리스트
- DB 인덱스 누락 (`memory_id`, `member_id` FK 인덱스 확인)
- N+1 쿼리 발생 여부 (Fetch Join 미적용)
- DB 커넥션 풀 부족 (`HikariCP` 설정 확인)
- JVM GC pause (힙 설정 확인)

---

## 실제 테스트 결과

### 테스트 환경
- 로컬(localhost:8080), Docker Compose로 띄운 Spring Boot + PostgreSQL 16
- 읽기 테스트 계정: `k6-user-1` (테스트 전용 로그인 API로 생성)
- 쓰기(락) 테스트 계정: `k6-writer-1 ~ k6-writer-50` (VU마다 전용 계정, UNIQUE 충돌 방지)
- 더미데이터: `seed_k6_data.sql`로 생성
  - 추억(memory) 20개, 장소(place) 100개(추억당 5개), 후기(review) 100개(장소당 1개)
  - writer 계정 50개, member_memory 매핑 1000건(50명 × 20개 추억)
- 시나리오: 50 VUs, 30초

### 읽기 API 전체 결과

| API | 스크립트 | p(95) | RPS | 에러율 |
|---|---|---|---|---|
| GET /api/memory | memory-list.js | 38.68ms | 95.51/s | 0% |
| GET /api/memory/{id} | memory-detail.js | 30.6ms | 95.77/s | 0% |
| GET /api/place/{memoryId} | place-list.js | 26.86ms | 95.52/s | 0% |
| GET /api/place/{memoryId}/{placeId} | place-detail.js | 27.02ms | 96.93/s | 0% |
| GET /api/place/best | place-best.js | 25.98ms | 96.01/s | 0% |
| GET /api/review/.../all | review-all.js | 25.72ms | 96.99/s | 0% |
| GET /api/review/recent | review-recent.js | 27.72ms | 96.97/s | 0% |

50명의 동시 사용자가 30초간 끊임없이 요청을 보냈을 때, 모든 읽기 API가 에러 없이 p(95) 40ms 이내로 응답했다. 목표 기준(p95 < 500ms)을 큰 폭으로 밑도는 수치다.

### 전체 사용자 플로우 (scenario-full.js)

추억 목록 → 추억 상세 → 장소 목록 → 장소 상세 → 후기 목록을 5단계 순차로 호출하는 시나리오.

```
http_req_duration (전체)......: p(95)=134.88ms
  { flow:memory }..............: p(95)=175.65ms   (추억 목록+상세)
  { flow:place }................: p(95)=68.78ms    (장소 목록+상세)
  { flow:review }...............: p(95)=13.86ms    (후기 목록)
http_req_failed................: 0.00%
```

단계별로 보면 `flow:memory`가 가장 느린데, 두 번의 조회(목록+상세)가 순차로 누적되는 구간이라 자연스러운 결과다. 전체 플로우 기준 p(95) 134.88ms로, 사용자가 앱에서 추억을 열어보는 일반적인 흐름에서 체감하는 지연은 충분히 낮은 수준이다.

### POST /api/review — 비관적 락 쓰기 (review-create.js)

평균 별점 갱신 로직은 `Place` 행에 `SELECT FOR UPDATE`를 거는 비관적 락으로 구현되어 있다. 50개의 VU(각각 다른 계정)가 매 이터레이션마다 **동일한 Place 행을 동시에 타깃**하도록 설계해 락 경합을 의도적으로 유발했다.

```
checks_succeeded................: 100.00% 5396 out of 5396
http_req_failed..................: 0.00%   0 out of 8166
http_req_duration { op:create }..: p(95)=45.36ms
http_req_duration { op:delete }..: p(95)=43.4ms
http_reqs........................: 8166   263.84/s
```

50개 VU가 동시에 같은 행에 락을 요청했음에도 create 단계 p(95)가 45.36ms로, 일반 읽기 API(20~30ms대)와 큰 차이를 보이지 않았다. 트랜잭션이 "락 획득 → avg_rating 갱신 → Memory avg_rating 재계산"으로 짧게 끝나기 때문에 락 점유 시간 자체가 짧아, 50개 동시 요청 규모에서는 락 대기로 인한 지연이 두드러지지 않은 것으로 보인다.

### 종합

| 구분 | p(95) 범위 | 비고 |
|---|---|---|
| 단순 읽기 (목록/상세/베스트) | 25~39ms | 모두 목표치 대비 10배 이상 여유 |
| 순차 플로우 (5단계) | 135ms | 단계 누적에도 충분히 빠름 |
| 비관적 락 쓰기 (create/delete) | 43~45ms | 락 경합 상황에서도 읽기와 유사한 수준 |

현재 트래픽 규모(개인 프로젝트 MVP 단계)와 인스턴스 사양(t3.micro 수준)을 기준으로, 별도의 캐싱이나 인덱스 추가 작업 없이도 50명 동시 사용자 수준까지는 충분한 성능을 확보하고 있다고 판단했다. 특히 비관적 락을 사용한 쓰기 작업이 일반 읽기와 비슷한 응답속도를 유지한 점은, 트랜잭션 범위를 최소화한 설계(Place만 락을 걸고 Memory는 일반 UPDATE로 처리)가 의도대로 동작하고 있음을 보여준다.
