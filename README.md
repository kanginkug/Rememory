# Rememory

> 친구들과 함께 장소 기반 추억을 기록하고, 별점·후기를 공유하는 소셜 PWA

**개발 기간**: 2026.05 ~ 2026.07 (12주) | **개발 인원**: 1인

---

## 목차

- [서비스 소개](#서비스-소개)
- [기술 스택](#기술-스택)
- [아키텍처](#아키텍처)
- [주요 기능](#주요-기능)
- [ERD](#erd)
- [핵심 구현](#핵심-구현)
- [로컬 실행](#로컬-실행)

---

## 서비스 소개

여행이나 모임에서 함께 방문한 장소를 기록하고, 각자의 별점과 후기를 남기는 앱입니다.  
"같은 곳을 바라보며 의견을 공유한다"는 컨셉으로, 그룹(추억) 단위로 장소를 관리하고 멤버끼리 서로의 후기를 볼 수 있습니다.

- **추억(Memory)**: 여행/모임 단위의 그룹. 초대 링크로 멤버를 추가합니다.
- **장소(Place)**: 추억 안에 등록하는 방문 장소. 카카오맵으로 검색해 좌표·주소를 자동 입력합니다.
- **후기(Review)**: 장소당 1인 1후기. 별점(0.5 단위), 사진, 텍스트로 구성됩니다.

---

## 기술 스택

| 분류 | 기술 |
|---|---|
| **Backend** | Java 17, Spring Boot 4, Spring Security + JWT, JPA, QueryDSL |
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS, PWA |
| **Database** | PostgreSQL 16, Flyway |
| **Infra** | AWS EC2 / RDS / S3, Docker, GitHub Actions CI/CD, Vercel |
| **External** | Kakao OAuth / Map / Share SDK, Firebase Admin SDK (FCM) |

---

## 아키텍처

```
[사용자]
   │
   ├─ PWA (Next.js) ──────── Vercel
   │
   └─ API 요청
        │
        └─ Nginx (EC2)
              │
              └─ Spring Boot (Docker)
                    │
                    ├─ AWS RDS (PostgreSQL 16)
                    └─ AWS S3 (이미지)

[CI/CD]
  git push (main)
    → GitHub Actions: 빌드 + Docker Hub push
    → EC2의 Watchtower가 30초 주기로 감지 → 자동 pull & 재시작

[FCM]
  이벤트 발생 (장소 추가 / 후기 작성 / 초대 수락)
    → Firebase Admin SDK → FCM → 멤버 기기 (푸시 알림)
```

---

## 주요 기능

### 추억 관리
- 추억 생성, 수정, 삭제 / 추억 나가기
- UUID 기반 초대 링크 생성 → 카카오톡 공유로 멤버 초대
- 추억 표지 사진 (S3 업로드)

### 장소 관리
- 카카오 키워드 검색으로 장소 등록 (좌표·주소 자동 입력)
- 카테고리(맛집/카페/숙소/관광지) 및 지역(시/도 → 시/군/구) 필터
- 장소명 검색
- 카카오맵에서 내 방문 장소 핀 전체 조회

### 후기 관리
- 1인 1후기 (작성 후 UPDATE, 재작성 불가)
- 별점 0.5 단위, 후기 사진 최대 3장
- 정렬: 최신순 / 오래된순 / 별점 높은순 / 낮은순
- 내 전체 후기 목록 조회

### 홈 화면
- 베스트 장소 (평균 별점 높은 순 5개)
- 최근 추억 목록
- 최근 작성한 후기

### 인증
- 카카오 OAuth / 구글 OAuth 소셜 로그인
- Access Token (30분) + Refresh Token (7일) 자동 갱신

### FCM 푸시 알림
- 장소 추가 / 후기 작성 / 초대 수락 시 추억 멤버 전원에게 알림
- 전체 알림 ON/OFF + 타입별(장소/후기/초대) 개별 설정

---

## ERD

```
Member ─── Member_Memory ─── Memory ─── Memory_Photo
                                │
                                ├─ Invitation
                                │
                                └─ Place ─── Place_Photo
                                     │
Member ─────────────────────────── Review (UNIQUE: place_id + member_id)
                                     │
                                   Review_Photo
```

| 테이블 | 설명 |
|---|---|
| member | 회원 (Kakao/Google OAuth) |
| memory | 추억/여행 단위 그룹 |
| member_memory | 멤버 ↔ 추억 매핑 |
| memory_photo | 추억 표지 사진 (1장) |
| place | 장소 (맛집/숙소/관광지/카페) |
| place_photo | 장소 사진 (여러 장) |
| review | 개인 별점/후기 (1인 1후기) |
| review_photo | 후기 사진 (여러 장) |
| invitation | 추억 초대 링크 (UUID 기반) |

---

## 핵심 구현

### 1. 동시성 제어 — 비관적 락으로 평균 별점 정합성 보장

후기 추가/수정/삭제 시 여러 사람이 동시에 별점을 남기면 avg_rating이 잘못 계산될 수 있습니다.

```
1. Place SELECT FOR UPDATE (비관적 락)
2. Review INSERT / UPDATE / DELETE
3. Place.avg_rating, review_count 재계산
4. Memory.avg_rating 재계산 (락 없이 — 통계성 데이터, 약간의 불일치 허용)
5. COMMIT
```

Place는 비관적 락으로 정확성을 보장하고, 상위 집계인 Memory는 락 범위를 최소화해 성능을 유지했습니다.

---

### 2. N+1 문제 해결

**장소 목록 대표이미지 조회**

장소당 N개 사진 중 1장만 필요한 상황에서, 장소마다 개별 쿼리를 날리는 N+1 대신 PostgreSQL `DISTINCT ON`으로 쿼리 1번에 처리했습니다.

```sql
SELECT DISTINCT ON (place_id) place_id, image_url
FROM place_photo
WHERE place_id IN (:placeIds) AND deleted_at IS NULL
ORDER BY place_id, created_at ASC
```

**추억 상세 — 멤버 LAZY 로딩**

`MemberMemory` 조회 후 `mm.getMember()` 접근 시 멤버 수(N)만큼 LAZY 로딩이 발생했습니다. `findActiveByMemoryId`에 `fetchJoin(QMember.member)` 추가로 해결했습니다.

---

### 3. CI/CD — SSH 없는 Pull 방식 자동 배포

GitHub Actions에서 EC2에 SSH로 직접 배포하면 22번 포트를 전체 공개해야 하는 보안 문제가 있었습니다.

**해결**: Watchtower(Pull 방식) 도입

```
git push (main 브랜치)
  → GitHub Actions: Docker 이미지 빌드 + Docker Hub push (latest + 커밋 SHA 태그)
  → EC2의 Watchtower가 30초 주기로 Docker Hub 감지
  → 새 이미지 자동 pull & 컨테이너 재시작
```

EC2 SSH 포트(22번)는 본인 IP 전용으로 유지하면서 자동 배포를 구현했습니다.  
추가로 GitHub Environment로 배포 승인 단계를 두고, SHA 태그 이미지로 롤백 대비를 갖췄습니다.

---

### 4. FCM 웹 푸시 — iOS PWA 4가지 이슈 해결

PWA 환경에서 iOS 푸시 알림이 동작하지 않는 원인이 4가지 겹쳐 있었습니다.

| 이슈 | 원인 | 해결 |
|---|---|---|
| 권한 요청 무시 | iOS는 페이지 로드 시 자동 권한 요청 차단 | 버튼 클릭 핸들러 내에서만 호출 |
| 백그라운드 알림 미수신 | next-pwa의 `sw.js`와 `firebase-messaging-sw.js`가 같은 scope 충돌 | `getRegistration('/')`으로 기존 SW 재사용 |
| 알림 클릭 라우팅 불가 | Firebase 백그라운드 핸들러가 sw.js 밖에 있어 동작 안 함 | `worker/index.ts`에 Firebase 핸들러 통합 → sw.js에 번들 |
| 로그인 후 토큰 발급 실패 | OAuth 콜백 이전에 FCM 초기화가 실행되어 JWT 없이 토큰 요청 | 로그인 완료 시 커스텀 이벤트(`auth-login`) dispatch → FcmInit 재실행 |

---

### 5. Spring Boot 4 마이그레이션

Spring Boot 4에서 autoconfigure 모듈이 기술별로 분리되면서 `flyway-core`만으로는 Flyway 자동 실행이 되지 않는 문제를 발견했습니다.

```groovy
// Before — Flyway 자동 실행 안 됨
implementation 'org.flywaydb:flyway-core'

// After
implementation 'org.springframework.boot:spring-boot-starter-flyway'
implementation 'org.flywaydb:flyway-database-postgresql'
```

또한 Hibernate 6+의 시퀀스 네이밍 규칙(`member_seq`)과 `BIGSERIAL` 자동 생성 이름(`member_member_id_seq`) 불일치로 인한 Schema validation 실패도 분석·해결했습니다.

---

## 로컬 실행

### 사전 요구사항

- Java 17, Docker, Node.js 20+

### 백엔드

```bash
# PostgreSQL 실행
docker-compose up -d postgres

# 환경 변수 설정 (.env 또는 IntelliJ Run Configuration에 Active profiles=local 설정)
cd backend
./gradlew bootRun
```

### 프론트엔드

```bash
cd frontend
cp .env.example .env.local  # 환경 변수 설정
npm install
npm run dev
```

### 환경 변수 (백엔드)

| 변수명 | 설명 |
|---|---|
| `KAKAO_CLIENT_ID` | 카카오 REST API 키 |
| `KAKAO_CLIENT_SECRET` | 카카오 클라이언트 시크릿 |
| `GOOGLE_CLIENT_ID` | 구글 OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | 구글 OAuth 클라이언트 시크릿 |
| `JWT_SECRET` | JWT 서명 키 (256비트 이상) |
| `S3_ACCESS_KEY` | AWS 액세스 키 |
| `S3_SECRET_KEY` | AWS 시크릿 키 |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Firebase 서비스 계정 JSON 경로 |
| `FRONTEND_URL` | 프론트엔드 URL (CORS 허용) |

### 환경 변수 (프론트엔드)

| 변수명 | 설명 |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | 백엔드 API URL |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 카카오 JavaScript 앱 키 |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase 웹 앱 설정값 |

---

**개발자**: 강인국 | rkddlsrnr1234@gmail.com
