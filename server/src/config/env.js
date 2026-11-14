import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded from server directory or project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z
    .string({ required_error: 'DATABASE_URL is required' })
    .min(1, 'DATABASE_URL cannot be empty'),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET is required' })
    .min(32, 'JWT_SECRET must be at least 32 characters long'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  COOKIE_SAMESITE: z.enum(['lax', 'none', 'strict']).optional(),
  CLOUDINARY_CLOUD_NAME: z
    .string({ required_error: 'CLOUDINARY_CLOUD_NAME is required' })
    .min(1, 'CLOUDINARY_CLOUD_NAME cannot be empty'),
  CLOUDINARY_API_KEY: z
    .string({ required_error: 'CLOUDINARY_API_KEY is required' })
    .min(1, 'CLOUDINARY_API_KEY cannot be empty'),
  CLOUDINARY_API_SECRET: z
    .string({ required_error: 'CLOUDINARY_API_SECRET is required' })
    .min(1, 'CLOUDINARY_API_SECRET cannot be empty'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Configuration validation failed. The following environment variables have issues:');
  for (const issue of parsed.error.issues) {
    const varName = issue.path.join('.') || 'Unknown Variable';
    // Print only the variable name and rule message. NEVER print the value.
    console.error(`  • ${varName}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export default env;
