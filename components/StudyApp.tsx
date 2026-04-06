'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'
import { PLAYLIST, SUBJECTS, type Lesson, type Subject } from '@/lib/playlist'

// Generate or retrieve a stable user ID
function getUserId(): string {
  let id = localStorage.getItem('apstack_uid')
  if (!id) {
    id = 'user_' + Math.random().toString(36).slice(2, 11)
    localStorage.setItem('apstack_uid', id)
  }
  return id
}

// e.g. calc unit 3 lesson 1 → "3.1"
function lessonCode(l: Lesson): string {
  return `${l.unit}.${l.lesson}`
}

type Filter = 'all' | Subject
type Tab = 'lesson' | 'practice'

const SUBJECT_KEYS = Object.keys(SUBJECTS) as Subject[]

export default function StudyApp() {
  const [currentIdx, setCurrentIdx] = useState<number | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const [lessonText, setLessonText] = useState<string>('')
  const [lessonLoading, setLessonLoading] = useState(false)
  const [lessonCache, setLessonCache] = useState<Record<string, string>>({})
  const [practiceText, setPracticeText] = useState<string>('')
  const [practiceLoading, setPracticeLoading] = useState(false)
  const [practiceCache, setPracticeCache] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<Tab>('lesson')
  const [askInput, setAskInput] = useState('')
  const [askLoading, setAskLoading] = useState(false)
  const [followups, setFollowups] = useState<{ q: string; a: string }[]>([])
  const [userId, setUserId] = useState<string>('')
  const [syncing, setSyncing] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [loginInput, setLoginInput] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  // Init user + load progress
  useEffect(() => {
    const uid = getUserId()
    setUserId(uid)
    const lastIdx = localStorage.getItem('apstack_lastIdx')
    if (lastIdx !== null) setCurrentIdx(parseInt(lastIdx))
    fetch(`/api/progress?userId=${uid}`)
      .then(r => r.json())
      .then(data => { if (data.completed) setCompleted(data.completed) })
      .catch(() => { })
  }, [])

  const filteredPlaylist = filter === 'all' ? PLAYLIST : PLAYLIST.filter(l => l.subj === filter)
  const lesson: Lesson | null = currentIdx !== null ? PLAYLIST[currentIdx] : null

  const loadLesson = useCallback(async (idx: number) => {
    const l = PLAYLIST[idx]
    setCurrentIdx(idx)
    setFollowups([])
    setAskInput('')
    setActiveTab('lesson')
    setPracticeText('')
    localStorage.setItem('apstack_lastIdx', String(idx))

    if (lessonCache[l.id]) {
      setLessonText(lessonCache[l.id])
      return
    }
    setLessonLoading(true)
    setLessonText('')
    try {
      const res = await fetch('/api/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: l.id }),
      })
      const data = await res.json()
      if (!data.text) {
        setLessonText(`❌ Generation failed: ${data.error || 'Unknown error'}\n\nCheck Vercel logs for details.`)
        setLessonLoading(false)
        return
      }
      setLessonText(data.text)
      setLessonCache(prev => ({ ...prev, [l.id]: data.text }))
    } catch {
      setLessonText('Error loading lesson. Check your connection and try again.')
    }
    setLessonLoading(false)
  }, [lessonCache])

  const loadPractice = useCallback(async () => {
    if (!lesson) return
    if (practiceCache[lesson.id]) {
      setPracticeText(practiceCache[lesson.id])
      return
    }
    setPracticeLoading(true)
    setPracticeText('')
    try {
      const res = await fetch('/api/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id, mode: 'practice' }),
      })
      const data = await res.json()
      if (!data.text) {
        setPracticeText(`❌ Generation failed: ${data.error || 'Unknown error'}\n\nCheck Vercel logs for details.`)
        setPracticeLoading(false)
        return
      }
      setPracticeText(data.text)
      setPracticeCache(prev => ({ ...prev, [lesson.id]: data.text }))
    } catch {
      setPracticeText('Error generating practice problems. Try again.')
    }
    setPracticeLoading(false)
  }, [lesson, practiceCache])

  const switchTab = (tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'practice' && lesson && !practiceCache[lesson.id] && !practiceLoading) {
      loadPractice()
    }
  }

  const switchAccount = async () => {
    const newId = loginInput.trim()
    if (!newId) return
    localStorage.setItem('apstack_uid', newId)
    setUserId(newId)
    setShowLoginDialog(false)
    setLoginInput('')
    try {
      const data = await fetch(`/api/progress?userId=${encodeURIComponent(newId)}`).then(r => r.json())
      if (data.completed) setCompleted(data.completed)
    } catch { }
  }

  const toggleComplete = async () => {
    if (!lesson || !userId) return
    const next = !completed[lesson.id]
    setCompleted(prev => ({ ...prev, [lesson.id]: next }))
    setSyncing(true)
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, lessonId: lesson.id, completed: next }),
      })
    } catch { }
    setSyncing(false)
  }

  const navigate = (dir: -1 | 1) => {
    if (currentIdx === null) return
    const next = currentIdx + dir
    if (next >= 0 && next < PLAYLIST.length) loadLesson(next)
  }

  const askQuestion = async () => {
    if (!askInput.trim() || !lesson) return
    const q = askInput.trim()
    setAskInput('')
    setAskLoading(true)
    setFollowups(prev => [...prev, { q, a: '' }])
    try {
      const res = await fetch('/api/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id, question: q }),
      })
      const data = await res.json()
      setFollowups(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { q, a: data.text || 'No answer.' }
        return updated
      })
    } catch {
      setFollowups(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { q, a: 'Error getting answer.' }
        return updated
      })
    }
    setAskLoading(false)
  }

  const totalDone = Object.values(completed).filter(Boolean).length
  const pct = Math.round((totalDone / PLAYLIST.length) * 100)
  const localIdx = lesson ? filteredPlaylist.indexOf(lesson) : -1

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0f0e17' }}>
      {/* SIDEBAR */}
      <aside className="flex flex-col shrink-0 border-r" style={{ width: 290, background: '#1a1927', borderColor: 'rgba(255,255,255,0.08)' }}>
        {/* Logo */}
        <div className="p-5 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#ff8906' }}>
            AP<span style={{ color: '#fffffe', fontStyle: 'italic' }}>Stack</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Your AP exam study playlist</div>
          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between mb-1" style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span>Overall progress</span>
              <span>{syncing ? '↑' : `${pct}%`}</span>
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #ff8906, #f25f4c)' }} />
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{totalDone} / {PLAYLIST.length} lessons done</div>
          </div>
        </div>

        {/* Subject filter pills */}
        <div className="flex flex-wrap gap-1.5 p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {(['all', ...SUBJECT_KEYS] as (Filter)[]).map(f => {
            const isActive = filter === f
            const subj = f !== 'all' ? SUBJECTS[f] : null
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="rounded-full border transition-all"
                style={{
                  fontSize: 10, fontWeight: 600, padding: '3px 10px',
                  textTransform: 'uppercase', letterSpacing: '0.4px',
                  background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                  borderColor: isActive && subj ? subj.accent : 'rgba(255,255,255,0.15)',
                  color: isActive && subj ? subj.accent : isActive ? '#fffffe' : 'rgba(255,255,255,0.45)',
                }}
              >
                {f === 'all' ? 'All' : SUBJECTS[f].short}
              </button>
            )
          })}
        </div>

        {/* Lesson list */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredPlaylist.map((l) => {
            const gIdx = PLAYLIST.indexOf(l)
            const isActive = currentIdx === gIdx
            const isDone = !!completed[l.id]
            const subj = SUBJECTS[l.subj]
            return (
              <button
                key={l.id}
                onClick={() => loadLesson(gIdx)}
                className="w-full flex items-center gap-2.5 rounded-xl text-left transition-all mb-0.5"
                style={{ padding: '9px 11px', background: isActive ? '#242336' : 'transparent' }}
              >
                {/* Unit badge */}
                <div className="shrink-0 rounded-lg flex flex-col items-center justify-center font-bold" style={{ width: 32, height: 32, fontSize: 10, color: subj.accent, background: `${subj.accent}18`, lineHeight: 1 }}>
                  <span style={{ fontSize: 8, fontWeight: 500, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.2px' }}>{subj.short.slice(0, 3)}</span>
                  <span style={{ fontSize: 11 }}>{lessonCode(l)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate" style={{ fontSize: 13, fontWeight: 500, color: isActive ? '#fffffe' : 'rgba(255,255,255,0.75)', lineHeight: 1.3 }}>{l.title}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 1 }}>{subj.label} · Unit {l.unit}</div>
                </div>
                {/* Check */}
                <div className="shrink-0 rounded-full flex items-center justify-center transition-all" style={{ width: 18, height: 18, border: `1.5px solid ${isDone ? '#4ade80' : 'rgba(255,255,255,0.15)'}`, background: isDone ? '#4ade80' : 'transparent', fontSize: 10, color: isDone ? '#0f0e17' : 'transparent', fontWeight: 700 }}>
                  {isDone ? '✓' : ''}
                </div>
              </button>
            )
          })}
        </div>

        {/* User ID footer */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', wordBreak: 'break-all', marginBottom: 6 }}>
            User ID: {userId.slice(0, 16)}{userId.length > 16 ? '…' : ''}
          </div>
          <button
            id="switch-account-btn"
            onClick={() => { setLoginInput(''); setShowLoginDialog(true) }}
            className="w-full rounded-lg transition-all font-medium"
            style={{ padding: '7px 0', fontSize: 12, background: '#242336', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
          >
            🔑 Log in with User ID
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 px-7 border-b shrink-0" style={{ height: 60, borderColor: 'rgba(255,255,255,0.08)', background: '#0f0e17' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} disabled={currentIdx === null || currentIdx === 0}
              className="rounded-lg border flex items-center justify-center transition-all disabled:opacity-30"
              style={{ width: 32, height: 32, borderColor: 'rgba(255,255,255,0.14)', background: '#1a1927', color: '#fffffe', fontSize: 18 }}>‹</button>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              {lesson ? `Lesson ${localIdx + 1} of ${filteredPlaylist.length}` : '— of —'}
            </span>
            <button onClick={() => navigate(1)} disabled={currentIdx === null || currentIdx === PLAYLIST.length - 1}
              className="rounded-lg border flex items-center justify-center transition-all disabled:opacity-30"
              style={{ width: 32, height: 32, borderColor: 'rgba(255,255,255,0.14)', background: '#1a1927', color: '#fffffe', fontSize: 18 }}>›</button>
          </div>
          {lesson && (
            <button onClick={toggleComplete}
              className="rounded-lg transition-all font-medium"
              style={{
                padding: '7px 18px', fontSize: 13,
                background: completed[lesson.id] ? '#242336' : '#4ade80',
                color: completed[lesson.id] ? 'rgba(255,255,255,0.45)' : '#0f0e17',
                border: completed[lesson.id] ? '1px solid rgba(255,255,255,0.12)' : 'none',
              }}>
              {completed[lesson.id] ? 'Mark incomplete' : 'Mark complete ✓'}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" ref={contentRef}>
          {!lesson ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div style={{ fontSize: 48, opacity: 0.25 }}>📚</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: 'rgba(255,255,255,0.35)' }}>Select a lesson to begin</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)' }}>45 lessons across 5 AP exams, ready to study</div>
            </div>
          ) : (
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '36px 40px 60px' }}>
              {/* Lesson header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <div className="inline-flex items-center rounded-full border" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', padding: '4px 12px', color: SUBJECTS[lesson.subj].accent, borderColor: SUBJECTS[lesson.subj].accent + '40', background: SUBJECTS[lesson.subj].accent + '14' }}>
                    {SUBJECTS[lesson.subj].label}
                  </div>
                  <div className="inline-flex items-center rounded-full" style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.4px' }}>
                    Unit {lesson.unit} · Lesson {lesson.unit}.{lesson.lesson}
                  </div>
                </div>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, lineHeight: 1.15, letterSpacing: '-0.5px', color: '#fffffe', marginBottom: 8 }}>{lesson.title}</h1>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{lesson.desc}</p>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-7 rounded-xl p-1" style={{ background: '#1a1927', width: 'fit-content' }}>
                {(['lesson', 'practice'] as Tab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => switchTab(tab)}
                    className="rounded-lg font-semibold transition-all capitalize"
                    style={{
                      padding: '7px 18px', fontSize: 13,
                      background: activeTab === tab ? '#242336' : 'transparent',
                      color: activeTab === tab ? '#fffffe' : 'rgba(255,255,255,0.4)',
                      border: activeTab === tab ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                    }}
                  >
                    {tab === 'lesson' ? '📖 Lesson' : '✏️ Practice'}
                  </button>
                ))}
              </div>

              {/* ── LESSON TAB ── */}
              {activeTab === 'lesson' && (
                <>
                  {lessonLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-5">
                      <div className="spin rounded-full" style={{ width: 44, height: 44, background: 'conic-gradient(#ff8906, #f25f4c, #c084fc, #ff8906)' }} />
                      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Generating lesson with OpenRouter AI…</div>
                    </div>
                  ) : (
                    <div className="fade-in prose-ap">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>{lessonText}</ReactMarkdown>
                    </div>
                  )}

                  {/* Followup Q&A */}
                  {followups.length > 0 && (
                    <div className="mt-8 space-y-4">
                      {followups.map((fup, i) => (
                        <div key={i} className="rounded-xl p-4 fade-in" style={{ borderLeft: `3px solid ${SUBJECTS[lesson.subj].accent}`, background: `${SUBJECTS[lesson.subj].accent}0d` }}>
                          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: SUBJECTS[lesson.subj].accent, marginBottom: 6 }}>Your question: {fup.q}</div>
                          {fup.a ? (
                            <div className="prose-ap" style={{ fontSize: 14 }}>
                              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>{fup.a}</ReactMarkdown>
                            </div>
                          ) : (
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Thinking…</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ask input */}
                  {!lessonLoading && lessonText && (
                    <div className="flex gap-2 mt-8">
                      <input
                        value={askInput}
                        onChange={e => setAskInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && askQuestion()}
                        placeholder="Ask a follow-up question about this lesson…"
                        className="flex-1 rounded-xl outline-none transition-all"
                        style={{ padding: '11px 16px', fontSize: 14, background: '#1a1927', border: '1px solid rgba(255,255,255,0.12)', color: '#fffffe', fontFamily: 'DM Sans, sans-serif' }}
                      />
                      <button
                        onClick={askQuestion}
                        disabled={askLoading || !askInput.trim()}
                        className="rounded-xl font-semibold transition-all disabled:opacity-40"
                        style={{ padding: '11px 20px', fontSize: 14, background: '#ff8906', color: '#0f0e17', border: 'none', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {askLoading ? '…' : 'Ask →'}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ── PRACTICE TAB ── */}
              {activeTab === 'practice' && (
                <>
                  {practiceLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-5">
                      <div className="spin rounded-full" style={{ width: 44, height: 44, background: 'conic-gradient(#c084fc, #f25f4c, #ff8906, #c084fc)' }} />
                      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Generating 5 AP-style practice problems…</div>
                    </div>
                  ) : practiceText ? (
                    <div className="fade-in">
                      <div className="rounded-xl p-4 mb-6 flex items-center gap-3" style={{ background: `${SUBJECTS[lesson.subj].accent}12`, border: `1px solid ${SUBJECTS[lesson.subj].accent}30` }}>
                        <span style={{ fontSize: 20 }}>✏️</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: SUBJECTS[lesson.subj].accent }}>5 AP-Style Practice Problems</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Try each question before revealing the answer. Cover the answer line with your hand!</div>
                        </div>
                        <button
                          onClick={() => { setPracticeText(''); setPracticeCache(prev => { const n = { ...prev }; delete n[lesson.id]; return n }); loadPractice() }}
                          className="ml-auto rounded-lg transition-all"
                          style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          🔄 New set
                        </button>
                      </div>
                      <div className="prose-ap">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>{practiceText}</ReactMarkdown>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Login by User ID dialog */}
      {showLoginDialog && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowLoginDialog(false)}
        >
          <div
            className="rounded-2xl shadow-2xl"
            style={{ background: '#1a1927', border: '1px solid rgba(255,255,255,0.12)', padding: '28px 28px 24px', width: 360, maxWidth: '90vw' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#fffffe', marginBottom: 6 }}>Log in with User ID</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.5 }}>
              Paste your ID from another device to sync your progress here.
            </div>
            <input
              id="login-userid-input"
              value={loginInput}
              onChange={e => setLoginInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && switchAccount()}
              placeholder="user_abc123…"
              autoFocus
              className="w-full rounded-xl outline-none"
              style={{ padding: '11px 14px', fontSize: 13, background: '#0f0e17', border: '1px solid rgba(255,255,255,0.15)', color: '#fffffe', fontFamily: 'DM Sans, sans-serif', marginBottom: 16 }}
            />
            <div className="flex gap-2">
              <button
                id="login-cancel-btn"
                onClick={() => setShowLoginDialog(false)}
                className="flex-1 rounded-xl transition-all"
                style={{ padding: '10px 0', fontSize: 13, background: 'transparent', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                id="login-sync-btn"
                onClick={switchAccount}
                disabled={!loginInput.trim()}
                className="flex-1 rounded-xl transition-all font-semibold disabled:opacity-40"
                style={{ padding: '10px 0', fontSize: 13, background: '#ff8906', color: '#0f0e17', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
              >
                Sync →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
