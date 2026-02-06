import { createAIClient } from '../abstractai/factory.js';
import type { AIRequest, AIResponse } from '../abstractai/types.js';

export class AIClient {
  async generate(request: AIRequest): Promise<AIResponse> {
    const client = createAIClient(request.model);
    return client.generate(request);
  }
}
