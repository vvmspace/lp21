export type AIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type AIResponse = {
  text: string;
  raw: unknown;
};

export type AIRequest = {
  model: string;
  messages: AIMessage[];
  temperature?: number;
  metadata?: Record<string, unknown>;
};

export interface IAbstractAI {
  generate(request: AIRequest): Promise<AIResponse>;
}
