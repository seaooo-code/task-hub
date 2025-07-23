import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
});
