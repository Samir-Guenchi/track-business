import {
  GetMeUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
  VerifyEmailUseCase,
} from './email-and-password.use-cases.js';

export const EmailAndPasswordUseCases = [
  VerifyEmailUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
  GetMeUseCase,
];
