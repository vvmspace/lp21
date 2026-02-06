import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../entities/user.entity';

export class AuthResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Новый пользователь создан.' })
  message: string;

  @ApiProperty({ type: UserEntity })
  user: UserEntity;
}
