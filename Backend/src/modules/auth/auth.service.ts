import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto, ipAddress: string, userAgent?: string) {
    const rawIdentifier = (loginDto.identifier || loginDto.email || loginDto.staffNumber || '').trim();
    if (!rawIdentifier) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const searchEmails = [rawIdentifier];
    if (rawIdentifier.toLowerCase() === 'accounts@eduhms.gh') searchEmails.push('accountant@eduhms.gh');
    if (rawIdentifier.toLowerCase() === 'accountant@eduhms.gh') searchEmails.push('accounts@eduhms.gh');

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { in: searchEmails, mode: 'insensitive' } },
          { staffNumber: { equals: rawIdentifier, mode: 'insensitive' } },
          { id: { equals: rawIdentifier, mode: 'insensitive' } },
        ],
      },
      include: {
        modulePermissions: true,
        primaryBranch: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    let isPasswordValid = false;
    try {
      isPasswordValid = await argon2.verify(user.passwordHash, loginDto.password);
    } catch {
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login timestamp
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh session in DB
    const refreshTokenHash = await argon2.hash(tokens.refreshToken, {
      type: argon2.argon2id,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        ipAddress,
        userAgent: userAgent || 'Unknown',
        expiresAt,
      },
    });

    const { passwordHash, ...sanitizedUser } = user;

    return {
      message: 'Authentication successful',
      user: sanitizedUser,
      tokens,
    };
  }

  async refreshTokens(refreshToken: string, ipAddress: string, userAgent?: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'super_secret_refresh_jwt_key_2026'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Access denied');
      }

      // Check active unrevoked sessions
      const sessions = await this.prisma.userSession.findMany({
        where: {
          userId: user.id,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
      });

      let validSession = null;
      for (const session of sessions) {
        const isMatch = await argon2.verify(session.refreshTokenHash, refreshToken);
        if (isMatch) {
          validSession = session;
          break;
        }
      }

      if (!validSession) {
        throw new UnauthorizedException('Invalid or revoked session token');
      }

      // Revoke old session (Rotation)
      await this.prisma.userSession.update({
        where: { id: validSession.id },
        data: { isRevoked: true },
      });

      // Generate new pair
      const tokens = await this.generateTokens(user);

      // Store new session
      const newHash = await argon2.hash(tokens.refreshToken, {
        type: argon2.argon2id,
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await this.prisma.userSession.create({
        data: {
          userId: user.id,
          refreshTokenHash: newHash,
          ipAddress,
          userAgent: userAgent || 'Unknown',
          expiresAt,
        },
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (e) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }
  }

  async logout(userId: string, sessionId?: string) {
    if (sessionId) {
      await this.prisma.userSession.updateMany({
        where: { id: sessionId, userId },
        data: { isRevoked: true },
      });
    } else {
      await this.prisma.userSession.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    }

    return { message: 'Logged out successfully' };
  }

  private async generateTokens(user: { id: string; email: string; role: string; primaryBranchId?: string | null }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      primaryBranchId: user.primaryBranchId || undefined,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET', 'super_secret_jwt_key_for_eduhms_enterprise_2026'),
        expiresIn: (this.configService.get<string>('JWT_EXPIRATION', '15m') as any),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'super_secret_refresh_jwt_key_2026'),
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d') as any),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 mins in seconds
    };
  }
}
