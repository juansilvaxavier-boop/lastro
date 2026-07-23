import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("onboarding_completo")
    .eq("user_id", user.id)
    .maybeSingle();

  redirect(perfil?.onboarding_completo ? "/dashboard" : "/onboarding");
}
