import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization as string | undefined

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token is required')
    }

    const token = authHeader.slice(7).trim()

    if (!token) {
      throw new UnauthorizedException('Bearer token is required')
    }

    try {
      request.user = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
      })

      return true
    } catch {
      throw new UnauthorizedException('Invalid or expired token')
    }
  }
}
