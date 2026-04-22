import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Prisma } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../../database/prisma/prisma.service'
import { LoginDto } from './dto/login.dto'

type AuthUser = Prisma.UserGetPayload<{
  include: {
    roles: {
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    }
  }
}>

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user?.passwordHash || !user.isActive) {
      throw new UnauthorizedException('Email veya sifre hatali')
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash)

    if (!passwordMatches) {
      throw new UnauthorizedException('Email veya sifre hatali')
    }

    const profile = this.toProfile(user)
    const accessToken = await this.jwtService.signAsync({
      sub: profile.id,
      email: profile.email,
      roleCodes: profile.roles.map((role) => role.code),
    })

    return {
      accessToken,
      user: profile,
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    return this.toProfile(user)
  }

  private toProfile(user: AuthUser) {
    const roleEntries = user.roles.map(({ role }) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
    }))

    const permissions = Array.from(
      new Map(
        user.roles.flatMap(({ role }) =>
          role.permissions.map(({ permission }) => [
            permission.code,
            {
              id: permission.id,
              code: permission.code,
              name: permission.name,
              description: permission.description,
            },
          ]),
        ),
      ).values(),
    )

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: roleEntries,
      permissions,
    }
  }
}
