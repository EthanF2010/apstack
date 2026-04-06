import { NextRequest, NextResponse } from 'next/server'
import { PLAYLIST, SUBJECTS } from '@/lib/playlist'

// openrouter/free = OpenRouter's official free-model auto-router
// It picks whichever free model is currently available so we never get 404s
const FREE_MODELS = [
  'openrouter/free',
  'google/gemini-2.0-flash-lite-preview-02-05:free',
  'meta-llama/llama-3.1-8b-instruct:free',
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
    prompt = `You are an expert AP exam question writer. Create exactly 5 AP-style practice problems (a mix of multiple choice and free response) for the topic: "${lesson.title}" (${subjectName}).

Rules:
1. Use LaTeX for math symbols (e.g. $E=mc^2$ or $$E=mc^2$$).
2. For multiple choice, provide choices A-D. For free response, just pose the question.
3. Keep the text extremely concise to minimize token usage.
4. Hide the answer and steps/explanation in a <details> block immediately after each question so students can try it first.

Format exactly like this for each question:
**Q1:** [Question prompt]
A) ... (if MC)
...
<details>
<summary>View Answer & Steps</summary>

**Answer:** [Correct Answer]
**Explanation:** [Brief 1-2 sentence breakdown of how to solve it and why it's correct/incorrect]
</details>

---`

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
          max_tokens: 800,
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
