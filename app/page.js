'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

const LANDMARKS = [
  { id: 1, name: '청계광장 (스프링)', icon: '⛲' },
  { id: 2, name: '광통교', icon: '🌉' },
  { id: 3, name: '장통교', icon: '🌉' },
  { id: 4, name: '세운상가 앞', icon: '🏢' },
  { id: 5, name: '오간수교', icon: '🌉' },
  { id: 6, name: '관수교', icon: '🌉' },
  { id: 7, name: '동대문 부근', icon: '🏯' },
  { id: 8, name: '황학교', icon: '🌉' },
  { id: 9, name: '비우당교', icon: '🌉' },
  { id: 10, name: '마장동 부근', icon: '🌉' },
]

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금 전'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

function FloatingDucks() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ position: 'absolute', fontSize: `${14 + i * 4}px`, opacity: 0.06, animation: `floatDuck ${20 + i * 5}s linear infinite`, animationDelay: `${i * 4}s`, top: `${15 + i * 18}%` }}>🐥</div>
      ))}
    </div>
  )
}

function StatsBar({ sightings }) {
  const latest = sightings[0]
  const today = new Date().toDateString()
  const todayCount = sightings.filter((s) => new Date(s.spotted_at || s.created_at).toDateString() === today).length
  const uniqueLocs = new Set(sightings.map((s) => s.landmark_id)).size
  const totalLikes = sightings.reduce((a, b) => a + (b.likes || 0), 0)
  const stats = [
    { label: '아기오리', value: latest?.duck_count || '?', icon: '🐥' },
    { label: '오늘 제보', value: todayCount, icon: '📍' },
    { label: '발견 지점', value: uniqueLocs, icon: '🗺️' },
    { label: '응원', value: totalLikes, icon: '❤️' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '12px 8px', textAlign: 'center', border: '1px solid rgba(76,145,115,.1)', boxShadow: '0 2px 8px rgba(45,106,79,.04)' }}>
          <div style={{ fontSize: 18, marginBottom: 2 }}>{s.icon}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1b4332', fontFamily: 'monospace' }}>{s.value}</div>
          <div style={{ fontSize: 10, color: '#6b9080', fontFamily: "'Noto Sans KR',sans-serif", fontWeight: 600 }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

function SafetyTips() {
  const [open, setOpen] = useState(false)
  const tips = [
    { icon: '🚫', text: '먹이 주지 않기 (빵은 해로워요!)' },
    { icon: '🙅', text: '가까이 가지 않기' },
    { icon: '📞', text: '다친 오리 발견 시 구청 신고' },
  ]
  return (
    <div style={{ background: 'linear-gradient(135deg,#fff9e6,#fff3cc)', borderRadius: 16, padding: 16, marginBottom: 16, border: '1px solid rgba(253,203,110,.3)' }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#6c5c00', fontFamily: "'Noto Sans KR',sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>💛 아기오리 관찰 매너</span>
        <span style={{ fontSize: 18, color: '#6c5c00', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
      </div>
      {open && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tips.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6c5c00', fontFamily: "'Noto Sans KR',sans-serif" }}>
              <span>{t.icon}</span><span>{t.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StreamMap({ sightings, onSelect, selected }) {
  const latest = {}
  sightings.forEach((s) => {
    if (!latest[s.landmark_id] || new Date(s.created_at) > new Date(latest[s.landmark_id].created_at)) latest[s.landmark_id] = s
  })
  return (
    <div style={{ background: 'linear-gradient(135deg,#e8f4e8,#d4ecf7 50%,#e8f0e4)', borderRadius: 20, padding: '24px 16px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(76,145,115,.15)', marginBottom: 16 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(76,145,115,0.03) 40px,rgba(76,145,115,0.03) 41px)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, position: 'relative' }}>
        <span style={{ fontSize: 18 }}>🗺️</span>
        <span style={{ fontFamily: "'Noto Sans KR',sans-serif", fontSize: 13, fontWeight: 700, color: '#2d6a4f', letterSpacing: '0.5px' }}>청계천 실시간 지도</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6b9080', fontFamily: "'Noto Sans KR',sans-serif" }}>위치를 눌러 제보하세요</span>
      </div>
      <div style={{ position: 'relative', padding: '8px 0' }}>
        <div style={{ position: 'absolute', top: '50%', left: 24, right: 24, height: 6, background: 'linear-gradient(90deg,#74b9ff,#81ecec,#74b9ff,#55efc4)', borderRadius: 3, transform: 'translateY(-50%)', boxShadow: '0 0 20px rgba(116,185,255,.3)', zIndex: 1 }} />
        <div style={{ position: 'absolute', top: '50%', left: 24, right: 24, height: 6, borderRadius: 3, transform: 'translateY(-50%)', background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.5) 20%,transparent 40%,rgba(255,255,255,0.3) 60%,transparent 80%)', animation: 'shimmer 3s ease-in-out infinite', zIndex: 2 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 3, padding: '0 8px' }}>
          {LANDMARKS.map((lm) => {
            const s = latest[lm.id]; const isSel = selected?.id === lm.id
            const isRecent = s && Date.now() - new Date(s.spotted_at || s.created_at).getTime() < 7200000
            return (
              <div key={lm.id} onClick={() => onSelect(lm)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', transition: 'transform .2s', transform: isSel ? 'scale(1.15)' : 'scale(1)', minWidth: 48 }}>
                <div style={{ height: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 4 }}>
                  {s && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 6px', background: isRecent ? 'linear-gradient(135deg,#ffeaa7,#fdcb6e)' : 'rgba(255,255,255,.7)', borderRadius: 10, fontSize: 11, animation: isRecent ? 'pulse 2s ease-in-out infinite' : 'none', boxShadow: isRecent ? '0 2px 8px rgba(253,203,110,.4)' : 'none' }}>
                      <span style={{ fontSize: 12 }}>🐥</span>
                      <span style={{ fontWeight: 700, color: '#6c5c00', fontFamily: 'monospace' }}>{s.duck_count}</span>
                    </div>
                  )}
                </div>
                <div style={{ width: isSel ? 18 : 14, height: isSel ? 18 : 14, borderRadius: '50%', background: isSel ? 'linear-gradient(135deg,#2d6a4f,#40916c)' : s ? 'linear-gradient(135deg,#fdcb6e,#f39c12)' : '#b7c4b1', border: `2px solid ${isSel ? '#1b4332' : '#fff'}`, boxShadow: isSel ? '0 0 12px rgba(45,106,79,.5)' : '0 2px 4px rgba(0,0,0,.1)', transition: 'all .2s' }} />
                <span style={{ fontSize: 9, marginTop: 6, color: isSel ? '#1b4332' : '#6b9080', fontWeight: isSel ? 700 : 500, textAlign: 'center', maxWidth: 56, lineHeight: 1.2, fontFamily: "'Noto Sans KR',sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lm.name.split(' (')[0]}</span>
              </div>
            )
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 16, justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#6b9080' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(135deg,#fdcb6e,#f39c12)' }} /><span style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>목격됨</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#6b9080' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#b7c4b1' }} /><span style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>미확인</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#6b9080' }}><div style={{ width: 14, height: 14, borderRadius: 7, background: 'linear-gradient(135deg,#ffeaa7,#fdcb6e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}>✨</div><span style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>2시간 이내</span></div>
      </div>
    </div>
  )
}

function SightingCard({ sighting, onLike, isAdmin, onDelete }) {
  const [liked, setLiked] = useState(false)
  const lm = LANDMARKS.find((l) => l.id === sighting.landmark_id) || { name: sighting.landmark_name || '알 수 없음', icon: '📍' }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const likedIds = JSON.parse(localStorage.getItem('duck_liked') || '[]')
      if (likedIds.includes(sighting.id)) setLiked(true)
    }
  }, [sighting.id])

  const handleLikeClick = async () => {
    if (liked) return
    setLiked(true)
    const likedIds = JSON.parse(localStorage.getItem('duck_liked') || '[]')
    likedIds.push(sighting.id)
    localStorage.setItem('duck_liked', JSON.stringify(likedIds))
    await onLike(sighting.id, (sighting.likes || 0) + 1)
  }
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 2px 12px rgba(45,106,79,.06)', border: '1px solid rgba(76,145,115,.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#d4ecf7,#e8f4e8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🦆</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1b4332', fontFamily: "'Noto Sans KR',sans-serif" }}>{sighting.username || '익명'}</div>
            <div style={{ fontSize: 11, color: '#6b9080', fontFamily: "'Noto Sans KR',sans-serif" }}>
              {sighting.spotted_at
                ? `🕐 ${new Date(sighting.spotted_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}에 발견 · ${timeAgo(sighting.created_at)} 제보`
                : timeAgo(sighting.created_at)
              }
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'linear-gradient(135deg,#fff9e6,#fff3cc)', borderRadius: 20, border: '1px solid rgba(253,203,110,.3)' }}>
          <span style={{ fontSize: 14 }}>🐥</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#6c5c00', fontFamily: 'monospace' }}>×{sighting.duck_count}</span>
        </div>
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10, padding: '4px 10px', background: '#f0f7f4', borderRadius: 8, fontSize: 12, color: '#2d6a4f', fontFamily: "'Noto Sans KR',sans-serif" }}>
        <span>{lm.icon}</span><span style={{ fontWeight: 600 }}>{lm.name}</span>
      </div>
      <p style={{ margin: '10px 0', fontSize: 14, lineHeight: 1.6, color: '#2d3436', fontFamily: "'Noto Sans KR',sans-serif" }}>{sighting.comment}</p>
      {sighting.photo_url ? (
        <img src={sighting.photo_url} alt="오리 사진" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12, marginBottom: 8 }} onError={(e) => (e.target.style.display = 'none')} />
      ) : (
        <div style={{ width: '100%', height: 120, borderRadius: 12, background: 'linear-gradient(135deg,#e8f4e8,#d4ecf7 50%,#fff9e6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, gap: 4, fontSize: 28, opacity: 0.6 }}>
          {[...Array(Math.min(sighting.duck_count, 7))].map((_, i) => (
            <span key={i} style={{ animation: 'wobble 1.5s ease-in-out infinite', animationDelay: `${i * 0.15}s` }}>🐥</span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        {isAdmin && (
          <button
            onClick={() => onDelete(sighting.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, fontSize: 12, color: '#d63031' }}
          >
            🗑️ <span style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>삭제</span>
          </button>
        )}
        <button
          onClick={handleLikeClick}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, fontSize: 13, color: liked ? '#e17055' : '#b2bec3' }}
        >
          <span>{liked ? '❤️' : '🤍'}</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{sighting.likes || 0}</span>
        </button>
      </div>
    </div>
  )
}

function ReportForm({ selectedLandmark, onSubmit, onClose }) {
  const [landmark, setLandmark] = useState(selectedLandmark || LANDMARKS[0])
  const [duckCount, setDuckCount] = useState(5)
  const [comment, setComment] = useState('')
  const [username, setUsername] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [spottedTime, setSpottedTime] = useState('now')
  const fileRef = useRef(null)
  useEffect(() => { const s = typeof window !== 'undefined' ? localStorage.getItem('duck_username') : null; if (s) setUsername(s) }, [])
  const handlePhoto = (e) => { const f = e.target.files?.[0]; if (!f) return; setPhoto(f); const r = new FileReader(); r.onload = (ev) => setPhotoPreview(ev.target.result); r.readAsDataURL(f) }
  const handleSubmit = async () => {
    if (!comment.trim()) return
    setSubmitting(true)
    if (username) localStorage.setItem('duck_username', username)
    let spottedAt = null
    if (spottedTime !== 'now') {
      const today = new Date()
      const [h, m] = spottedTime.split(':').map(Number)
      today.setHours(h, m, 0, 0)
      spottedAt = today.toISOString()
    }
    await onSubmit({ landmark, duckCount, comment, username, photo, spottedAt })
    setSubmitting(false)
  }
  const ls = { display: 'block', fontSize: 13, fontWeight: 700, color: '#2d6a4f', marginBottom: 8, fontFamily: "'Noto Sans KR',sans-serif" }
  const is = { width: '100%', padding: 12, borderRadius: 12, border: '1px solid #ddd', fontSize: 14, fontFamily: "'Noto Sans KR',sans-serif", outline: 'none', boxSizing: 'border-box', marginBottom: 20 }
  const cb = { width: 36, height: 36, borderRadius: '50%', border: '1px solid #ddd', background: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2d6a4f' }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(27,67,50,.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn .3s ease' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px 32px', width: '100%', maxWidth: 480, maxHeight: '85vh', overflow: 'auto', animation: 'slideUp .3s ease' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#ddd', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1b4332', fontFamily: "'Noto Sans KR',sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>🐥 아기오리 제보하기</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#b2bec3', cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        <label style={ls}>🏷️ 닉네임</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="닉네임 (선택)" style={is} />

        <label style={ls}>🕐 언제 봤나요?</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => setSpottedTime('now')} style={{ flex: 1, padding: '10px 12px', borderRadius: 12, border: spottedTime === 'now' ? '2px solid #2d6a4f' : '1px solid #ddd', background: spottedTime === 'now' ? '#e8f4e8' : '#fff', fontSize: 13, fontFamily: "'Noto Sans KR',sans-serif", fontWeight: spottedTime === 'now' ? 700 : 500, color: spottedTime === 'now' ? '#1b4332' : '#636e72', cursor: 'pointer' }}>방금 전</button>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="time"
              value={spottedTime === 'now' ? '' : spottedTime}
              onChange={(e) => setSpottedTime(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: spottedTime !== 'now' ? '2px solid #2d6a4f' : '1px solid #ddd', background: spottedTime !== 'now' ? '#e8f4e8' : '#fff', fontSize: 13, fontFamily: "'Noto Sans KR',sans-serif", fontWeight: spottedTime !== 'now' ? 700 : 500, color: spottedTime !== 'now' ? '#1b4332' : '#636e72', cursor: 'pointer', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <label style={ls}>📍 어디서 봤나요?</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {LANDMARKS.map((lm) => (
            <button key={lm.id} onClick={() => setLandmark(lm)} style={{ padding: '6px 12px', borderRadius: 20, border: landmark.id === lm.id ? '2px solid #2d6a4f' : '1px solid #ddd', background: landmark.id === lm.id ? '#e8f4e8' : '#fff', fontSize: 12, fontFamily: "'Noto Sans KR',sans-serif", fontWeight: landmark.id === lm.id ? 700 : 500, color: landmark.id === lm.id ? '#1b4332' : '#636e72', cursor: 'pointer' }}>
              {lm.icon} {lm.name.split(' (')[0]}
            </button>
          ))}
        </div>

        <label style={ls}>🐥 아기오리가 몇 마리인가요?</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setDuckCount(Math.max(1, duckCount - 1))} style={cb}>−</button>
          <div style={{ display: 'flex', gap: 3, minWidth: 80, justifyContent: 'center', alignItems: 'center' }}>
            {[...Array(Math.min(duckCount, 10))].map((_, i) => (<span key={i} style={{ fontSize: duckCount > 7 ? 16 : 20 }}>🐥</span>))}
            {duckCount > 10 && <span style={{ fontSize: 14, color: '#6b9080' }}>+{duckCount - 10}</span>}
          </div>
          <button onClick={() => setDuckCount(duckCount + 1)} style={cb}>+</button>
          <span style={{ fontWeight: 800, fontSize: 20, color: '#1b4332', fontFamily: 'monospace' }}>{duckCount}</span>
        </div>

        <label style={ls}>📸 사진 첨부 (선택)</label>
        <div onClick={() => fileRef.current?.click()} style={{ border: '2px dashed #c1d9c8', borderRadius: 12, padding: photoPreview ? 0 : 20, textAlign: 'center', cursor: 'pointer', marginBottom: 20, overflow: 'hidden', background: '#f8faf9' }}>
          {photoPreview ? <img src={photoPreview} alt="미리보기" style={{ width: '100%', height: 160, objectFit: 'cover' }} /> : <div><div style={{ fontSize: 28, marginBottom: 4 }}>📷</div><div style={{ fontSize: 12, color: '#6b9080', fontFamily: "'Noto Sans KR',sans-serif" }}>탭해서 사진 추가</div></div>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />

        <label style={ls}>💬 한마디</label>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="아기오리들이 뭐하고 있었나요? 상태는 어땠나요?" rows={3} style={{ ...is, resize: 'none', lineHeight: 1.6 }} onFocus={(e) => (e.target.style.borderColor = '#2d6a4f')} onBlur={(e) => (e.target.style.borderColor = '#ddd')} />

        <button onClick={handleSubmit} disabled={!comment.trim() || submitting} style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', background: comment.trim() ? 'linear-gradient(135deg,#2d6a4f,#40916c)' : '#ddd', color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: "'Noto Sans KR',sans-serif", cursor: comment.trim() ? 'pointer' : 'default', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {submitting ? <><span style={{ animation: 'wobble .5s ease-in-out infinite' }}>🐥</span> 제보 중...</> : <>🐥 제보 완료!</>}
        </button>
      </div>
    </div>
  )
}

export default function Home() {
  const [sightings, setSightings] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [selectedLandmark, setSelectedLandmark] = useState(null)
  const [tab, setTab] = useState('feed')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminPw, setAdminPw] = useState('')

  useEffect(() => {
    loadSightings()
    if (typeof window !== 'undefined') {
      setIsAdmin(localStorage.getItem('duck_admin') === 'true')
    }
  }, [])

  function handleAdminLogin() {
    // 비밀번호는 나중에 바꿔주세요!
    if (adminPw === 'duckmaster2025') {
      setIsAdmin(true)
      localStorage.setItem('duck_admin', 'true')
      setShowAdminLogin(false)
      setAdminPw('')
      showToast('관리자 모드 활성화 🔓')
    } else {
      showToast('비밀번호가 틀렸어요')
    }
  }

  function handleAdminLogout() {
    setIsAdmin(false)
    localStorage.removeItem('duck_admin')
    showToast('관리자 모드 해제 🔒')
  }

  async function loadSightings() {
    try {
      const { data, error } = await supabase.from('sightings').select('*').order('created_at', { ascending: false }).limit(50)
      if (error) throw error
      setSightings(data || [])
    } catch (err) { console.error('로드 실패:', err) }
    finally { setLoading(false) }
  }

  async function handleSubmit({ landmark, duckCount, comment, username, photo, spottedAt }) {
    try {
      let photo_url = null
      if (photo) {
        const ext = photo.name.split('.').pop()
        const fileName = `${Date.now()}.${ext}`
        const { error: ue } = await supabase.storage.from('duck-photos').upload(fileName, photo)
        if (!ue) { const { data: u } = supabase.storage.from('duck-photos').getPublicUrl(fileName); photo_url = u.publicUrl }
      }
      const row = { landmark_id: landmark.id, landmark_name: landmark.name, duck_count: duckCount, comment, username: username || '익명', photo_url, likes: 0 }
      if (spottedAt) row.spotted_at = spottedAt
      const { error } = await supabase.from('sightings').insert(row)
      if (error) throw error
      setShowForm(false); setSelectedLandmark(null)
      showToast('제보 완료! 아기오리들이 고마워해요 🐥')
      loadSightings()
    } catch (err) { console.error('제보 실패:', err); showToast('제보에 실패했어요 😢 다시 시도해주세요') }
  }

  async function handleLike(id, newCount) {
    const { error } = await supabase
      .from('sightings')
      .update({ likes: newCount })
      .eq('id', id)
      .select()
    if (error) console.error('좋아요 실패:', error)
    else loadSightings()
  }

  async function handleDelete(id) {
    if (!confirm('이 제보를 삭제할까요?')) return
    const { error } = await supabase.from('sightings').delete().eq('id', id)
    if (error) { console.error('삭제 실패:', error); showToast('삭제 실패 😢') }
    else { showToast('제보가 삭제되었어요'); loadSightings() }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f5f9f7', fontFamily: "'Noto Sans KR','Pretendard',sans-serif", position: 'relative' }}>
      <FloatingDucks />
      <style>{`
        @keyframes floatDuck { 0% { transform:translateX(-60px) } 100% { transform:translateX(calc(100vw + 60px)) } }
        @keyframes wobble { 0%,100% { transform:translateY(0) rotate(0) } 25% { transform:translateY(-3px) rotate(-5deg) } 75% { transform:translateY(-1px) rotate(5deg) } }
        @keyframes pulse { 0%,100% { transform:scale(1) } 50% { transform:scale(1.05) } }
        @keyframes shimmer { 0%,100% { transform:translateX(-100%) translateY(-50%) } 50% { transform:translateX(100%) translateY(-50%) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { transform:translateY(100%) } to { transform:translateY(0) } }
        @keyframes slideDown { from { transform:translateY(-20px);opacity:0 } to { transform:translateY(0);opacity:1 } }
        * { -webkit-tap-highlight-color:transparent }
        ::-webkit-scrollbar { display:none }
      `}</style>

      {/* 헤더 */}
      <div style={{ background: 'linear-gradient(180deg,#e8f4e8,#f5f9f7)', padding: '20px 20px 12px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#1b4332', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.5px' }}>🦆 청계천 아기오리</h1>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b9080', fontWeight: 500 }}>오늘도 아기오리들은 안녕할까요?</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'rgba(45,106,79,.08)', borderRadius: 20, fontSize: 12, color: '#2d6a4f', fontWeight: 700 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#27ae60', animation: 'pulse 2s ease-in-out infinite', display: 'inline-block' }} />LIVE
          </div>
        </div>
        {/* 관리자 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          {isAdmin ? (
            <button onClick={handleAdminLogout} style={{ background: 'rgba(214,48,49,.08)', border: 'none', borderRadius: 12, padding: '4px 10px', fontSize: 11, color: '#d63031', fontWeight: 600, cursor: 'pointer', fontFamily: "'Noto Sans KR',sans-serif" }}>
              🔓 관리자 모드 해제
            </button>
          ) : (
            <button onClick={() => setShowAdminLogin(true)} style={{ background: 'none', border: 'none', padding: '4px 10px', fontSize: 11, color: '#b2bec3', cursor: 'pointer', fontFamily: "'Noto Sans KR',sans-serif" }}>
              🔒
            </button>
          )}
        </div>
        {/* 탭 */}
        <div style={{ display: 'flex', gap: 4, marginTop: 12, background: 'rgba(45,106,79,.06)', borderRadius: 12, padding: 3 }}>
          {[{ key: 'feed', label: '제보 피드', icon: '📋' }, { key: 'map', label: '지도', icon: '🗺️' }].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: 8, borderRadius: 10, border: 'none', background: tab === t.key ? '#fff' : 'transparent', color: tab === t.key ? '#1b4332' : '#6b9080', fontWeight: tab === t.key ? 700 : 500, fontSize: 13, cursor: 'pointer', transition: 'all .2s', boxShadow: tab === t.key ? '0 2px 8px rgba(0,0,0,.06)' : 'none', fontFamily: "'Noto Sans KR',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      <div style={{ padding: '16px 16px 100px', position: 'relative', zIndex: 10 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b9080' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🐥</div>
            <div style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>아기오리를 찾고 있어요...</div>
          </div>
        ) : (
          <>
            <StatsBar sightings={sightings} />
            <SafetyTips />
            {tab === 'map' && <StreamMap sightings={sightings} selected={selectedLandmark} onSelect={(lm) => { setSelectedLandmark(lm); setShowForm(true) }} />}
            {sightings.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '10px 14px', background: 'linear-gradient(135deg,#e8f8e0,#d4f1e0)', borderRadius: 12, border: '1px solid rgba(39,174,96,.15)' }}>
                <span style={{ fontSize: 16, animation: 'wobble 1.5s ease-in-out infinite' }}>🐥</span>
                <span style={{ fontSize: 13, color: '#1b4332', fontWeight: 600 }}>최근 목격: <strong>{LANDMARKS.find((l) => l.id === sightings[0].landmark_id)?.name || sightings[0].landmark_name}</strong> ({timeAgo(sightings[0].spotted_at || sightings[0].created_at)})</span>
              </div>
            )}
            {sightings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b9080' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🐣</div>
                <div style={{ fontFamily: "'Noto Sans KR',sans-serif", fontSize: 15, fontWeight: 600 }}>아직 제보가 없어요!</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>첫 번째로 아기오리를 발견해보세요</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sightings.map((s) => (<SightingCard key={s.id} sighting={s} onLike={handleLike} isAdmin={isAdmin} onDelete={handleDelete} />))}
              </div>
            )}
          </>
        )}
      </div>

      <button onClick={() => setShowForm(true)} style={{ position: 'fixed', bottom: 24, right: 24, width: 60, height: 60, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg,#2d6a4f,#40916c)', color: '#fff', fontSize: 28, cursor: 'pointer', boxShadow: '0 4px 20px rgba(45,106,79,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>📍</button>

      {showForm && <ReportForm selectedLandmark={selectedLandmark} onSubmit={handleSubmit} onClose={() => { setShowForm(false); setSelectedLandmark(null) }} />}

      {/* 관리자 로그인 모달 */}
      {showAdminLogin && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(27,67,50,.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={(e) => e.target === e.currentTarget && setShowAdminLogin(false)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, width: '90%', maxWidth: 320, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#1b4332', fontFamily: "'Noto Sans KR',sans-serif" }}>관리자 로그인</h3>
            <input
              type="password"
              value={adminPw}
              onChange={(e) => setAdminPw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
              placeholder="비밀번호 입력"
              style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #ddd', fontSize: 14, fontFamily: "'Noto Sans KR',sans-serif", outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAdminLogin(false)} style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid #ddd', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Noto Sans KR',sans-serif", color: '#636e72' }}>취소</button>
              <button onClick={handleAdminLogin} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#2d6a4f,#40916c)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Noto Sans KR',sans-serif" }}>확인</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1b4332', color: '#fff', padding: '12px 24px', borderRadius: 14, fontSize: 14, fontWeight: 600, zIndex: 2000, animation: 'slideDown .3s ease', boxShadow: '0 4px 20px rgba(0,0,0,.2)', fontFamily: "'Noto Sans KR',sans-serif" }}>{toast}</div>
      )}
    </div>
  )
}
