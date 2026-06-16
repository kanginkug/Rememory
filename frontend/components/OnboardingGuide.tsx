'use client';

import { useState } from 'react';

const STEPS = [
  {
    image: '/images/guide/memory_guide.png',
    title: '추억 만들기',
    desc: '소중한 순간들을 추억으로 기록해보세요.\n친구들과 함께 추억을 공유할 수 있어요.',
  },
  {
    image: '/images/guide/inviation_guide.png',
    title: '친구 초대하기',
    desc: '초대 코드로 친구를 추억에 초대해보세요.\n초대된 친구만 해당 추억의 장소와 후기를\n공유할 수 있어요.',
  },
  {
    image: '/images/guide/place_guide.png',
    title: '장소 추가하기',
    desc: '추억에 다녀온 장소를 추가해보세요.\n카테고리와 방문일, 사진도 함께 남길 수 있어요.',
  },
  {
    image: '/images/guide/review_guide.png',
    title: '후기 작성하기',
    desc: '장소에 별점과 후기를 남겨보세요.\n멤버들의 솔직한 리뷰를 한눈에 볼 수 있어요.',
  },
];

export default function OnboardingGuide({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;

  const handleClose = () => {
    localStorage.setItem('onboarded', 'true');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: '#fff',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* 이미지 */}
      <div style={{ flex: 1, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <img
          src={STEPS[step].image}
          alt={STEPS[step].title}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      {/* 텍스트 + 버튼 */}
      <div style={{ padding: '28px 24px 40px', background: '#fff' }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 10, textAlign: 'center' }}>
          {STEPS[step].title}
        </h3>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.8, whiteSpace: 'pre-line', textAlign: 'center', marginBottom: 28 }}>
          {STEPS[step].desc}
        </p>

        {/* 도트 인디케이터 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === step ? '#7F77DD' : '#e2e8f0',
                transition: 'all 0.25s',
              }}
            />
          ))}
        </div>

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: 8 }}>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                flex: 1, padding: '15px 0', borderRadius: 14,
                border: '1.5px solid #e2e8f0', background: '#fff',
                fontSize: 15, fontWeight: 600, color: '#64748b', cursor: 'pointer',
              }}
            >
              이전
            </button>
          )}
          <button
            onClick={() => isLast ? handleClose() : setStep(s => s + 1)}
            style={{
              flex: 2, padding: '15px 0', borderRadius: 14,
              border: 'none', background: '#7F77DD',
              fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer',
            }}
          >
            {isLast ? '시작하기 🎉' : '다음'}
          </button>
        </div>

        {/* 건너뛰기 */}
        {!isLast && (
          <button
            onClick={handleClose}
            style={{
              display: 'block', width: '100%', marginTop: 14,
              background: 'none', border: 'none',
              fontSize: 13, fontWeight: 500, color: '#94a3b8', cursor: 'pointer',
            }}
          >
            건너뛰기
          </button>
        )}
      </div>
    </div>
  );
}
