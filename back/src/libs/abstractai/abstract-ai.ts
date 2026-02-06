import type { AIRequest, AIResponse, IAbstractAI } from './types.js';

export abstract class AbstractAI implements IAbstractAI {
  abstract generate(request: AIRequest): Promise<AIResponse>;

  protected buildTextPrompt(request: AIRequest): string {
    return request.messages.map((message) => `${message.role}: ${message.content}`).join('\n');
  }
}
