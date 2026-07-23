"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ redirectTo = "/login" }: { redirectTo?: string }) {
  const router = useRouter();

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <button onClick={sair} className="text-slate-400 hover:text-slate-900">
      Sair
    </button>
  );
}
