import { NextRequest, NextResponse } from 'next/server'
import { PLAYLIST, SUBJECTS } from '@/lib/playlist'

const FREE_MODELS = [
  'openrouter/free',
  'google/gemini-2.0-flash-lite-preview-02-05:free',
  'deepseek/deepseek-r1:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemini-2.0-pro-exp-02-05:free',
  'mistralai/mistral-7b-instruct:free'
]

export async function POST(req: NextRequest) {
  const { lessonId, question, mode } = await req.json()
  const lesson = PLAYLIST.find(l => l.id === lessonId)
  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENROUTER_API_KEY not set' }, { status: 500 })

  const subjectName = SUBJECTS[lesson.subj].label

  let prompt: string
  if (mode === 'practice') {
    prompt = `You are an expert AP exam question writer. Create exactly 5 AP-style practice problems (mix of multiple choice and free response) for "${lesson.title}" (${subjectName}).

Rules:
1. Return ONLY a valid JSON array. No markdown blocks, no preface, no trailing text.
2. Use LaTeX for math symbols (e.g. $E=mc^2$). MUST KEEP valid JSON escaping (e.g. \\\\n if needed).

JSON format:
[
  {
    "type": "mcq",
    "question": "What is...",
    "options": ["...", "...", "...", "..."],
    "correctIndex": 0,
    "explanation": "Brief explanation..."
  },
  {
    "type": "frq",
    "question": "Explain...",
    "explanation": "Brief explanation..."
  }
]`

  } else if (question) {
    prompt = `You are an expert AP exam tutor. The student is studying "${lesson.title}" for ${subjectName}.
They ask: "${question}"
Answer clearly, concisely, and directly (2-4 sentences). Use LaTeX for math. Focus on AP exam relevance.`
  } else {
    prompt = `You are an expert AP exam tutor. Create a concise, high-yield study lesson on: "${lesson.title}" for ${subjectName}.

Use this exact markdown structure:

## Core Concept
1 brief paragraph explaining the big idea.

## Key Principles
- 4-5 concise bullet points of the most important facts/rules

## In Depth
1-2 paragraphs with examples. Use LaTeX for math symbols (e.g. $E=mc^2$).

## AP Exam Focus
Specific AP exam tests and common traps. 1-2 paragraphs.

Keep total response under 500 words to minimize tokens. Be extremely concise and accurate.`
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
          max_tokens: 1800,
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
