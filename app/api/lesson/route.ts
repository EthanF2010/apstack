import { NextRequest, NextResponse } from 'next/server'
import { PLAYLIST, SUBJECTS } from '@/lib/playlist'

// openrouter/free = OpenRouter's official free-model auto-router
// It picks whichever free model is currently available so we never get 404s
const FREE_MODELS = ['openrouter/free']

export async function POST(req: NextRequest) {
  const { lessonId, question, mode } = await req.json()
  const lesson = PLAYLIST.find(l => l.id === lessonId)
  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENROUTER_API_KEY not set' }, { status: 500 })

  const subjectName = SUBJECTS[lesson.subj].label

  let prompt: string
  if (mode === 'practice') {
    prompt = `You are an expert AP exam question writer. Create exactly 5 AP-style multiple choice practice problems for the topic: "${lesson.title}" (${subjectName}).

Each question must follow this exact format:

**Q1:** [Question stem — challenging, AP-exam-quality]
A) [Option]
B) [Option]
C) [Option]
D) [Option]
**Answer: B** — [1-2 sentence explanation of why this is correct and why the wrong choices fail]

---

**Q2:** ...

Rules:
- All 5 questions must be distinctly different aspects of the topic
- Difficulty should match the real AP exam (some straightforward recall, some application, some analysis)
- Wrong answer choices must be plausible (common misconceptions)
- Answers and explanations must be accurate
- No preamble or conclusion — just the 5 questions in that exact format`
  } else if (question) {
    prompt = `You are an expert AP exam tutor. The student is studying "${lesson.title}" for ${subjectName}.
They ask: "${question}"
Answer clearly and concisely (3-5 sentences). Focus on what matters for the AP exam. Use markdown formatting.`
  } else {
    prompt = `You are an expert AP exam tutor. Create a detailed, engaging study lesson on: "${lesson.title}" for ${subjectName}.

Use this exact markdown structure:

## Core Concept
One paragraph explaining the big idea clearly.

## Key Principles
- 4-5 bullet points of the most important facts/rules to memorize

## In Depth
A thorough explanation with examples and analogies. 3-4 paragraphs.

## AP Exam Focus
What the AP exam specifically tests on this topic. Common mistakes and traps. 2-3 paragraphs.

Keep total response to 700-900 words. Be specific and accurate.`
  }

  let lastError = 'All models failed to respond.'

  for (const model of FREE_MODELS) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://apstack.vercel.app',
          'X-Title': 'APStack',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1200,
        }),
      })

      if (!res.ok) {
        const errBody = await res.text()
        lastError = `OpenRouter ${res.status} (${model}): ${errBody}`
        console.error('OpenRouter error:', lastError)
        continue // try next model
      }

      const data = await res.json()
      const text = data.choices?.[0]?.message?.content
      if (!text) {
        lastError = `Empty response from ${model}`
        console.error(lastError, data)
        continue
      }

      return NextResponse.json({ text, model })
    } catch (e: unknown) {
      lastError = e instanceof Error ? e.message : `Unknown error with ${model}`
      console.error('Fetch error:', lastError)
    }
  }

  return NextResponse.json({ error: lastError }, { status: 500 })
}
