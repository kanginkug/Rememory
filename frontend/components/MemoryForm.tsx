'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface MemoryFormValues {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  showHistory: boolean;
  photoFile: File | null;
  photoRemoved: boolean;
}

interface MemoryFormProps {
  title: string;
  submitLabel: string;
  submittingLabel: string;
  initialData?: {
    name?: string;
    description?: string;
    startDate?: string | null;
    endDate?: string | null;
    imageUrl?: string | null;
  };
  onSubmit: (values: MemoryFormValues) => Promise<void>;
}

export default function MemoryForm({ title, submitLabel, submittingLabel, initialData, onSubmit }: MemoryFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showHistory, setShowHistory] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!initialData) return;
    if (initialData.name) setName(initialData.name);
    if (initialData.description) setDescription(initialData.description);
    setStartDate(initialData.startDate ?? '');
    setEndDate(initialData.endDate ?? '');
    setPreviewUrl(initialData.imageUrl ?? '');
  }, [initialData]);

  const isActive = name.trim() !== '' && description.trim() !== '';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setPhotoRemoved(false);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPreviewUrl('');
    setPhotoRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (endDate && endDate < val) setEndDate(val);
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    if (startDate && startDate > val) setStartDate(val);
  };

  const handleSubmit = async () => {
    if (!isActive || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim(), startDate, endDate, showHistory, photoFile, photoRemoved });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-dvh mx-auto w-full max-w-[450px]"
      style={{
        background: '#BFDBF3',
        backgroundImage: "url('/images/make_memory_background.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: 90,
      }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between"
        style={{ padding: '16px 20px', background: 'transparent' }}
      >
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>{title}</h1>
        <div style={{ width: 30 }} />
      </header>

      {/* Photo upload */}
      <div style={{ padding: '10px 20px 20px', position: 'relative' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <label
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center w-full cursor-pointer overflow-hidden"
          style={{
            aspectRatio: '1',
            background: '#fff',
            borderRadius: 20,
            border: previewUrl ? 'none' : '1px dashed #D0D7DE',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            position: 'relative',
            transition: 'background 0.2s',
          }}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="표지 미리보기"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', borderRadius: 20 }}
            />
          ) : (
            <>
              <div style={{ marginBottom: 10 }}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <span style={{ fontSize: 14, color: '#777', fontWeight: 500 }}>표지 사진 추가</span>
            </>
          )}
        </label>
        {previewUrl && (
          <button
            type="button"
            onClick={handleRemovePhoto}
            className="flex items-center justify-center"
            style={{
              position: 'absolute', top: 20, right: 30,
              width: 32, height: 32,
              background: 'rgba(0,0,0,0.45)',
              border: 'none', borderRadius: '50%',
              cursor: 'pointer', color: '#fff',
              zIndex: 10,
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}>
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Input card */}
      <div
        style={{
          margin: '0 20px',
          background: '#fff',
          borderRadius: 24,
          padding: '24px 20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}
      >
        {/* 추억 이름 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#444', marginBottom: 8 }}>
            추억 이름 <span style={{ color: '#FF5A5A' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value.slice(0, 30))}
              placeholder="예: 단짝 친구들과의 부산 여행"
              style={{
                width: '100%', padding: '12px 14px',
                border: '1px solid #EAEAEA', borderRadius: 12,
                fontSize: 14, background: '#FAFAFA', color: '#333',
                outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#BFDBF3'; e.currentTarget.style.background = '#fff'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#EAEAEA'; e.currentTarget.style.background = '#FAFAFA'; }}
            />
            <span style={{ position: 'absolute', bottom: 10, right: 12, fontSize: 12, color: name.length >= 30 ? '#FF5A5A' : '#94a3b8' }}>
              {name.length} / 30
            </span>
          </div>
        </div>

        {/* 설명 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#444', marginBottom: 8 }}>
            설명 <span style={{ color: '#FF5A5A' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, 500))}
              rows={4}
              placeholder="이 추억에 대한 짤막한 이야기를 적어주세요."
              style={{
                width: '100%', padding: '12px 14px',
                border: '1px solid #EAEAEA', borderRadius: 12,
                fontSize: 14, background: '#FAFAFA', color: '#333',
                outline: 'none', resize: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#BFDBF3'; e.currentTarget.style.background = '#fff'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#EAEAEA'; e.currentTarget.style.background = '#FAFAFA'; }}
            />
            <span style={{ position: 'absolute', bottom: 10, right: 12, fontSize: 12, color: description.length >= 500 ? '#FF5A5A' : '#94a3b8' }}>
              {description.length} / 500
            </span>
          </div>
        </div>

        {/* 기간 설정 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#444', marginBottom: 8 }}>
            기간 설정
          </label>
          <div className="flex items-center gap-2.5">
            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={e => handleStartDateChange(e.target.value)}
                style={{
                  width: '100%', padding: '12px 12px 12px 36px',
                  border: '1px solid #EAEAEA', borderRadius: 12,
                  fontSize: 13, background: '#FAFAFA', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, pointerEvents: 'none' }}>📅</span>
            </div>
            <span style={{ color: '#777', fontWeight: 700, flexShrink: 0 }}>~</span>
            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={e => handleEndDateChange(e.target.value)}
                style={{
                  width: '100%', padding: '12px 12px 12px 36px',
                  border: '1px solid #EAEAEA', borderRadius: 12,
                  fontSize: 13, background: '#FAFAFA', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, pointerEvents: 'none' }}>📅</span>
            </div>
          </div>
        </div>

        {/* 신규 멤버 공개 토글 */}
        <div
          className="flex justify-between items-center"
          style={{ paddingTop: 16, borderTop: '1px solid #F5F5F5', marginTop: 8 }}
        >
          <div className="flex flex-col">
            <span style={{ fontSize: 14, fontWeight: 600, color: '#444' }}>신규 멤버에게 과거 기록 공개</span>
            <p style={{ fontSize: 11, color: '#777', marginTop: 2 }}>나중에 초대된 멤버에게도 이전 장소와 후기를 공개합니다.</p>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 26, flexShrink: 0, marginLeft: 12 }}>
            <input
              type="checkbox"
              checked={showHistory}
              onChange={e => setShowHistory(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: 'absolute', cursor: 'pointer',
                top: 0, left: 0, right: 0, bottom: 0,
                background: showHistory ? '#34C759' : '#E9E9EA',
                borderRadius: 34, transition: '0.3s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  height: 20, width: 20,
                  left: showHistory ? 25 : 3,
                  bottom: 3,
                  background: '#fff',
                  borderRadius: '50%',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: '0.3s',
                }}
              />
            </span>
          </label>
        </div>
      </div>

      {/* Submit button */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px]"
        style={{ padding: '16px 20px' }}
      >
        <button
          onClick={handleSubmit}
          disabled={!isActive || submitting}
          style={{
            width: '100%', padding: 16,
            border: '1.5px solid',
            borderRadius: 16,
            fontSize: 16, fontWeight: 700,
            cursor: isActive ? 'pointer' : 'default',
            transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
            background: isActive ? '#EF877A' : '#FACCCA',
            borderColor: isActive ? '#EF877A' : '#FACCCA',
            color: isActive ? '#fff' : '#7F3530',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </div>
  );
}
