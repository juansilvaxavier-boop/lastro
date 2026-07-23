// Estes dois valores sao publicos por design (Supabase publishable/anon key +
// URL do projeto - protegidos por RLS, nao por sigilo) e acabam expostos no
// bundle do cliente de qualquer forma. Manter um fallback aqui garante que o
// app funcione mesmo em ambientes onde as env vars ainda nao foram
// configuradas (ex: primeiro deploy na Vercel).
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zloikqwodnmnfkdmplkw.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_zpoNfKCFUaC6K6Zf0nRsEA_O9rFJLJv";
