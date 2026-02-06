import { Gemini25AI, Gemini3AI } from './gemini.js';
import type { IAbstractAI } from './types.js';

export const createAIClient = (model: string): IAbstractAI => {
  if (model.startsWith('gemini-3')) {
    return new Gemini3AI();
  }
  if (model.startsWith('gemini-2.5')) {
    return new Gemini25AI();
  }
  throw new Error(`Unsupported model: ${model}`);
};
