import { Injectable } from '@nestjs/common';
import { readdirSync, readFileSync } from 'fs';
import { resolve, extname, basename } from 'path';

const iconMap: Record<string, string> = {
  ru: '🇷🇺',
  en: '🇺🇸',
  es: '🇪🇸',
};

@Injectable()
export class LanguageService {
  private readonly languages: { language: string; icon: string }[];

  constructor() {
    const localesDir = resolve(process.cwd(), 'src', 'locales');
    const files = readdirSync(localesDir).filter((file) => extname(file) === '.json');
    this.languages = files.map((file) => {
      const code = basename(file, '.json');
      const content = JSON.parse(readFileSync(resolve(localesDir, file), 'utf-8')) as {
        language?: { code?: string };
      };
      const language = content.language?.code ?? code;
      return {
        language,
        icon: iconMap[language] ?? '🌐',
      };
    });
  }

  getLanguages() {
    return this.languages;
  }
}
