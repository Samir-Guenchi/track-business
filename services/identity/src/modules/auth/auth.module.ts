import { Module } from '@nestjs/common';
import { AccountCreator } from './application/account-creator.js';
import { CredentialChecker } from './application/credential-checker.js';
import { EmailAndPasswordUseCases } from './application/email-and-password.use-cases.providers.js';
import { LoginUseCase } from './application/login.use-case.js';
import { AUTH_PORTS } from './application/ports/auth.ports.js';
import { RegisterUseCase } from './application/register.use-case.js';
import { SessionFactory } from './application/session-factory.js';
import { VerificationEmailSender } from './application/verification-email.sender.js';
import { LogoutUseCase, RefreshSessionUseCase } from './application/session.use-cases.js';
import { AccessTokenKeys } from './infrastructure/access-token.keys.js';
import { AccessTokenVerifier } from './infrastructure/access-token.verifier.js';
import { Argon2PasswordHasher } from './infrastructure/argon2-password.hasher.js';
import { JoseAccessTokenIssuer } from './infrastructure/jose-access-token.issuer.js';
import { SmtpAuthMailer } from './infrastructure/mail/smtp-auth.mailer.js';
import { PrismaOneTimeTokenStore } from './infrastructure/prisma-one-time-token.store.js';
import { PrismaRefreshTokenStore } from './infrastructure/prisma-refresh-token.store.js';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository.js';
import { AccessTokenGuard } from './interface/access-token.guard.js';
import { AccountController } from './interface/account.controller.js';
import { AuthController } from './interface/auth.controller.js';
import { MeController } from './interface/me.controller.js';
import { SessionController } from './interface/session.controller.js';

@Module({
  controllers: [AuthController, SessionController, AccountController, MeController],
  providers: [
    SessionFactory,
    AccountCreator,
    CredentialChecker,
    VerificationEmailSender,
    RegisterUseCase,
    LoginUseCase,
    RefreshSessionUseCase,
    LogoutUseCase,
    ...EmailAndPasswordUseCases,
    AccessTokenKeys,
    AccessTokenVerifier,
    AccessTokenGuard,
    { provide: AUTH_PORTS.users, useClass: PrismaUserRepository },
    { provide: AUTH_PORTS.hasher, useClass: Argon2PasswordHasher },
    { provide: AUTH_PORTS.accessTokens, useClass: JoseAccessTokenIssuer },
    { provide: AUTH_PORTS.refreshTokens, useClass: PrismaRefreshTokenStore },
    { provide: AUTH_PORTS.oneTimeTokens, useClass: PrismaOneTimeTokenStore },
    { provide: AUTH_PORTS.mailer, useClass: SmtpAuthMailer },
    { provide: AUTH_PORTS.clock, useValue: () => new Date() },
  ],
  exports: [AccessTokenGuard, AccessTokenVerifier],
})
export class AuthModule {}
