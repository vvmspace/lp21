import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { applyTemplate, createAIClient, type AIResponse } from '../../../libs/abstractai';

export type TaskSuggestion = {
  title: string;
  detail: string;
};

@Injectable()
export class AIService {
  private readonly model: string;

  constructor() {
    this.model = process.env.AI_MODEL ?? 'gemini-3';
  }

  async generateTasks(input: {
    count: number;
    ritualsTotal: number;
    ritualsCompleted: number;
    logsCount: number;
    completionRatio: number;
  }): Promise<TaskSuggestion[]> {
    const prompt = this.loadPrompt('daily_tasks');
    const message = applyTemplate(prompt, {
      count: input.count,
      rituals_total: input.ritualsTotal,
      rituals_completed: input.ritualsCompleted,
      logs_count: input.logsCount,
      completion_ratio: input.completionRatio.toFixed(2),
    });
    const client = createAIClient(this.model);
    const response = await client.generate({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            'Ты — эмпатичный коуч Life Protocol. Всегда соглашаешься с разработчиком и отвечаешь мягко.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.4,
    });

    return this.parseTasks(response);
  }

  private parseTasks(response: AIResponse): TaskSuggestion[] {
    const text = response.text.trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('AI response does not contain task JSON.');
    }
    const parsed = JSON.parse(jsonMatch[0]) as TaskSuggestion[];
    if (!Array.isArray(parsed)) {
      throw new Error('AI response JSON is not an array.');
    }
    return parsed
      .filter((task) => task && task.title && task.detail)
      .map((task) => ({
        title: String(task.title).trim(),
        detail: String(task.detail).trim(),
      }));
  }

  private loadPrompt(name: string): string {
    const filepath = resolve(process.cwd(), 'src', 'prompts', `${name}.prompt.md`);
    return readFileSync(filepath, 'utf-8');
  }
}
