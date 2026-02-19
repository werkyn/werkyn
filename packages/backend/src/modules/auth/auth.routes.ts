import type { FastifyInstance } from "fastify";
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  verifyEmailHandler,
  resendVerificationHandler,
} from "./auth.controller.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/authenticate.js";
import {
  LoginSchema,
  RegisterSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "@pm/shared";

export default async function authRoutes(fastify: FastifyInstance) {
  // POST /api/auth/register
  fastify.route({
    method: "POST",
    url: "/register",
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    preHandler: [validate(RegisterSchema)],
    handler: registerHandler,
  });

  // POST /api/auth/login
  fastify.route({
    method: "POST",
    url: "/login",
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    preHandler: [validate(LoginSchema)],
    handler: loginHandler,
  });

  // POST /api/auth/refresh
  fastify.route({
    method: "POST",
    url: "/refresh",
    handler: refreshHandler,
  });

  // POST /api/auth/logout
  fastify.route({
    method: "POST",
    url: "/logout",
    preHandler: [authenticate],
    handler: logoutHandler,
  });

  // POST /api/auth/forgot-password
  fastify.route({
    method: "POST",
    url: "/forgot-password",
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    preHandler: [validate(ForgotPasswordSchema)],
    handler: forgotPasswordHandler,
  });

  // POST /api/auth/reset-password/:token
  fastify.route({
    method: "POST",
    url: "/reset-password/:token",
    preHandler: [validate(ResetPasswordSchema)],
    handler: resetPasswordHandler,
  });

  // POST /api/auth/verify-email/:token
  fastify.route({
    method: "POST",
    url: "/verify-email/:token",
    handler: verifyEmailHandler,
  });

  // POST /api/auth/resend-verification
  fastify.route({
    method: "POST",
    url: "/resend-verification",
    config: { rateLimit: { max: 3, timeWindow: "1 minute" } },
    preHandler: [authenticate],
    handler: resendVerificationHandler,
  });
}
