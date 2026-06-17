'use client';

import { useParams, useRouter } from 'next/navigation';
import PlaceForm, { type PlaceFormValues } from '@/components/PlaceForm';
import { createPlace, fetchPresignedUrls, uploadToS3 } from '@/lib/api';

export default function CreatePlacePage() {
  const router = useRouter();
  const params = useParams();
  const memoryId = Number(params.id);

  const handleSubmit = async ({
    name, category, description, visitedAt,
    locationTab, kakaoPlace, depth1, depth2, detailAddress, newPhotos,
  }: PlaceFormValues) => {
    let locationInfo: {
      address?: string; kakaoPlaceId?: string; kakaoPlaceName?: string;
      latitude?: string; longitude?: string;
      regionDepth1?: string; regionDepth2?: string;
      detailAddress?: string;
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
        detailAddress: detailAddress.trim() || undefined,
      };
    }

    try {
      let photoUrlList: string[] | undefined;
      if (newPhotos.length > 0) {
        const slots = await fetchPresignedUrls('place', newPhotos.length);
        await Promise.all(slots.map((slot, i) => uploadToS3(slot.presignedUrl, newPhotos[i])));
        photoUrlList = slots.map(s => s.imageUrl);
      }

      await createPlace(memoryId, {
        name,
        category,
        description: description.trim() || undefined,
        visitedAt: visitedAt || undefined,
        photoUrlList,
        ...locationInfo,
      });

      router.replace(`/place/${memoryId}`);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <PlaceForm
      title="장소 만들기"
      submitLabel="저장하기"
      submittingLabel="저장 중..."
      onSubmit={handleSubmit}
    />
  );
}
