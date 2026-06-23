'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function MemoryRedirect() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    router.replace(`/place/${id}`);
  }, [id, router]);

  return <div style={{ background: '#BFDBF3', minHeight: '100dvh' }} />;
}
