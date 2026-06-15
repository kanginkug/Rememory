'use client';

import { useState } from 'react';

function TermsModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 450,
          backgroundColor: 'white',
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px 40px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1E293B' }}>서비스 이용약관</h2>
          <button
            onClick={onClose}
            style={{ fontSize: 20, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
          {`제1조 (목적)
이 약관은 Rememory(이하 "서비스")의 이용 조건 및 절차, 회사와 회원 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.

제2조 (용어 정의)
① "서비스"란 회원이 단말기를 통해 이용할 수 있는 Rememory 관련 서비스를 의미합니다.
② "회원"이란 서비스에 접속하여 이 약관에 동의하고 서비스를 이용하는 자를 의미합니다.

제3조 (약관의 효력 및 변경)
① 이 약관은 서비스를 이용하고자 하는 모든 회원에게 효력이 발생합니다.
② 회사는 약관을 변경할 경우 사전에 공지합니다.

제4조 (서비스 이용)
① 서비스는 연중무휴 24시간 제공을 원칙으로 합니다.
② 회사는 서비스 유지·보수 등의 사유로 일시적으로 서비스를 중단할 수 있습니다.

제5조 (회원의 의무)
① 회원은 타인의 정보를 무단으로 사용해서는 안 됩니다.
② 회원은 서비스 운영을 방해하는 행위를 해서는 안 됩니다.

제6조 (개인정보 보호)
회사는 관련 법령에 따라 회원의 개인정보를 보호하며, 개인정보 처리방침을 별도로 공지합니다.

제7조 (면책 조항)
회사는 천재지변 또는 이에 준하는 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임이 면제됩니다.`}
        </div>
      </div>
    </div>
  );
}

function PrivacyModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 450,
          backgroundColor: 'white',
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px 40px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1E293B' }}>개인정보 처리방침</h2>
          <button
            onClick={onClose}
            style={{ fontSize: 20, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
          {`제1조 (개인정보의 처리 목적)
Rememory는 다음의 목적을 위하여 개인정보를 처리합니다.
① 회원 가입 및 관리
② 서비스 제공 및 운영
③ 고객 문의 및 불만 처리

제2조 (처리하는 개인정보 항목)
① 필수 항목: 이메일 주소, 닉네임, 프로필 이미지(소셜 로그인 제공 정보)
② 자동 수집: 서비스 이용 기록, 접속 로그

제3조 (개인정보의 보유 및 이용 기간)
① 회원 탈퇴 시까지 보유합니다.
② 관련 법령에 따라 일정 기간 보존이 필요한 경우 해당 기간 동안 보관합니다.

제4조 (개인정보의 제3자 제공)
Rememory는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 단, 이용자가 동의한 경우 또는 법령에 의한 경우는 예외로 합니다.

제5조 (개인정보의 파기)
개인정보 보유 기간이 경과하거나 처리 목적이 달성된 경우 지체 없이 파기합니다.

제6조 (이용자의 권리)
이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제, 처리 정지를 요청할 수 있습니다.

제7조 (개인정보 보호책임자)
개인정보 관련 문의는 서비스 내 고객센터를 통해 접수할 수 있습니다.`}
        </div>
      </div>
    </div>
  );
}

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
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

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
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
      <div className="absolute bottom-[2vh] left-0 right-0 flex flex-col items-center">
        <div className="w-11/12 bg-white/30 backdrop-blur-sm rounded-3xl flex flex-col items-center gap-[1.5vh]" style={{ paddingTop: 16, paddingBottom: 16 }}>
          <button
            onClick={handleKakaoLogin}
            className="bg-[#FEE500] hover:bg-[#FAD600] text-[#191919] font-bold rounded-2xl shadow-sm border border-[#E6CE00]/30 flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
            style={{ padding: '10px 24px', width: '88%' }}
          >
            <KakaoIcon />
            <span className="text-[clamp(12px,1.7vh,15px)]">카카오로 시작하기</span>
          </button>

          <button
            onClick={handleGoogleLogin}
            className="bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-2xl shadow-md border border-gray-200 flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
            style={{ padding: '10px 24px', width: '88%' }}
          >
            <GoogleIcon />
            <span className="text-[clamp(12px,1.7vh,15px)]">Google로 로그인</span>
          </button>
        </div>

        <p className="text-[11px] text-gray-800 font-medium tracking-tight text-center" style={{ marginTop: 16 }}>
          가입 시{' '}
          <button
            className="underline underline-offset-2 hover:text-black transition-colors"
            onClick={() => setShowTerms(true)}
          >
            서비스 이용 약관
          </button>
          {' '}및{' '}
          <button
            className="underline underline-offset-2 hover:text-black transition-colors"
            onClick={() => setShowPrivacy(true)}
          >
            개인정보 처리방침
          </button>
          에 동의하게 됩니다
        </p>
      </div>
    </div>
  );
}
