'use client'

import { useState } from 'react'
import { renderLatex } from './renderLatex'
import type { ChatMessage } from '@/lib/types'

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [showThinking, setShowThinking] = useState(false)
  const isUser = message.role === 'user'

  const renderedContent = renderLatex(message.content)

  return (
    <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
      {!isUser && message.thinking && (
        <div className="w-full">
          <button
            onClick={() => setShowThinking((v) => !v)}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            {showThinking ? 'Hide reasoning' : 'Show reasoning'}
          </button>
          {showThinking && (
            <div className="mt-1 rounded-md border border-gray-700 bg-gray-900 p-3 text-xs text-gray-400 italic">
              {message.thinking}
            </div>
          )}
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-gray-100'
        }`}
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />
    </div>
  )
}
