import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { buildSystemPrompt, buildMessages } from '@/lib/ai/prompt'
import { queryChunks } from '@/lib/rag/retrieval'
import type { ChatMessage, RetrievedChunk, StreamChunk } from '@/lib/types'

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
  baseURL: 'https://api.deepseek.com',
})

export async function POST(req: NextRequest) {
  let body: { messages: ChatMessage[]; model?: string; sessionId?: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { messages, model = 'deepseek-chat' } = body

  if (!messages?.length) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 })
  }

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
  const query = lastUserMessage?.content ?? ''

  // Retrieve relevant context chunks
  let contextChunks: RetrievedChunk[] = []
  try {
    contextChunks = await queryChunks(query, 4)
  } catch {
    // RAG not yet indexed — continue without context
  }

  const systemPrompt = buildSystemPrompt(contextChunks)
  const openaiMessages = buildMessages(messages)
  const isReasoner = model === 'deepseek-reasoner'

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(chunk: StreamChunk) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
      }

      try {
        const completion = await client.chat.completions.create({
          model,
          messages: [{ role: 'system', content: systemPrompt }, ...openaiMessages],
          stream: true,
          ...(isReasoner ? { max_tokens: 8000 } : {}),
        })

        for await (const part of completion) {
          const delta = part.choices[0]?.delta
          if (!delta) continue

          // deepseek-reasoner emits reasoning_content separately
          const thinkingDelta = (delta as unknown as { reasoning_content?: string }).reasoning_content
          if (thinkingDelta) {
            send({ type: 'thinking', delta: thinkingDelta })
          }

          if (delta.content) {
            send({ type: 'content', delta: delta.content })
          }
        }

        send({ type: 'done', delta: '' })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        send({ type: 'done', delta: '', error: msg })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
