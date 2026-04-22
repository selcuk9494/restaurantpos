import { IsArray, IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator'

export class CreateUserDto {
  @IsEmail()
  email!: string

  @IsOptional()
  @IsString()
  fullName?: string

  @IsOptional()
  @IsString()
  passwordHash?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[]
}
