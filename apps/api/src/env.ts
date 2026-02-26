import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL URL"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  WEB_URL: z.string().url("WEB_URL must be a valid URL").default("http://localhost:5173"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  STRIPE_SECRET_KEY: z.union([z.string().startsWith("sk_"), z.literal("")]).default(""),
  STRIPE_WEBHOOK_SECRET: z.union([z.string().startsWith("whsec_"), z.literal("")]).default(""),
  STRIPE_PRODUCT_ID_FLUENT: z.union([z.string().startsWith("prod_"), z.literal("")]).default(""),
  OPENAI_API_KEY: z.union([z.string().startsWith("sk-"), z.literal("")]).default(""),
  RESEND_API_KEY: z.union([z.string().startsWith("re_"), z.literal("")]).default(""),
  TURNSTILE_SECRET_KEY: z.string().optional().default(""),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  API_URL: z.string().url().optional().default("http://localhost:3000"),
  VAPID_PUBLIC_KEY: z.string().optional().default(""),
  VAPID_PRIVATE_KEY: z.string().optional().default(""),
  VAPID_SUBJECT: z.string().optional().default(""),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:");
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const env = validateEnv();
export type Env = z.infer<typeof envSchema>;
