'use client';

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#191919" aria-hidden="true">
      <path d="M12 3C6.477 3 2 6.597 2 11.05c0 2.9 1.733 5.456 4.345 7.01l-1.107 4.1a.3.3 0 0 0 .444.333l4.835-3.17A12.03 12.03 0 0 0 12 19.1c5.523 0 10-3.597 10-8.05S17.523 3 12 3z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function LoginPage() {
  const handleKakaoLogin = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
    window.location.href = `${baseUrl}/oauth2/authorization/kakao`;
  };

  const handleGoogleLogin = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
    window.location.href = `${baseUrl}/oauth2/authorization/google`;
  };

  return (
    <div className="login-bg relative h-screen overflow-hidden w-full max-w-md mx-auto shadow-2xl">
      <div className="absolute bottom-[5vh] left-0 right-0 px-6">
        <div className="w-full bg-white/30 backdrop-blur-sm rounded-3xl px-6 py-[1vh] flex flex-col gap-[0.8vh]">
          <button
            onClick={handleKakaoLogin}
            className="w-full bg-[#FEE500] hover:bg-[#FAD600] text-[#191919] font-bold py-[1.4vh] px-6 rounded-2xl shadow-sm border border-[#E6CE00]/30 flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
          >
            <KakaoIcon />
            <span className="text-[clamp(12px,1.7vh,15px)]">카카오로 시작하기</span>
          </button>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-bold py-[1.4vh] px-6 rounded-2xl shadow-md border border-gray-200 flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
          >
            <GoogleIcon />
            <span className="text-[clamp(12px,1.7vh,15px)]">Google로 로그인</span>
          </button>
        </div>

        <p className="text-[11px] text-gray-400 font-medium tracking-tight text-center mt-2">
          가입 시{' '}
          <button className="underline underline-offset-2 hover:text-gray-600 transition-colors">
            서비스 이용 약관
          </button>
          에 동의하게 됩니다
        </p>
      </div>
    </div>
  );
}
