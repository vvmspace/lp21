import fetch from 'node-fetch';
import { AbstractAI } from './abstract-ai.js';
import type { AIRequest, AIResponse } from './types.js';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

type GeminiPart = { text: string };

type GeminiMessage = {
  role: 'user' | 'model';
  parts: GeminiPart[];
};

const toGeminiMessages = (request: AIRequest): GeminiMessage[] => {
  return request.messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));
};

export class Gemini25AI extends AbstractAI {
  async generate(request: AIRequest): Promise<AIResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const response = await fetch(`${API_BASE}/models/${request.model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: toGeminiMessages(request),
        generationConfig: {
          temperature: request.temperature ?? 0.6,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini 2.5 request failed: ${errorText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return { text, raw: data };
  }
}

export class Gemini3AI extends AbstractAI {
  async generate(request: AIRequest): Promise<AIResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const response = await fetch(`${API_BASE}/models/${request.model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: toGeminiMessages(request),
        generationConfig: {
          temperature: request.temperature ?? 0.5,
        },
        safetySettings: [],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini 3 request failed: ${errorText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return { text, raw: data };
  }
}
