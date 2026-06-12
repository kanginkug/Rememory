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
  if (typeof window !== 'undefined') window.location.href = '/login';
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  if (token && isTokenInvalid(token)) {
    logout();
    throw new Error('Unauthorized');
  }
  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (res.status === 401) {
    logout();
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    let message = `오류가 발생했습니다. (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body?.message === 'string') message = body.message;
    } catch {}
    throw new Error(message);
  }
  const ct = res.headers.get('content-type');
  if (!ct || !ct.includes('application/json')) return undefined as T;
  return res.json();
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

export interface PlacePhoto {
  placePhotoId: number;
  imageUrl: string;
}

export interface BestPlace {
  id: number;
  memoryId: number;
  memoryName: string;
  name: string;
  description: string;
  category: Category;
  address: string;
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

export type SortType = 'DATE_DESC' | 'DATE_ASC' | 'RATING_DESC' | 'RATING_ASC';

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

export interface MemoryDetail {
  id: number;
  name: string;
  avgRating: number;
  placeCount: number;
  memberCount: number;
  description: string;
  startDate: string | null;
  endDate: string | null;
  imageUrl: string | null;
  memberInfoDTOList?: Member[];
}

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
}

export interface CreateMemoryRequest {
  memoryName: string;
  description: string;
  invitedCnt: number;
  photoUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
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

export const fetchBestPlaces = () =>
  apiFetch<BestPlace[]>('/place/best');

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

export const fetchAllPlaces = () =>
  apiFetch<PlaceMapItem[]>('/place/all');

export const fetchMemoryList = (sortType: SortType, keyword?: string) => {
  const params = new URLSearchParams({ sortType });
  if (keyword) params.set('keyword', keyword);
  return apiFetch<Memory[]>(`/memory?${params}`);
};

export const fetchRecentMemories = () => fetchMemoryList('DATE_DESC');

export const fetchRecentReviews = () =>
  apiFetch<RecentReview[]>('/review/recent');

export const fetchMyReviews = () =>
  apiFetch<PlaceReview[]>('/review/my');

export type ReviewSortType = 'DATE_DESC' | 'DATE_ASC' | 'RATING_DESC' | 'RATING_ASC' | 'VISITED_DESC' | 'VISITED_ASC';

export interface ReviewPhoto {
  reviewPhotoId: number;
  photoUrl: string;
}

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

export interface CreateReviewRequest {
  placeId: number;
  memoryId: number;
  rating: number;
  content?: string;
  visitedAt?: string;
  photoUrlList?: string[];
}

export interface UpdateReviewRequest {
  placeId: number;
  memoryId: number;
  rating: number;
  content?: string;
  visitedAt?: string;
}

export const fetchPlaceReviews = (memoryId: number, placeId: number) =>
  apiFetch<PlaceReview[]>(`/review/memory/${memoryId}/place/${placeId}/all`);

export const fetchPlaceReviewsSorted = (memoryId: number, placeId: number, sortType: ReviewSortType) =>
  apiFetch<PlaceReview[]>(`/review/memory/${memoryId}/place/${placeId}/sort?sortTypeReview=${sortType}`);

export const fetchMyReview = (memoryId: number, placeId: number) =>
  apiFetch<PlaceReview>(`/review/memory/${memoryId}/place/${placeId}`);

export const createReview = (body: CreateReviewRequest) =>
  apiFetch<void>('/review', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const updateReview = (reviewId: number, body: UpdateReviewRequest) =>
  apiFetch<void>(`/review/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

export const deleteReview = (memoryId: number, placeId: number, reviewId: number) =>
  apiFetch<void>(`/review/memory/${memoryId}/place/${placeId}/review/${reviewId}`, { method: 'DELETE' });

export const addReviewPhotos = (memoryId: number, reviewId: number, photoUrlList: string[]) =>
  apiFetch<void>(`/review/${memoryId}/${reviewId}/photo`, {
    method: 'POST',
    body: JSON.stringify({ photoUrlList }),
  });

export const deleteReviewPhotos = (memoryId: number, reviewId: number, reviewPhotoIdList: number[]) =>
  apiFetch<void>(`/review/${memoryId}/${reviewId}/photo`, {
    method: 'DELETE',
    body: JSON.stringify({ reviewPhotoIdList }),
  });

export const createMemory = (body: CreateMemoryRequest) =>
  apiFetch<void>('/memory', { method: 'POST', body: JSON.stringify(body) });

export const createInvitation = (memoryId: number) =>
  apiFetch<{ inviteCode: string }>(`/invitation/memory/${memoryId}`, { method: 'POST' });

export const leaveMemory = (memoryId: number) =>
  apiFetch<void>(`/memory/${memoryId}/left`, { method: 'DELETE' });

export const fetchMemory = (memoryId: number) =>
  apiFetch<MemoryDetail>(`/memory/${memoryId}`);

export const updateMemory = (memoryId: number, body: UpdateMemoryRequest) =>
  apiFetch<void>(`/memory/${memoryId}`, { method: 'PUT', body: JSON.stringify(body) });

export const addMemoryPhoto = (memoryId: number, imageUrl: string) =>
  apiFetch<void>(`/memory/${memoryId}/photo`, { method: 'POST', body: JSON.stringify({ imageUrl }) });

export const deleteMemoryPhoto = (memoryId: number) =>
  apiFetch<void>(`/memory/${memoryId}/photo`, { method: 'DELETE' });

export const deleteMemory = (memoryId: number) =>
  apiFetch<void>(`/memory/${memoryId}`, { method: 'DELETE' });

export interface MemoryPlace {
  id: number;
  name: string;
  category: Category;
  address: string;
  description: string;
  avgRating: number;
  reviewCount: number;
  regionDepth1: string;
  regionDepth2: string;
  visitedAt: string | null;
  placePhotoList: PlacePhoto[];
}

export interface PlaceDetail {
  id: number;
  name: string;
  category: Category;
  address: string;
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

export const fetchPlace = (memoryId: number, placeId: number) =>
  apiFetch<PlaceDetail>(`/place/${memoryId}/${placeId}`);

export interface UpdatePlaceRequest {
  name: string;
  category: Category;
  description?: string;
  visitedAt?: string;
  address?: string;
  kakaoPlaceId?: string;
  kakaoPlaceName?: string;
  latitude?: string;
  longitude?: string;
  regionDepth1?: string;
  regionDepth2?: string;
}

export const updatePlace = (memoryId: number, placeId: number, req: UpdatePlaceRequest) =>
  apiFetch<void>(`/place/${memoryId}/${placeId}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  });

export const addPlacePhotos = (memoryId: number, placeId: number, imageUrlList: string[]) =>
  apiFetch<void>(`/place/${memoryId}/${placeId}/photo`, {
    method: 'POST',
    body: JSON.stringify({ photoUrlList: imageUrlList }),
  });

export const deletePlacePhotos = (memoryId: number, placeId: number, placePhotoIdList: number[]) =>
  apiFetch<void>(`/place/${memoryId}/${placeId}/photo`, {
    method: 'DELETE',
    body: JSON.stringify({ placePhotoIdList }),
  });

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

export const deletePlace = (memoryId: number, placeId: number) =>
  apiFetch<void>(`/place/${memoryId}/${placeId}`, { method: 'DELETE' });

export interface CreatePlaceRequest {
  name: string;
  category: Category;
  description?: string;
  visitedAt?: string;
  address?: string;
  kakaoPlaceId?: string;
  kakaoPlaceName?: string;
  latitude?: string;
  longitude?: string;
  regionDepth1?: string;
  regionDepth2?: string;
  imageUrlList?: string[];
}

export const createPlace = (memoryId: number, req: CreatePlaceRequest) =>
  apiFetch<{ id: number }>(`/place/${memoryId}`, {
    method: 'POST',
    body: JSON.stringify(req),
  });

export interface PlaceSearchResult {
  kakaoPlaceId: string;
  kakaoPlaceName: string;
  address: string;
  latitude: string;
  longitude: string;
  regionDepth1: string;
  regionDepth2: string;
}

export const searchPlaces = (query: string) =>
  apiFetch<PlaceSearchResult[]>(`/place/search?query=${encodeURIComponent(query)}`);

export const fetchPresignedUrls = (folder: string, count: number) =>
  apiFetch<PresignedUrlResponse[]>('/upload/presigned-urls', {
    method: 'POST',
    body: JSON.stringify({ folder, count }),
  });

export async function uploadToS3(presignedUrl: string, file: File): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('S3 upload failed');
}
