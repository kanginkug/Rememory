'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ImageLightbox from '@/components/ImageLightbox';
import {
  fetchMemory,
  fetchMemoryPlaces,
  createInvitation,
  leaveMemory,
  deleteMemory,
  deletePlace,
  CATEGORY_LABEL,
  type MemoryDetail,
  type MemoryPlace,
  type Member,
  type Category,
} from '@/lib/api';
import { renderTextWithLinks } from '@/lib/renderTextWithLinks';

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  RESTAURANT: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v7"/>
    </svg>
  ),
  CAFE: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
      <line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/>
    </svg>
  ),
  ACCOMMODATION: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>
    </svg>
  ),
  ATTRACTION: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/>
      <line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/>
      <line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>
    </svg>
  ),
};

const CATEGORY_FALLBACK: Record<Category, string> = {
  RESTAURANT:    '/images/no_reveiw_restaurant.png',
  ATTRACTION:    '/images/no_review_attraction.png',
  ACCOMMODATION: '/images/no_review_accommodation.png',
  CAFE:          '/images/no_review_cafe.png',
};

const CATEGORY_EMPTY: Record<Category, { image: string; title: string; desc: string; maxWidth: number }> = {
  RESTAURANT:    { image: '/images/no_restaurant.png',   title: '아직 등록된 맛집이 없어요',  desc: '맛있었던 식당을 추가해보세요!',      maxWidth: 250 },
  CAFE:          { image: '/images/no_cafe.png',         title: '아직 등록된 카페가 없어요',  desc: '함께 즐긴 카페를 기록해보세요!',      maxWidth: 180 },
  ACCOMMODATION: { image: '/images/no_room.png',         title: '아직 등록된 숙소가 없어요',  desc: '함께 묵었던 숙소를 추가해보세요!',    maxWidth: 180 },
  ATTRACTION:    { image: '/images/no_accomodation.png', title: '아직 등록된 관광지가 없어요', desc: '함께 방문한 관광지를 기록해보세요!',  maxWidth: 240 },
};

const CATEGORY_TAG: Record<Category, string> = {
  RESTAURANT:    'tag-restaurant',
  CAFE:          'tag-cafe',
  ATTRACTION:    'tag-attraction',
  ACCOMMODATION: 'tag-accommodation',
};

const NAV_ITEMS = [
  { label: '홈',       href: '/home',   d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
  { label: '장소',     href: '/memory', d: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' },
  { label: '지도탐색', href: '/map',    d: 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z' },
  { label: '마이페이지', href: '/my',  d: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
];

function fmtDate(d: string) {
  const dt = new Date(d);
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`;
}

function AvatarFallback() {
  return (
    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#94a3b8">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </div>
  );
}

export default function MemoryPlacePage() {
  const router = useRouter();
  const params = useParams();
  const memoryId = Number(params.id);

  const [memory,  setMemory]  = useState<MemoryDetail | null>(null);
  const [places,  setPlaces]  = useState<MemoryPlace[]>([]);
  const [members,        setMembers]        = useState<Member[]>([]);

  const [descExpanded,  setDescExpanded]  = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

  const [searchInput,    setSearchInput]    = useState('');
  const [keyword,        setKeyword]        = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'ALL'>('ALL');
  const [activeRegion,   setActiveRegion]   = useState<{ depth1: string; depth2: string } | null>(null);

  const [inviteLink,   setInviteLink]   = useState('');
  const [moreSheet,    setMoreSheet]    = useState(false);
  const [shareSheet,   setShareSheet]   = useState(false);
  const [memberSheet,  setMemberSheet]  = useState(false);
  const [regionSheet,  setRegionSheet]  = useState(false);
  const [placeMoreId,  setPlaceMoreId]  = useState<number | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) { router.replace('/login'); return; }
    Promise.allSettled([
      fetchMemory(memoryId),
      fetchMemoryPlaces(memoryId),
    ]).then(([m, p]) => {
      if (m.status === 'fulfilled') {
        setMemory(m.value);
        if (m.value.memberInfoDTOList) setMembers(m.value.memberInfoDTOList);
      }
      if (p.status === 'fulfilled') setPlaces(p.value);
    });
  }, [memoryId, router]);

  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    // inline style로 clamp 적용 전 전체 높이 측정
    el.style.cssText = 'display:block;overflow:visible;';
    const full = el.scrollHeight;
    el.style.cssText = '';
    setDescOverflows(full > el.clientHeight);
  }, [memory]);

  const anySheet = moreSheet || shareSheet || memberSheet || regionSheet || placeMoreId !== null;
  useEffect(() => {
    document.body.style.overflow = anySheet ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [anySheet]);

  const filteredPlaces = useMemo(() => places.filter(p => {
    if (activeCategory !== 'ALL' && p.category !== activeCategory) return false;
    if (activeRegion && (p.regionDepth1 !== activeRegion.depth1 || p.regionDepth2 !== activeRegion.depth2)) return false;
    if (keyword && !p.name.includes(keyword)) return false;
    return true;
  }), [places, activeCategory, activeRegion, keyword]);

  const regions = useMemo(() => {
    const map = new Map<string, Set<string>>();
    places.forEach(p => {
      if (!p.regionDepth1) return;
      if (!map.has(p.regionDepth1)) map.set(p.regionDepth1, new Set());
      if (p.regionDepth2) map.get(p.regionDepth1)!.add(p.regionDepth2);
    });
    return map;
  }, [places]);

  const handleOpenMemberSheet = () => {
    setMemberSheet(true);
  };

  const handleInvite = async () => {
    setMoreSheet(false);
    try {
      const { inviteCode } = await createInvitation(memoryId);
      setInviteLink(`${window.location.origin}/invite/${inviteCode}`);
      setShareSheet(true);
    } catch (e) { alert((e as Error).message); }
  };

  const handleKakaoShare = () => {
    if (!inviteLink) return;
    window.Kakao.Share.sendDefault({
      objectType: 'text',
      text: `[Rememory] ${memory?.name ?? ''}에 초대합니다!\n아래 버튼을 눌러 추억에 참여하세요 🎉`,
      link: { mobileWebUrl: inviteLink, webUrl: inviteLink },
      buttons: [{ title: '추억 참여하기', link: { mobileWebUrl: inviteLink, webUrl: inviteLink } }],
    });
  };

  const handleCopyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      alert('초대 링크가 복사됐습니다.');
    } catch (e) { alert('복사에 실패했습니다.'); }
    setShareSheet(false);
  };

  const handleLeave = async () => {
    setMoreSheet(false);
    if (!confirm('정말 이 추억에서 나가시겠어요?')) return;
    try { await leaveMemory(memoryId); router.replace('/memory'); }
    catch (e) { alert((e as Error).message); }
  };

  const handleDeleteMemory = async () => {
    setMoreSheet(false);
    if (!confirm('추억을 삭제하시겠어요?')) return;
    try { await deleteMemory(memoryId); router.replace('/memory'); }
    catch (e) { alert((e as Error).message); }
  };

  const handleDeletePlace = async (placeId: number) => {
    setPlaceMoreId(null);
    if (!confirm('장소를 삭제하시겠어요?')) return;
    try { await deletePlace(memoryId, placeId); setPlaces(prev => prev.filter(p => p.id !== placeId)); }
    catch (e) { alert((e as Error).message); }
  };

  const avgRating = memory?.avgRating ?? 0;
  const starPct   = (avgRating / 5) * 100;

  const totalPhotoCount = useMemo(
    () => places.reduce((sum, p) => sum + p.placePhotoList.length, 0),
    [places]
  );
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  return (
    <div style={{ background: '#BFDBF3', minHeight: '100dvh' }}>
      <header className="app-header">
        <button className="back-btn" onClick={() => router.push('/memory')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <img src="/images/default_phrase.png" alt="Rememory" className="logo-img" />
        <img src="/images/bell_icon_transparent.png" alt="알림" className="bell-img" />
      </header>

      <div className="app-container" style={{ paddingTop: 70, paddingBottom: 90 }}>
        <div className="content">

          {/* 제목 + 더보기 */}
          <div className="title-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 className="main-title" style={{ marginBottom: 0 }}>{memory?.name ?? ''}</h1>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }} onClick={() => setMoreSheet(true)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#1e293b">
                <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </div>

          {/* 설명 */}
          {memory?.description && (
            <div className="memory-desc-card">
              <div style={{ position: 'relative' }}>
                <p
                  ref={descRef}
                  className="memory-desc-text"
                  style={descExpanded ? {
                    display: 'block',
                    overflow: 'visible',
                    whiteSpace: 'pre-line',
                    wordBreak: 'break-word',
                    WebkitLineClamp: 'unset' as any,
                  } : {
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as any,
                    overflow: 'hidden',
                    whiteSpace: 'pre-line',
                    wordBreak: 'break-word',
                  }}
                >
                  {renderTextWithLinks(memory.description)}
                </p>
                {(descOverflows || descExpanded) && (
                  <button
                    onClick={() => setDescExpanded(e => !e)}
                    style={descExpanded ? {
                      display: 'block',
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#7F77DD',
                      cursor: 'pointer',
                      marginTop: 2,
                    } : {
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      border: 'none',
                      background: 'linear-gradient(to right, transparent, white 40%)',
                      paddingLeft: 32,
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#7F77DD',
                      cursor: 'pointer',
                      lineHeight: '1.6',
                    }}
                  >
                    {descExpanded ? '접기' : '더보기'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 추억 대표 사진 */}
          {memory?.imageUrl && (
            <div className="memory-hero" onClick={() => setLightbox({ images: [memory.imageUrl!], index: 0 })}>
              <img
                className="memory-hero-img"
                src={memory.imageUrl}
                alt="추억 대표 사진"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}

          {/* 요약 카드 */}
          <div className="summary-card">
            <div className="summary-item">
              <div className="summary-icon bg-purple">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </div>
              <div className="summary-label">평균 별점</div>
              <div className="summary-value">{avgRating > 0 ? avgRating.toFixed(1) : '-'}</div>
              {avgRating > 0 && (
                <div className="stars">
                  <svg width="72" height="13" viewBox="0 0 72 13">
                    <defs><clipPath id="starFill"><rect x="0" y="0" width={`${starPct}%`} height="13" /></clipPath></defs>
                    <text x="0" y="11" fontSize="13" letterSpacing="1" fill="#e2e8f0">★★★★★</text>
                    <text x="0" y="11" fontSize="13" letterSpacing="1" fill="#ffb800" clipPath="url(#starFill)">★★★★★</text>
                  </svg>
                </div>
              )}
            </div>
            <div className="summary-item">
              <div className="summary-icon bg-blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <div className="summary-label">장소 수</div>
              <div className="summary-value">{memory?.placeCount ?? 0}곳</div>
            </div>
            <div className="summary-item" style={{ cursor: 'pointer' }} onClick={handleOpenMemberSheet}>
              <div className="summary-icon bg-orange">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </div>
              <div className="summary-label">멤버 수</div>
              <div className="summary-value">{memory?.memberCount ?? 0}명</div>
            </div>
          </div>

          {places.length > 0 && (
            <>
              {/* 검색 */}
              <div className="search-section" style={{ padding: '0 0 16px' }}>
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="장소명 검색"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && setKeyword(searchInput)}
                  />
                  {searchInput && (
                    <button className="search-clear visible" onClick={() => { setSearchInput(''); setKeyword(''); }}>
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                    </button>
                  )}
                  <button className="search-btn" onClick={() => setKeyword(searchInput)}>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                  </button>
                </div>
              </div>

              {/* 필터 */}
              <div className="filter-row">
                <button className={`region-btn${activeRegion ? ' selected' : ''}`} onClick={() => setRegionSheet(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span>{activeRegion ? activeRegion.depth2 : '지역 선택'}</span>
                </button>
                <div className="filter-container">
                  {(['ALL', 'RESTAURANT', 'CAFE', 'ACCOMMODATION', 'ATTRACTION'] as const).map(cat => (
                    <button
                      key={cat}
                      className={`chip chip-${cat.toLowerCase()}${activeCategory === cat ? ' active' : ''}`}
                      onClick={() => setActiveCategory(cat)}
                    >
                      {cat === 'ALL' ? '전체' : <>{CATEGORY_ICON[cat]} {CATEGORY_LABEL[cat]}</>}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 장소 목록 */}
          {places.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 18, padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <img src="/images/no_place_data.png" alt="장소 없음" style={{ width: '100%', maxWidth: 360 }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: 20, color: '#1e293b', marginBottom: 10 }}>기록된 장소가 없어요</p>
                <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7 }}>이 여행에서 가장 기억에 남는 공간은 어디였나요?<br />지금 바로 첫 장소를 추가해보세요!</p>
              </div>
            </div>
          ) : filteredPlaces.length === 0 && activeCategory !== 'ALL' ? (
            <div style={{ background: '#fff', borderRadius: 18, padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <img src={CATEGORY_EMPTY[activeCategory].image} alt="장소 없음" style={{ width: '100%', maxWidth: CATEGORY_EMPTY[activeCategory].maxWidth }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: 17, color: '#1e293b', marginBottom: 10 }}>{CATEGORY_EMPTY[activeCategory].title}</p>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>{CATEGORY_EMPTY[activeCategory].desc}</p>
              </div>
            </div>
          ) : (
          <div className="place-list">
            {filteredPlaces.map(place => (
              <Link key={place.id} href={`/place/${memoryId}/${place.id}`} className="place-card">
                <img
                  className="place-img"
                  src={place.placePhotoList.at(-1)?.imageUrl ?? CATEGORY_FALLBACK[place.category]}
                  alt={place.name}
                  onError={e => { (e.currentTarget as HTMLImageElement).src = CATEGORY_FALLBACK[place.category]; }}
                />
                <div className="place-info">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                    <div className="place-name">{place.name}</div>
                    <button
                      className="card-more-btn"
                      onClick={e => { e.preventDefault(); setPlaceMoreId(place.id); }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#94a3b8">
                        <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                      </svg>
                    </button>
                  </div>
                  {(place.address || place.regionDepth1) && (
                    <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
                      {place.address || [place.regionDepth1, place.regionDepth2].filter(Boolean).join(' ')}
                      {place.detailAddress ? ` ${place.detailAddress}` : ''}
                    </div>
                  )}
                  <div className={`tag ${CATEGORY_TAG[place.category]}`}>{CATEGORY_LABEL[place.category]}</div>
                  <div className="rating-review">
                    ⭐ {place.avgRating.toFixed(1)} <span>({place.reviewCount})</span>
                  </div>
                  {place.description && <div className="place-desc">{place.description}</div>}
                </div>
              </Link>
            ))}
          </div>
          )}

        </div>

        {/* FAB */}
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 450, pointerEvents: 'none', zIndex: 100 }}>
          <button className="fab" style={{ position: 'absolute', bottom: 80, right: 20, pointerEvents: 'auto' }} onClick={() => router.push(`/place/${memoryId}/new`)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            장소 추가
          </button>
        </div>

        {/* 하단 네비 */}
        <nav className="bottom-nav">
          {NAV_ITEMS.map(({ label, href, d }) => (
            <Link key={label} href={href} className={`nav-item${label === '장소' ? ' active' : ''}`} style={label === '장소' ? { color: '#7F77DD' } : {}}>
              <span className="nav-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg></span>
              <span className="nav-label">{label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {lightbox && (
        <ImageLightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}

      {/* ── 바텀시트 ── */}

      {/* 추억 더보기 */}
      {moreSheet && (
        <div className="sheet-overlay open" onClick={() => setMoreSheet(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="menu-item" onClick={handleInvite}>
              <div className="menu-item-icon" style={{ background: '#fff9e6' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </div>
              초대하기
            </div>
            <div className="menu-item" onClick={() => { setMoreSheet(false); router.push(`/memory/${memoryId}/edit?from=place`); }}>
              <div className="menu-item-icon" style={{ background: '#f1f0ff' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
              추억 수정
            </div>
            <div className="menu-item" onClick={handleLeave}>
              <div className="menu-item-icon" style={{ background: '#f0fdf4' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>
              추억 나가기
            </div>
            <div className="menu-item danger" onClick={handleDeleteMemory}>
              <div className="menu-item-icon" style={{ background: '#fef2f2' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </div>
              추억 삭제
            </div>
          </div>
        </div>
      )}

      {/* 공유 시트 */}
      {shareSheet && (
        <div className="sheet-overlay open" onClick={() => setShareSheet(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">공유하기</div>
            <div className="sheet-body" style={{ padding: '0 20px 8px' }}>
              <button className="kakao-share-btn" onClick={handleKakaoShare}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#191919">
                  <path d="M12 3C6.477 3 2 6.597 2 11.05c0 2.9 1.733 5.456 4.345 7.01l-1.107 4.1a.3.3 0 0 0 .444.333l4.835-3.17A12.03 12.03 0 0 0 12 19.1c5.523 0 10-3.597 10-8.05S17.523 3 12 3z" />
                </svg>
                카카오톡으로 공유하기
              </button>
              <button
                onClick={handleCopyInviteLink}
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
        </div>
      )}

      {/* 멤버 시트 */}
      {memberSheet && (
        <div className="sheet-overlay open" onClick={() => setMemberSheet(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">멤버 {members.length}명</div>
            <div className="sheet-body">
              {members.map(m => (
                <div key={m.memberId} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px' }}>
                  {m.profileImageUrl
                    ? <img src={m.profileImageUrl} alt={m.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).replaceWith(document.createElement('div')); }} />
                    : <AvatarFallback />
                  }
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{m.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 지역 시트 */}
      {regionSheet && (
        <div className="sheet-overlay open" onClick={() => setRegionSheet(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">지역 선택</div>
            <div className="sheet-body">
              <div className={`region-depth2-item${!activeRegion ? ' selected' : ''}`} onClick={() => { setActiveRegion(null); setRegionSheet(false); }}>
                전체 (지역 해제) <span className="region-check">✓</span>
              </div>
              <div className="region-depth1-divider" />
              {Array.from(regions.entries()).map(([depth1, depth2Set]) => (
                <div key={depth1}>
                  <div className="region-depth1">{depth1}</div>
                  <div className="region-depth1-divider" />
                  {Array.from(depth2Set).map(depth2 => (
                    <div
                      key={depth2}
                      className={`region-depth2-item${activeRegion?.depth1 === depth1 && activeRegion?.depth2 === depth2 ? ' selected' : ''}`}
                      onClick={() => { setActiveRegion({ depth1, depth2 }); setRegionSheet(false); }}
                    >
                      {depth2} <span className="region-check">✓</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 장소 더보기 시트 */}
      {placeMoreId !== null && (
        <div className="sheet-overlay open" onClick={() => setPlaceMoreId(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="menu-item" onClick={() => { setPlaceMoreId(null); router.push(`/place/${memoryId}/${placeMoreId}/edit`); }}>
              <div className="menu-item-icon" style={{ background: '#f1f0ff' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
              장소 수정
            </div>
            <div className="menu-item danger" onClick={() => handleDeletePlace(placeMoreId)}>
              <div className="menu-item-icon" style={{ background: '#fef2f2' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </div>
              장소 삭제
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
