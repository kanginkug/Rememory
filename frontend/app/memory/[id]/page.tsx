'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

/** `/memory/[id]` 접근 시 실제 추억 상세 화면인 `/place/[id]`로 리다이렉트하는 페이지 */
export default function MemoryRedirect() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    router.replace(`/place/${id}`);
  }, [id, router]);

  return <div style={{ background: '#BFDBF3', minHeight: '100dvh' }} />;
}
