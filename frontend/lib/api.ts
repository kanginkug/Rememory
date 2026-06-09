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

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (res.status === 401) {
    removeToken();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`API error ${res.status}`);
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
  rating: number;
  content: string;
  placeName: string;
  placeCategory: Category;
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

export interface PlaceReview {
  reviewId: number;
  memberId: number;
  memberName: string;
  profileImageUrl: string;
  rating: number;
  content: string | null;
  visitedAt: string | null;
  createdAt: string;
  photoUrlList: string[];
}

export interface CreateReviewRequest {
  rating: number;
  content?: string;
  visitedAt?: string;
  photoUrlList?: string[];
}

export const fetchPlaceReviews = (memoryId: number, placeId: number) =>
  apiFetch<PlaceReview[]>(`/review/${memoryId}/place/${placeId}`);

export const fetchPlaceReviewsSorted = (memoryId: number, placeId: number, sortType: string) =>
  apiFetch<PlaceReview[]>(`/review/${memoryId}/place/${placeId}/sort?sortType=${sortType}`);

export const fetchMyReview = (memoryId: number, placeId: number) =>
  apiFetch<PlaceReview>(`/review/${memoryId}/place/${placeId}/my`);

export const createReview = (memoryId: number, placeId: number, body: CreateReviewRequest) =>
  apiFetch<void>(`/review/${memoryId}/place/${placeId}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const updateReview = (memoryId: number, placeId: number, reviewId: number, body: CreateReviewRequest) =>
  apiFetch<void>(`/review/${memoryId}/place/${placeId}/review/${reviewId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

export const deleteReview = (memoryId: number, placeId: number, reviewId: number) =>
  apiFetch<void>(`/review/${memoryId}/place/${placeId}/review/${reviewId}`, { method: 'DELETE' });

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

export const fetchMemoryMembers = (memoryId: number) =>
  apiFetch<Member[]>(`/memory/${memoryId}/members`);

export const deletePlace = (placeId: number) =>
  apiFetch<void>(`/place/${placeId}`, { method: 'DELETE' });

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
