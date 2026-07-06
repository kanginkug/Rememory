'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MemoryForm, { type MemoryFormValues } from '@/components/MemoryForm';
import { createMemory, fetchPresignedUrls, uploadToS3 } from '@/lib/api';

/** 새 추억 생성 페이지 (`/memory/new`) — MemoryForm으로 입력받아 표지 사진 업로드 후 추억을 생성한다 */
export default function CreateMemoryPage() {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) router.replace('/login');
  }, [router]);

  /** 표지 사진이 있으면 presigned URL로 S3에 업로드한 뒤, 추억을 생성하고 목록으로 이동한다 */
  const handleSubmit = async ({ name, description, startDate, endDate, showHistory, photoFile }: MemoryFormValues) => {
    let photoUrl: string | null = null;
    if (photoFile) {
      const [slot] = await fetchPresignedUrls('memory', 1);
      await uploadToS3(slot.presignedUrl, photoFile);
      photoUrl = slot.imageUrl;
    }
    await createMemory({
      memoryName: name,
      description,
      invitedCnt: 0,
      photoUrl,
      startDate: startDate || null,
      endDate: endDate || null,
      showHistoryToNew: showHistory,
    });
    router.replace('/memory');
  };

  return (
    <MemoryForm
      title="새 추억 만들기"
      submitLabel="만들기"
      submittingLabel="만드는 중..."
      onSubmit={handleSubmit}
    />
  );
}
