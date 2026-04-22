import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma/prisma.service'
import { CreatePermissionDto } from './dto/create-permission.dto'
import { CreateRoleDto } from './dto/create-role.dto'
import { CreateUserDto } from './dto/create-user.dto'

@Injectable()
export class IamService {
  constructor(private readonly prisma: PrismaService) {}

  getMeta() {
    return {
      module: 'iam',
      endpoints: [
        'GET /v1/iam/meta',
        'GET /v1/iam/users',
        'POST /v1/iam/users',
        'GET /v1/iam/roles',
        'POST /v1/iam/roles',
        'GET /v1/iam/permissions',
        'POST /v1/iam/permissions',
      ],
    }
  }

  async listUsers() {
    try {
      const users = await this.prisma.user.findMany({
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return users.map((user) => this.toSafeUser(user))
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async createUser(dto: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: {
          email: dto.email,
          fullName: dto.fullName,
          passwordHash: dto.passwordHash,
          isActive: dto.isActive,
          roles: dto.roleIds?.length
            ? {
                create: dto.roleIds.map((roleId) => ({
                  role: {
                    connect: { id: roleId },
                  },
                })),
              }
            : undefined,
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async listRoles() {
    try {
      return await this.prisma.role.findMany({
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                  isActive: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async createRole(dto: CreateRoleDto) {
    try {
      return await this.prisma.role.create({
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          isSystem: dto.isSystem,
          permissions: dto.permissionIds?.length
            ? {
                create: dto.permissionIds.map((permissionId) => ({
                  permission: {
                    connect: { id: permissionId },
                  },
                })),
              }
            : undefined,
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async listPermissions() {
    try {
      return await this.prisma.permission.findMany({
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async createPermission(dto: CreatePermissionDto) {
    try {
      return await this.prisma.permission.create({
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description,
        },
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  private toSafeUser<T extends { passwordHash?: string | null }>(user: T) {
    const { passwordHash: _passwordHash, ...safeUser } = user
    return safeUser
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      throw new ServiceUnavailableException('Database connection is not ready')
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Record already exists')
      }

      if (error.code === 'P2021') {
        throw new ServiceUnavailableException('Database schema is not migrated yet')
      }

      throw new BadRequestException(error.message)
    }

    if (
      error instanceof Prisma.PrismaClientValidationError ||
      error instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      throw new BadRequestException(error.message)
    }

    if (error instanceof Error && /fetch failed|can't reach database server|cannot fetch data from service/i.test(error.message)) {
      throw new ServiceUnavailableException('Database service is not reachable yet')
    }

    throw error
  }
}
