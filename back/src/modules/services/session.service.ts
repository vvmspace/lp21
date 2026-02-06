import { Injectable } from '@nestjs/common';
import { AuthRequestDto } from '../dtos/auth-request.dto';
import { AuthResponseDto } from '../dtos/auth-response.dto';

const users = new Map<string, { password: string; createdAt: string }>();

@Injectable()
export class SessionService {
  authenticate(payload: AuthRequestDto): AuthResponseDto {
    const existing = users.get(payload.login);

    if (existing) {
      const success = existing.password === payload.password;
      return {
        success,
        message: success ? 'Добро пожаловать обратно.' : 'Неверный пароль.',
        user: {
          login: payload.login,
          createdAt: existing.createdAt,
        },
      };
    }

    const createdAt = new Date().toISOString();
    users.set(payload.login, { password: payload.password, createdAt });

    return {
      success: true,
      message: 'Новый пользователь создан.',
      user: {
        login: payload.login,
        createdAt,
      },
    };
  }
}
