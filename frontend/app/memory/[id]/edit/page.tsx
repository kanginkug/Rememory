'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import MemoryForm, { type MemoryFormValues } from '@/components/MemoryForm';
import {
  fetchMemory,
  updateMemory,
  addMemoryPhoto,
  deleteMemoryPhoto,
  fetchPresignedUrls,
  uploadToS3,
  type MemoryDetail,
} from '@/lib/api';

export default function EditMemoryPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const memoryId = Number(id);

  const [memory, setMemory] = useState<MemoryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.replace('/login');
      return;
    }
    fetchMemory(memoryId)
      .then(setMemory)
      .catch((e: Error) => alert(e.message))
      .finally(() => setLoading(false));
  }, [memoryId, router]);

  const handleSubmit = async ({ name, description, startDate, endDate, showHistory, photoFile, photoRemoved }: MemoryFormValues) => {
    await updateMemory(memoryId, {
      memoryName: name,
      description,
      startDate: startDate || null,
      endDate: endDate || null,
      showHistoryToNew: showHistory,
    });

    if (photoFile) {
      const [slot] = await fetchPresignedUrls('memory', 1);
      await uploadToS3(slot.presignedUrl, photoFile);
      await addMemoryPhoto(memoryId, slot.imageUrl);
    } else if (photoRemoved && memory?.imageUrl) {
      await deleteMemoryPhoto(memoryId);
    }

    const from = searchParams.get('from');
    router.replace(from === 'place' ? `/place/${memoryId}` : '/memory');
  };

  if (loading) {
    return (
      <div className="min-h-dvh mx-auto w-full max-w-[450px] flex items-center justify-center" style={{ background: '#BFDBF3' }}>
        <div className="animate-pulse text-sm" style={{ color: '#888' }}>불러오는 중...</div>
      </div>
    );
  }

  return (
    <MemoryForm
      title="추억 수정"
      submitLabel="수정하기"
      submittingLabel="수정 중..."
      initialData={memory ?? undefined}
      onSubmit={handleSubmit}
    />
  );
}
