'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PlaceForm, { type PlaceFormValues } from '@/components/PlaceForm';
import {
  fetchPlace,
  updatePlace,
  addPlacePhotos,
  deletePlacePhotos,
  fetchPresignedUrls,
  uploadToS3,
  type PlaceDetail,
} from '@/lib/api';

export default function EditPlacePage() {
  const router = useRouter();
  const { id, placeId } = useParams<{ id: string; placeId: string }>();
  const memoryId = Number(id);
  const placeIdNum = Number(placeId);

  const [place,   setPlace]   = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlace(memoryId, placeIdNum)
      .then(setPlace)
      .catch((e: Error) => alert(e.message))
      .finally(() => setLoading(false));
  }, [memoryId, placeIdNum]);

  const handleSubmit = async ({
    name, category, description, visitedAt,
    locationTab, kakaoPlace, depth1, depth2,
    newPhotos, removedPhotoIds,
  }: PlaceFormValues) => {
    let locationInfo: {
      address?: string; kakaoPlaceId?: string; kakaoPlaceName?: string;
      latitude?: string; longitude?: string;
      regionDepth1?: string; regionDepth2?: string;
    } = {};

    if (locationTab === 'kakao' && kakaoPlace) {
      locationInfo = {
        address: kakaoPlace.address,
        kakaoPlaceId: kakaoPlace.kakaoPlaceId,
        kakaoPlaceName: kakaoPlace.kakaoPlaceName || undefined,
        latitude: kakaoPlace.latitude,
        longitude: kakaoPlace.longitude,
        regionDepth1: kakaoPlace.regionDepth1 || undefined,
        regionDepth2: kakaoPlace.regionDepth2 || undefined,
      };
    } else if (locationTab === 'manual') {
      locationInfo = {
        regionDepth1: depth1 || undefined,
        regionDepth2: depth2 || undefined,
      };
    }

    try {
      await updatePlace(memoryId, placeIdNum, {
        name,
        category,
        description: description.trim() || undefined,
        visitedAt: visitedAt || undefined,
        ...locationInfo,
      });

      const photoTasks: Promise<void>[] = [];

      if (newPhotos.length > 0) {
        const addTask = async () => {
          const slots = await fetchPresignedUrls('place', newPhotos.length);
          await Promise.all(slots.map((slot, i) => uploadToS3(slot.presignedUrl, newPhotos[i])));
          await addPlacePhotos(memoryId, placeIdNum, slots.map(s => s.imageUrl));
        };
        photoTasks.push(addTask());
      }

      if (removedPhotoIds.length > 0) {
        photoTasks.push(deletePlacePhotos(memoryId, placeIdNum, removedPhotoIds));
      }

      if (photoTasks.length > 0) await Promise.all(photoTasks);

      router.replace(`/place/${memoryId}/${placeIdNum}`);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#BFDBF3', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#888', fontSize: 14 }}>불러오는 중...</div>
      </div>
    );
  }

  return (
    <PlaceForm
      title="장소 수정"
      submitLabel="수정하기"
      submittingLabel="수정 중..."
      initialData={place ?? undefined}
      onSubmit={handleSubmit}
    />
  );
}
