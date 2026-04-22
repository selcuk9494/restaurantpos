import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator'

export class CreateRoleDto {
  @IsString()
  code!: string

  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[]
}
