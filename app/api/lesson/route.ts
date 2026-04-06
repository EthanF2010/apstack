import { NextRequest, NextResponse } from 'next/server'
import { PLAYLIST, SUBJECTS } from '@/lib/playlist'

// Free models on OpenRouter (no billing required):
// meta-llama/llama-3.1-8b-instruct:free
// google/gemma-2-9b-it:free
// mistralai/mistral-7b-instruct:free
const FREE_MODEL = 'meta-llama/llama-3.1-8b-instruct:free'

export async function POST(req: NextRequest) {
  const { lessonId, question } = await req.json()
  const lesson = PLAYLIST.find(l => l.id === lessonId)
  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENROUTER_API_KEY not set' }, { status: 500 })

  const subjectName = SUBJECTS[lesson.subj].label

  let prompt: string
  if (question) {
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

## Practice Questions

**Q1:** [Multiple choice question at AP difficulty]
A) [option]
B) [option]
C) [option]
D) [option]
**Answer:** [Letter] — [Brief explanation of why this is correct and why others are wrong]

**Q2:** [Another multiple choice question]
A) [option]
B) [option]
C) [option]
D) [option]
**Answer:** [Letter] — [Brief explanation]

Keep total response to 700-900 words. Be specific and accurate.`
  }

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
        model: FREE_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('OpenRouter error:', err)
      return NextResponse.json({ error: `OpenRouter error: ${res.status}` }, { status: 500 })
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || 'No response from model.'
    return NextResponse.json({ text })
  } catch (e: unknown) {
    console.error(e)
    const msg = e instanceof Error ? e.message : 'Generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
