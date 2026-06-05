'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MemoryForm, { type MemoryFormValues } from '@/components/MemoryForm';
import { createMemory, fetchPresignedUrl, uploadToS3 } from '@/lib/api';

export default function CreateMemoryPage() {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) router.replace('/login');
  }, [router]);

  const handleSubmit = async ({ name, description, startDate, endDate, showHistory, photoFile }: MemoryFormValues) => {
    let photoUrl: string | null = null;
    if (photoFile) {
      const { presignedUrl, imageUrl } = await fetchPresignedUrl(photoFile.name, photoFile.type);
      await uploadToS3(presignedUrl, photoFile);
      photoUrl = imageUrl;
    }
    await createMemory({
      memoryName: name,
      description,
      invitedCnt: 0,
      photoUrl,
      startDate: startDate || null,
      endDate: endDate || null,
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
