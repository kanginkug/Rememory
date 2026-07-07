const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function setToken(token: string) {
  localStorage.setItem('accessToken', token);
}

export function removeToken() {
  localStorage.removeItem('accessToken');
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

export function setRefreshToken(token: string) {
  localStorage.setItem('refreshToken', token);
}

export function removeRefreshToken() {
  localStorage.removeItem('refreshToken');
}

function isTokenInvalid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function logout() {
  removeToken();
  removeRefreshToken();
  if (typeof window !== 'undefined') window.location.href = '/login';
}

// 동시 다발적 401 시 refresh 중복 호출 방지
let refreshingPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (refreshingPromise) return refreshingPromise;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  refreshingPromise = fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async res => {
      if (!res.ok) return null;
      const data = await res.json();
      const newToken: string | undefined = data.accessToken;
      if (!newToken) return null;
      setToken(newToken);
      return newToken;
    })
    .catch(() => null)
    .finally(() => { refreshingPromise = null; });

  return refreshingPromise;
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `오류가 발생했습니다. (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body?.message === 'string') {
        message = body.message;
        if (res.status === 400 && body.message.includes('memberId')) {
          logout();
          throw new Error('Unauthorized');
        }
      }
    } catch (e) {
      if ((e as Error).message === 'Unauthorized') throw e;
    }
    throw new Error(message);
  }
  const ct = res.headers.get('content-type');
  if (!ct || !ct.includes('application/json')) return undefined as T;
  return res.json();
}

function buildHeaders(token: string | null, extra?: HeadersInit): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let token = getToken();

  // 토큰이 로컬에서 만료된 경우 → 요청 전에 미리 재발급 시도
  if (token && isTokenInvalid(token)) {
    const newToken = await tryRefreshToken();
    if (!newToken) {
      logout();
      throw new Error('Unauthorized');
    }
    token = newToken;
  }

  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...init,
    headers: buildHeaders(token, init?.headers),
  });

  // 서버에서 401 → refresh 후 원래 요청 재시도
  if (res.status === 401) {
    const newToken = await tryRefreshToken();
    if (!newToken) {
      logout();
      throw new Error('Unauthorized');
    }
    const retryRes = await fetch(`${BASE_URL}/api${path}`, {
      ...init,
      headers: buildHeaders(newToken, init?.headers),
    });
    if (retryRes.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }
    return parseResponse<T>(retryRes);
  }

  return parseResponse<T>(res);
}

// --- Types ---

export type Category = 'RESTAURANT' | 'ACCOMMODATION' | 'ATTRACTION' | 'CAFE';

export const CATEGORY_LABEL: Record<Category, string> = {
  RESTAURANT: '맛집',
  ACCOMMODATION: '숙소',
  ATTRACTION: '관광지',
  CAFE: '카페',
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  RESTAURANT: '🍽️',
  ACCOMMODATION: '🏨',
  ATTRACTION: '🗺️',
  CAFE: '☕',
};

/** 장소/후기에 첨부된 사진 한 장 */
export interface PlacePhoto {
  placePhotoId: number;
  imageUrl: string;
}

/** 홈 화면 '베스트 장소' 목록(`GET /place/best`)에 포함되는 항목. 추억 정보까지 함께 내려온다 */
export interface BestPlace {
  id: number;
  memoryId: number;
  memoryName: string;
  name: string;
  description: string;
  category: Category;
  address: string;
  detailAddress: string | null;
  kakaoPlaceId: string | null;
  kakaoPlaceName: string | null;
  latitude: number;
  longitude: number;
  avgRating: number;
  reviewCount: number;
  regionDepth1: string;
  regionDepth2: string;
  visitedAt: string | null;
  placePhotoList: PlacePhoto[];
}

/** 추억 목록 정렬 기준 (최신순/오래된순/별점높은순/별점낮은순) */
export type SortType = 'DATE_DESC' | 'DATE_ASC' | 'RATING_DESC' | 'RATING_ASC';

/** 추억 목록 조회(`GET /memory`) 응답에 포함되는 추억 요약 정보 */
export interface Memory {
  id: number;
  name: string;
  avgRating: number;
  placeCount: number;
  memberCount: number;
  description: string;
  startDate: string | null;
  endDate: string | null;
  imageUrl: string | null;
}

/** 추억 상세 조회(`GET /memory/{memoryId}`) 응답. 멤버 목록·공개 설정 등 상세 정보 포함 */
export interface MemoryDetail {
  id: number;
  name: string;
  avgRating: number;
  placeCount: number;
  memberCount: number;
  creatorId: number;
  description: string;
  startDate: string | null;
  endDate: string | null;
  imageUrl: string | null;
  showHistoryToNew: boolean;
  memberInfoDTOList?: Member[];
}

/** 추억 수정(`PUT /memory/{memoryId}`) 요청 바디 */
export interface UpdateMemoryRequest {
  memoryName: string;
  description: string;
  startDate?: string | null;
  endDate?: string | null;
  showHistoryToNew: boolean;
}

export interface RecentReview {
  reviewId: number;
  memberId: number;
  memoryId: number;
  placeId: number;
  creatorName: string;
  profileImageUrl: string | null;
  rating: number;
  content: string;
  placeName: string;
  placeCategory: Category;
  rpResponseDTOList: ReviewPhoto[];
  memoryName: string;
  visitedAt: string;
  createdAt: string;
}

export interface Member {
  memberId: number;
  name: string;
  email: string | null;
  profileImageUrl: string;
  notificationEnabled: boolean;
  notificationPlaceEnabled: boolean;
  notificationReviewEnabled: boolean;
  notificationInvitationEnabled: boolean;
}

/** 추억 생성(`POST /memory`) 요청 바디 */
export interface CreateMemoryRequest {
  memoryName: string;
  description: string;
  invitedCnt: number;
  photoUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  showHistoryToNew: boolean;
}

export interface PresignedUrlResponse {
  presignedUrl: string;
  imageUrl: string;
}

// --- API functions ---

export const fetchMe = () => apiFetch<Member>('/members/me');

export interface MemberStats {
  memoryCount: number;
  placeCount: number;
  reviewAvg: number;
}

export const fetchMyStats = () => apiFetch<MemberStats>('/members/me/stats');

export const updateMe = (name: string) =>
  apiFetch<void>('/members/me', { method: 'PUT', body: JSON.stringify({ name }) });

export const updateMePhoto = (imageUrl: string) =>
  apiFetch<void>('/members/me/photo', { method: 'PUT', body: JSON.stringify({ imageUrl }) });

export const deleteMe = () => apiFetch<void>('/members/me', { method: 'DELETE' });

/** 홈 화면에 표시할 베스트 장소 목록을 조회한다 */
export const fetchBestPlaces = () =>
  apiFetch<BestPlace[]>('/place/best');

/** 지도탐색 화면(`/map`)에서 마커로 표시하기 위한 장소 요약 정보 */
export interface PlaceMapItem {
  memoryId: number;
  memoryName: string;
  placeId: number;
  placeName: string;
  category: Category;
  latitude: number;
  longitude: number;
  avgRating: number;
  regionDepth1: string;
  regionDepth2: string;
  visitedAt: string | null;
}

/** 내가 속한 모든 추억의 장소를 지도에 표시하기 위해 전체 조회한다 */
export const fetchAllPlaces = () =>
  apiFetch<PlaceMapItem[]>('/place/all');

/** 정렬 기준과 검색어(선택)로 내 추억 목록을 조회한다 */
export const fetchMemoryList = (sortType: SortType, keyword?: string) => {
  const params = new URLSearchParams({ sortType });
  if (keyword) params.set('keyword', keyword);
  return apiFetch<Memory[]>(`/memory?${params}`);
};

/** 홈 화면 등에서 사용하는, 최신순으로 정렬된 추억 목록 조회 */
export const fetchRecentMemories = () => fetchMemoryList('DATE_DESC');

export const fetchRecentReviews = () =>
  apiFetch<RecentReview[]>('/review/recent');

export const fetchMyReviews = () =>
  apiFetch<PlaceReview[]>('/review/my');

/** 장소 후기 목록 정렬 기준 (등록일/방문일/별점 각각 최신·높은순 또는 오래된·낮은순) */
export type ReviewSortType = 'DATE_DESC' | 'DATE_ASC' | 'RATING_DESC' | 'RATING_ASC' | 'VISITED_DESC' | 'VISITED_ASC';

/** 후기에 첨부된 사진 한 장 */
export interface ReviewPhoto {
  reviewPhotoId: number;
  photoUrl: string;
}

/** 장소 후기 정보. 장소 상세 페이지와 마이페이지의 '내가 쓴 후기' 목록에서 공용으로 사용 */
export interface PlaceReview {
  reviewId: number;
  memberId: number;
  memoryId: number;
  placeId: number;
  creatorName: string;
  profileImageUrl: string | null;
  rating: number;
  content: string | null;
  placeName: string;
  placeCategory: Category;
  rpResponseDTOList: ReviewPhoto[];
  memoryName: string;
  visitedAt: string | null;
  createdAt: string;
}

/** 후기 생성(`POST /review`) 요청 바디 */
export interface CreateReviewRequest {
  placeId: number;
  memoryId: number;
  rating: number;
  content?: string;
  visitedAt?: string;
  photoUrlList?: string[];
}

/** 후기 수정(`PUT /review/{reviewId}`) 요청 바디 */
export interface UpdateReviewRequest {
  placeId: number;
  memoryId: number;
  rating: number;
  content?: string;
  visitedAt?: string;
}

/** 특정 장소의 전체 후기를 정렬 없이 조회한다 */
export const fetchPlaceReviews = (memoryId: number, placeId: number) =>
  apiFetch<PlaceReview[]>(`/review/memory/${memoryId}/place/${placeId}/all`);

/** 특정 장소의 후기를 지정한 기준(등록일/방문일/별점)으로 정렬해 조회한다 */
export const fetchPlaceReviewsSorted = (memoryId: number, placeId: number, sortType: ReviewSortType) =>
  apiFetch<PlaceReview[]>(`/review/memory/${memoryId}/place/${placeId}/sort?sortTypeReview=${sortType}`);

/** 현재 로그인한 멤버가 해당 장소에 남긴 후기를 조회한다. 없으면 null (404를 에러로 던지지 않고 흡수) */
export const fetchMyReview = async (memoryId: number, placeId: number): Promise<PlaceReview | null> => {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/api/review/memory/${memoryId}/place/${placeId}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) return null;
  return res.json();
};

/** 새 후기를 작성한다 (멤버당 장소 하나에 후기 하나) */
export const createReview = (body: CreateReviewRequest) =>
  apiFetch<void>('/review', {
    method: 'POST',
    body: JSON.stringify(body),
  });

/** 기존 후기의 별점/내용/방문일을 수정한다 */
export const updateReview = (reviewId: number, body: UpdateReviewRequest) =>
  apiFetch<void>(`/review/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

/** 후기를 삭제한다 */
export const deleteReview = (memoryId: number, placeId: number, reviewId: number) =>
  apiFetch<void>(`/review/memory/${memoryId}/place/${placeId}/review/${reviewId}`, { method: 'DELETE' });

/** 후기에 사진을 추가한다 (S3 업로드 후 반환된 imageUrl들을 전달) */
export const addReviewPhotos = (memoryId: number, reviewId: number, photoUrlList: string[]) =>
  apiFetch<void>(`/review/${memoryId}/${reviewId}/photo`, {
    method: 'POST',
    body: JSON.stringify({ photoUrlList }),
  });

/** 후기 사진 중 일부를 삭제한다 */
export const deleteReviewPhotos = (memoryId: number, reviewId: number, reviewPhotoIdList: number[]) =>
  apiFetch<void>(`/review/${memoryId}/${reviewId}/photo`, {
    method: 'DELETE',
    body: JSON.stringify({ reviewPhotoIdList }),
  });

/** 새 추억을 생성한다 */
export const createMemory = (body: CreateMemoryRequest) =>
  apiFetch<void>('/memory', { method: 'POST', body: JSON.stringify(body) });

/** 추억 초대 링크에 쓰일 초대 코드를 발급받는다 */
export const createInvitation = (memoryId: number) =>
  apiFetch<{ inviteCode: string }>(`/invitation/memory/${memoryId}`, { method: 'POST' });

/** 초대 코드를 이용해 추억에 참여(초대 수락)한다 */
export const agreeInvitation = (inviteCode: string) =>
  apiFetch<void>(`/invitation/agree/${inviteCode}`, { method: 'POST' });

/** 현재 로그인한 멤버가 해당 추억에서 나간다 */
export const leaveMemory = (memoryId: number) =>
  apiFetch<void>(`/memory/${memoryId}/left`, { method: 'DELETE' });

/** 추억 ID로 상세 정보를 조회한다 (수정 화면 초기값 로딩 등에 사용) */
export const fetchMemory = (memoryId: number) =>
  apiFetch<MemoryDetail>(`/memory/${memoryId}`);

/** 추억의 이름/설명/기간/공개 설정을 수정한다 */
export const updateMemory = (memoryId: number, body: UpdateMemoryRequest) =>
  apiFetch<void>(`/memory/${memoryId}`, { method: 'PUT', body: JSON.stringify(body) });

/** 추억 표지 사진을 등록/교체한다 (S3 업로드 후 반환된 imageUrl을 전달) */
export const addMemoryPhoto = (memoryId: number, imageUrl: string) =>
  apiFetch<void>(`/memory/${memoryId}/photo`, { method: 'POST', body: JSON.stringify({ imageUrl }) });

/** 추억 표지 사진을 삭제한다 */
export const deleteMemoryPhoto = (memoryId: number) =>
  apiFetch<void>(`/memory/${memoryId}/photo`, { method: 'DELETE' });

/** 추억을 완전히 삭제한다 */
export const deleteMemory = (memoryId: number) =>
  apiFetch<void>(`/memory/${memoryId}`, { method: 'DELETE' });

/** 추억의 장소 목록 조회(`GET /place/{memoryId}`) 응답에 포함되는 장소 요약 정보 */
export interface MemoryPlace {
  id: number;
  name: string;
  category: Category;
  address: string;
  detailAddress: string | null;
  description: string;
  avgRating: number;
  reviewCount: number;
  regionDepth1: string;
  regionDepth2: string;
  visitedAt: string | null;
  placePhotoList: PlacePhoto[];
}

/** 장소 상세 조회(`GET /place/{memoryId}/{placeId}`) 응답 */
export interface PlaceDetail {
  id: number;
  name: string;
  category: Category;
  address: string;
  detailAddress: string | null;
  description: string;
  kakaoPlaceId: string | null;
  kakaoPlaceName: string | null;
  latitude: number | null;
  longitude: number | null;
  avgRating: number;
  reviewCount: number;
  regionDepth1: string;
  regionDepth2: string;
  visitedAt: string | null;
  placePhotoList: PlacePhoto[];
}

/** 장소 ID로 상세 정보를 조회한다 */
export const fetchPlace = (memoryId: number, placeId: number) =>
  apiFetch<PlaceDetail>(`/place/${memoryId}/${placeId}`);

/** 장소 수정(`PUT /place/{memoryId}/{placeId}`) 요청 바디 */
export interface UpdatePlaceRequest {
  name: string;
  category: Category;
  description?: string;
  visitedAt?: string;
  address?: string;
  detailAddress?: string;
  kakaoPlaceId?: string;
  kakaoPlaceName?: string;
  latitude?: string;
  longitude?: string;
  regionDepth1?: string;
  regionDepth2?: string;
}

/** 장소의 이름/카테고리/설명/위치 정보를 수정한다 (사진은 addPlacePhotos/deletePlacePhotos로 별도 관리) */
export const updatePlace = (memoryId: number, placeId: number, req: UpdatePlaceRequest) =>
  apiFetch<void>(`/place/${memoryId}/${placeId}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  });

/** 장소에 사진을 추가한다 (S3 업로드 후 반환된 imageUrl들을 전달) */
export const addPlacePhotos = (memoryId: number, placeId: number, imageUrlList: string[]) =>
  apiFetch<void>(`/place/${memoryId}/${placeId}/photo`, {
    method: 'POST',
    body: JSON.stringify({ photoUrlList: imageUrlList }),
  });

/** 장소 사진 중 일부를 삭제한다 */
export const deletePlacePhotos = (memoryId: number, placeId: number, placePhotoIdList: number[]) =>
  apiFetch<void>(`/place/${memoryId}/${placeId}/photo`, {
    method: 'DELETE',
    body: JSON.stringify({ placePhotoIdList }),
  });

/** 카테고리/지역/검색어로 필터링해 추억 내 장소 목록을 조회한다 */
export const fetchMemoryPlaces = (
  memoryId: number,
  params?: { category?: Category; regionDepth1?: string; regionDepth2?: string; keyword?: string },
) => {
  const p = new URLSearchParams();
  if (params?.category) p.set('category', params.category);
  if (params?.regionDepth1) p.set('regionDepth1', params.regionDepth1);
  if (params?.regionDepth2) p.set('regionDepth2', params.regionDepth2);
  if (params?.keyword) p.set('keyword', params.keyword);
  const qs = p.toString();
  return apiFetch<MemoryPlace[]>(`/place/${memoryId}${qs ? `?${qs}` : ''}`);
};

/** 장소를 완전히 삭제한다 (딸린 후기도 함께 삭제됨) */
export const deletePlace = (memoryId: number, placeId: number) =>
  apiFetch<void>(`/place/${memoryId}/${placeId}`, { method: 'DELETE' });

/** 장소 생성(`POST /place/{memoryId}`) 요청 바디 */
export interface CreatePlaceRequest {
  name: string;
  category: Category;
  description?: string;
  visitedAt?: string;
  address?: string;
  detailAddress?: string;
  kakaoPlaceId?: string;
  kakaoPlaceName?: string;
  latitude?: string;
  longitude?: string;
  regionDepth1?: string;
  regionDepth2?: string;
  photoUrlList?: string[];
}

/** 추억에 새 장소를 등록한다 */
export const createPlace = (memoryId: number, req: CreatePlaceRequest) =>
  apiFetch<{ id: number }>(`/place/${memoryId}`, {
    method: 'POST',
    body: JSON.stringify(req),
  });

/** 카카오맵 장소 검색 결과 한 건 (PlaceForm에서 위치 선택 시 사용) */
export interface PlaceSearchResult {
  kakaoPlaceId: string;
  kakaoPlaceName: string;
  address: string;
  latitude: string;
  longitude: string;
  regionDepth1: string;
  regionDepth2: string;
}

/** 장소명/주소 검색어로 카카오맵 장소를 검색한다 */
export const searchPlaces = (query: string) =>
  apiFetch<PlaceSearchResult[]>(`/place/search?query=${encodeURIComponent(query)}`);

export const fetchPresignedUrls = (folder: string, count: number) =>
  apiFetch<PresignedUrlResponse[]>('/upload/presigned-urls', {
    method: 'POST',
    body: JSON.stringify({ folder, count }),
  });

export const registerFcmToken = (fcmToken: string) =>
  apiFetch<void>('/fcm/token', { method: 'POST', body: JSON.stringify({ fcmToken }) });

export interface NotificationSettings {
  notificationEnabled: boolean;
  notificationPlaceEnabled: boolean;
  notificationReviewEnabled: boolean;
  notificationInvitationEnabled: boolean;
}

export const updateNotificationSettings = (settings: NotificationSettings) =>
  apiFetch<void>('/fcm/notification', { method: 'PUT', body: JSON.stringify(settings) });

export async function uploadToS3(presignedUrl: string, file: File): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('S3 upload failed');
}
