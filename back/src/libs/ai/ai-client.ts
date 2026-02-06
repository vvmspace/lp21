import { createAIClient } from '../../../abstractai/src/factory.js';
import type { AIRequest, AIResponse } from '../../../abstractai/src/types.js';

export class AIClient {
  async generate(request: AIRequest): Promise<AIResponse> {
    const client = createAIClient(request.model);
    return client.generate(request);
  }
}
