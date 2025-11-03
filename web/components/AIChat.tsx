'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      
      const response = await fetch(`${apiUrl}/api/ai/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          model: 'gpt-3.5-turbo',
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAuth = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b p-4">
          <h2 className="text-xl font-semibold">AI Assistant</h2>
          <p className="text-sm text-gray-600 mt-1">
            Test the AI integration with mock responses
          </p>
        </div>

        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                <p className="text-sm">Thinking...</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-t">
            <p className="text-sm text-red-600">Error: {error}</p>
          </div>
        )}

        <div className="border-t p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>

        <div className="border-t p-4">
          <button
            onClick={handleAuth}
            className="text-sm text-blue-600 hover:underline"
          >
            Test Supabase Authentication
          </button>
        </div>
      </div>
    </div>
  )
}