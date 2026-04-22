import { Body, Controller, Get, Post } from '@nestjs/common'
import { CreatePermissionDto } from './dto/create-permission.dto'
import { CreateRoleDto } from './dto/create-role.dto'
import { CreateUserDto } from './dto/create-user.dto'
import { IamService } from './iam.service'

@Controller('iam')
export class IamController {
  constructor(private readonly iamService: IamService) {}

  @Get('meta')
  getMeta() {
    return this.iamService.getMeta()
  }

  @Get('users')
  listUsers() {
    return this.iamService.listUsers()
  }

  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.iamService.createUser(dto)
  }

  @Get('roles')
  listRoles() {
    return this.iamService.listRoles()
  }

  @Post('roles')
  createRole(@Body() dto: CreateRoleDto) {
    return this.iamService.createRole(dto)
  }

  @Get('permissions')
  listPermissions() {
    return this.iamService.listPermissions()
  }

  @Post('permissions')
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.iamService.createPermission(dto)
  }
}
