'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchMemoryList, createInvitation, leaveMemory, deleteMemory, type Memory, type SortType } from '@/lib/api';

const SORT_OPTIONS: { label: string; value: SortType }[] = [
  { label: '최신순',    value: 'DATE_DESC'   },
  { label: '오래된순',  value: 'DATE_ASC'    },
  { label: '별점높은순', value: 'RATING_DESC' },
  { label: '별점낮은순', value: 'RATING_ASC'  },
];

const NAV_ITEMS = [
  { label: '홈',       href: '/home',   active: false, d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
  { label: '추억',     href: '/memory', active: true,  d: 'M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4 2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z' },
  { label: '지도탐색', href: '/map',    active: false, d: 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z' },
  { label: '마이페이지', href: '/my',  active: false, d: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
];

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

function fmtDate(d: string) {
  const dt = new Date(d);
  const yy = String(dt.getFullYear()).slice(2);
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}.${mm}.${dd} (${DAYS[dt.getDay()]})`;
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return '추억 진행중';
  if (!start) return `~ ${fmtDate(end!)}`;
  if (!end) return `${fmtDate(start)} ~`;
  if (start === end) return fmtDate(start);
  return `${fmtDate(start)} ~ ${fmtDate(end)}`;
}

const SHEET_ACTIONS = [
  {
    label: '초대하기', iconBg: '#fff9e6', danger: false,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  },
  {
    label: '추억 수정', iconBg: '#f1f0ff', danger: false,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  },
  {
    label: '추억 나가기', iconBg: '#f0fdf4', danger: false,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  },
  {
    label: '추억 삭제', iconBg: '#fef2f2', danger: true,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  },
];

export default function MemoryListPage() {
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [sort, setSort] = useState<SortType>('DATE_DESC');
  const [sheetId, setSheetId] = useState<number | null>(null);
  const [shareData, setShareData] = useState<{ inviteLink: string; memoryName: string } | null>(null);
  const currentKeyword = useRef('');

  const load = useCallback((s: SortType, keyword: string) => {
    setLoading(true);
    fetchMemoryList(s, keyword || undefined)
      .then(setMemories)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.replace('/login');
      return;
    }
    load('DATE_DESC', '');
  }, [router, load]);

  const handleSortChange = (s: SortType) => {
    setSort(s);
    load(s, currentKeyword.current);
  };

  const handleSearch = () => {
    currentKeyword.current = inputValue;
    load(sort, inputValue);
  };

  const handleClear = () => {
    setInputValue('');
    currentKeyword.current = '';
    load(sort, '');
  };

  const handleInvite = async (memoryId: number) => {
    setSheetId(null);
    try {
      const { inviteCode } = await createInvitation(memoryId);
      const link = `${window.location.origin}/invite/${inviteCode}`;
      const mem = memories.find(m => m.id === memoryId);
      setShareData({ inviteLink: link, memoryName: mem?.name ?? '' });
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleKakaoShare = () => {
    if (!shareData) return;
    window.Kakao.Share.sendDefault({
      objectType: 'text',
      text: `[Rememory] ${shareData.memoryName}에 초대합니다!\n아래 버튼을 눌러 추억에 참여하세요 🎉`,
      link: { mobileWebUrl: shareData.inviteLink, webUrl: shareData.inviteLink },
      buttons: [{ title: '추억 참여하기', link: { mobileWebUrl: shareData.inviteLink, webUrl: shareData.inviteLink } }],
    });
  };

  const handleCopyShareLink = async () => {
    if (!shareData) return;
    try {
      await navigator.clipboard.writeText(shareData.inviteLink);
      alert('초대 링크가 복사됐습니다.');
    } catch (e) { alert('복사에 실패했습니다.'); }
    setShareData(null);
  };

  const handleEdit = (memoryId: number) => {
    setSheetId(null);
    router.push(`/memory/${memoryId}/edit?from=memory`);
  };

  const handleLeave = async (memoryId: number) => {
    setSheetId(null);
    if (!confirm('정말 이 추억에서 나가시겠어요?')) return;
    try {
      await leaveMemory(memoryId);
      setMemories(prev => prev.filter(m => m.id !== memoryId));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleDeleteMemory = async (memoryId: number) => {
    setSheetId(null);
    if (!confirm('추억을 삭제하시겠어요?')) return;
    try {
      await deleteMemory(memoryId);
      setMemories(prev => prev.filter(m => m.id !== memoryId));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div style={{ background: '#BFDBF3', minHeight: '100dvh' }}>

      {/* Fixed Header */}
      <header
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] z-20 flex justify-center items-end"
        style={{ background: '#BFDBF3', padding: '10px 20px 2px', height: 62 }}
      >
        <button
          className="absolute flex items-center justify-center"
          style={{ left: 20, top: '58%', transform: 'translateY(-50%)' }}
          onClick={() => router.push('/home')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <img
          src="/images/default_phrase.png"
          alt="Rememory"
          className="object-contain"
          style={{ height: 50, mixBlendMode: 'multiply' }}
        />
      </header>

      {/* Content */}
      <div
        className="relative mx-auto w-full max-w-[450px]"
        style={{ paddingTop: 62, paddingBottom: 80 }}
      >
        {/* Search */}
        <div style={{ padding: '20px 20px 0' }}>
          <div
            className="flex items-center gap-2"
            style={{
              height: 52,
              background: '#fff',
              borderRadius: 50,
              padding: '0 20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="추억 이름으로 검색"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: '#333' }}
            />
            {inputValue && (
              <button
                onClick={handleClear}
                className="flex items-center"
                style={{ color: '#bbb' }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            )}
            <button onClick={handleSearch} className="flex items-center shrink-0" style={{ color: '#bbb' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 22, height: 22 }}>
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Sort Chips */}
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide" style={{ padding: '14px 20px' }}>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSortChange(opt.value)}
              className="shrink-0"
              style={{
                padding: '10px 20px',
                borderRadius: 20,
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                background: sort === opt.value ? '#EF877A' : '#fff',
                color: sort === opt.value ? '#fff' : '#333',
                boxShadow: sort === opt.value
                  ? '0 2px 8px rgba(239,135,122,0.3)'
                  : '0 2px 6px rgba(0,0,0,0.06)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-2" style={{ padding: '0 20px', gap: 14 }}>

          {/* Add card */}
          <button
            onClick={() => router.push('/memory/new')}
            className="flex flex-col items-center justify-center gap-2.5 transition-all active:scale-[0.97]"
            style={{
              background: '#fff',
              border: '2px dashed #BFDBF3',
              borderRadius: 20,
              minHeight: 200,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 32, color: '#BFDBF3', lineHeight: 1 }}>＋</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#aaa' }}>새 추억 만들기</span>
          </button>

          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-[20px] bg-gray-100" style={{ height: 200 }} />
              ))
            : memories.map(mem => (
                <div
                  key={mem.id}
                  className="flex flex-col"
                  style={{
                    background: '#fff',
                    borderRadius: 20,
                    overflow: 'hidden',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                    height: 230,
                  }}
                  onClick={() => router.push(`/place/${mem.id}`)}
                >
                  <img
                    src={mem.imageUrl ?? '/images/no_memory_data.png'}
                    alt={mem.name}
                    className="w-full shrink-0"
                    style={{
                      height: 120,
                      objectFit: mem.imageUrl ? 'cover' : 'fill',
                    }}
                    onError={e => { (e.currentTarget as HTMLImageElement).src = '/images/no_memory_data.png'; }}
                  />
                  <div className="flex flex-col flex-1 overflow-hidden" style={{ padding: 10 }}>
                    {/* Title + more btn */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <p
                        className="text-sm font-bold flex-1 overflow-hidden"
                        style={{ color: '#222', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
                      >
                        {mem.name}
                      </p>
                      <button
                        className="shrink-0"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                        onClick={e => { e.stopPropagation(); setSheetId(mem.id); }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#94a3b8">
                          <circle cx="12" cy="5" r="1.5"/>
                          <circle cx="12" cy="12" r="1.5"/>
                          <circle cx="12" cy="19" r="1.5"/>
                        </svg>
                      </button>
                    </div>

                    {/* Description */}
                    <div style={{ minHeight: 30.8, marginBottom: 2 }}>
                      <p
                        className="line-clamp-2"
                        style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}
                      >
                        {mem.description}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between" style={{ fontSize: 11, marginBottom: 4, marginTop: 2 }}>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-0.5" style={{ color: '#888' }}>
                          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 12, height: 12, flexShrink: 0 }}>
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                          {mem.placeCount}곳
                        </span>
                        {mem.memberCount != null && (
                          <span className="flex items-center gap-0.5" style={{ color: '#888' }}>
                            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 12, height: 12, flexShrink: 0 }}>
                              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                            </svg>
                            {mem.memberCount}명
                          </span>
                        )}
                      </div>
                      {mem.avgRating > 0 && (
                        <span className="flex items-center gap-0.5" style={{ color: '#FFBB00' }}>
                          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 12, height: 12, flexShrink: 0 }}>
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                          </svg>
                          {mem.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    <p style={{ fontSize: 11, color: '#999', paddingTop: 1 }}>
                      {formatDateRange(mem.startDate, mem.endDate)}
                    </p>
                  </div>
                </div>
              ))
          }
        </div>
      </div>

      {/* Bottom Nav */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] z-20 flex items-center bg-white"
        style={{ height: 64, borderTop: '1px solid #eeeeee', justifyContent: 'space-around' }}
      >
        {NAV_ITEMS.map(({ label, href, active, d }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center gap-1"
            style={{ color: active ? '#EF877A' : '#aaaaaa' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d={d} />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
          </Link>
        ))}
      </nav>

      {/* 공유 시트 */}
      {shareData && (
        <div
          className="fixed inset-0 flex items-end justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShareData(null)}
        >
          <div
            className="w-full max-w-[450px] bg-white"
            style={{ borderRadius: '24px 24px 0 0', padding: '12px 20px 40px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 36, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '0 auto 16px' }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16, textAlign: 'center' }}>공유하기</p>
            <button className="kakao-share-btn" onClick={handleKakaoShare}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#191919">
                <path d="M12 3C6.477 3 2 6.597 2 11.05c0 2.9 1.733 5.456 4.345 7.01l-1.107 4.1a.3.3 0 0 0 .444.333l4.835-3.17A12.03 12.03 0 0 0 12 19.1c5.523 0 10-3.597 10-8.05S17.523 3 12 3z" />
              </svg>
              카카오톡으로 공유하기
            </button>
            <button
              onClick={handleCopyShareLink}
              style={{
                width: '100%', padding: '14px 0', marginTop: 10, borderRadius: 14,
                border: '1.5px solid #e2e8f0', background: '#fff',
                fontSize: 15, fontWeight: 700, color: '#475569', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              링크 복사
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', paddingTop: 12 }}>
              링크를 받은 사람은 로그인 후 자동으로 추억에 참여돼요
            </p>
          </div>
        </div>
      )}

      {/* More Bottom Sheet */}
      {sheetId !== null && (
        <div
          className="fixed inset-0 flex items-end justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSheetId(null)}
        >
          <div
            className="w-full max-w-[450px] bg-white"
            style={{ borderRadius: '24px 24px 0 0', padding: '12px 0 40px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 36, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '0 auto 16px' }} />
            {[
              { ...SHEET_ACTIONS[0], onClick: () => handleInvite(sheetId) },
              { ...SHEET_ACTIONS[1], onClick: () => handleEdit(sheetId) },
              { ...SHEET_ACTIONS[2], onClick: () => handleLeave(sheetId) },
              { ...SHEET_ACTIONS[3], onClick: () => handleDeleteMemory(sheetId) },
            ].map(item => (
              <div
                key={item.label}
                className="flex items-center gap-3.5 cursor-pointer hover:bg-slate-50"
                style={{ padding: '16px 20px', fontSize: 15, fontWeight: 500, color: item.danger ? '#ef4444' : '#1e293b' }}
                onClick={item.onClick}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 36, height: 36, borderRadius: 10, background: item.iconBg }}
                >
                  {item.icon}
                </div>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
