'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('accessToken', token);
      router.replace('/home');
    } else {
      router.replace('/login');
    }
  }, [router, searchParams]);

  return <div>로그인 중...</div>;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div>로그인 중...</div>}>
      <CallbackInner />
    </Suspense>
  );
}
