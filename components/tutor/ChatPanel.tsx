'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageBubble } from './MessageBubble'
import { useMathgroundStore } from '@/lib/store'
import type { StreamChunk } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

export function ChatPanel() {
  const {
    chatHistory,
    isTutorOpen,
    isStreaming,
    tutorMode,
    addMessage,
    appendToLastMessage,
    appendToLastThinking,
    setIsStreaming,
    toggleTutor,
  } = useMathgroundStore()

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')

    addMessage({ id: uuidv4(), role: 'user', content: text, timestamp: Date.now() })
    addMessage({ id: uuidv4(), role: 'assistant', content: '', timestamp: Date.now() })
    setIsStreaming(true)

    const model = tutorMode === 'reasoner' ? 'deepseek-reasoner' : 'deepseek-chat'

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: useMathgroundStore.getState().chatHistory,
          model,
          sessionId: useMathgroundStore.getState().sessionId,
        }),
      })

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data: StreamChunk = JSON.parse(line.slice(6))
          if (data.type === 'content') appendToLastMessage(data.delta)
          if (data.type === 'thinking') appendToLastThinking(data.delta)
          if (data.type === 'done') break
        }
      }
    } catch (err) {
      appendToLastMessage(`\n\n*Error: ${err instanceof Error ? err.message : String(err)}*`)
    } finally {
      setIsStreaming(false)
    }
  }, [input, isStreaming, tutorMode, addMessage, appendToLastMessage, appendToLastThinking, setIsStreaming])

  if (!isTutorOpen) {
    return (
      <button
        onClick={toggleTutor}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-lg transition hover:bg-blue-500"
        aria-label="Open AI tutor"
      >
        <span className="text-xl">🤖</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 flex h-[560px] w-[400px] flex-col overflow-hidden rounded-tl-2xl border border-gray-700 bg-gray-950 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <span className="font-semibold text-white">AI Tutor</span>
        <div className="flex items-center gap-2">
          <select
            value={tutorMode}
            onChange={(e) => useMathgroundStore.getState().setTutorMode(e.target.value as 'chat' | 'reasoner')}
            className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300"
          >
            <option value="chat">Fast</option>
            <option value="reasoner">Deep Reasoning</option>
          </select>
          <button onClick={toggleTutor} className="text-gray-400 hover:text-white" aria-label="Close tutor">
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {chatHistory.length === 0 && (
          <p className="text-center text-sm text-gray-500">
            Ask me anything about this topic!
          </p>
        )}
        {chatHistory.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isStreaming && (
          <div className="flex gap-1 pl-2">
            <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 border-t border-gray-800 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask a question..."
          className="flex-1 rounded-xl bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-500 outline-none"
          disabled={isStreaming}
        />
        <button
          onClick={send}
          disabled={isStreaming || !input.trim()}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  )
}
