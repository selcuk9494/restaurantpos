import { IsOptional, IsString } from 'class-validator'

export class CloseTableSessionDto {
  @IsString()
  sessionId!: string

  @IsOptional()
  @IsString()
  note?: string
}
