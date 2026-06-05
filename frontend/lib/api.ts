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
  ATTRACTION: '장소',
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
  category: Category;
  address: string;
  avgRating: number;
  reviewCount: number;
  regionDepth1: string;
  regionDepth2: string;
  visitedAt: string;
  placePhotoList: PlacePhoto[];
  memoryName?: string;
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

export const fetchMemoryList = (sortType: SortType, keyword?: string) => {
  const params = new URLSearchParams({ sortType });
  if (keyword) params.set('keyword', keyword);
  return apiFetch<Memory[]>(`/memory?${params}`);
};

export const fetchRecentMemories = () => fetchMemoryList('DATE_DESC');

export const fetchRecentReviews = () =>
  apiFetch<RecentReview[]>('/review/recent');

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

export const updateMemoryPhoto = (memoryId: number, photoUrl: string) =>
  apiFetch<void>(`/memory/${memoryId}/image`, { method: 'POST', body: JSON.stringify({ photoUrl }) });

export const deleteMemoryPhoto = (memoryId: number) =>
  apiFetch<void>(`/memory/${memoryId}/image`, { method: 'DELETE' });

export const deleteMemory = (memoryId: number) =>
  apiFetch<void>(`/memory/${memoryId}`, { method: 'DELETE' });

export const fetchPresignedUrl = (fileName: string, contentType: string) =>
  apiFetch<PresignedUrlResponse>('/uploads/presigned-url', {
    method: 'POST',
    body: JSON.stringify({ fileName, contentType }),
  });

export async function uploadToS3(presignedUrl: string, file: File): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('S3 upload failed');
}
