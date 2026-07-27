import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UsuarioProvider } from "@/components/UsuarioContext";
import { ApresentacaoClient } from "@/components/apresentacao/ApresentacaoClient";

export default async function ApresentacaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, nome, email, papel")
    .eq("id", user.id)
    .maybeSingle();

  if (!usuario || !usuario.papel) redirect("/login");

  return (
    <UsuarioProvider
      usuario={{
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email ?? user.email ?? null,
        papel: usuario.papel as "admin" | "corretor" | "gestor",
      }}
    >
      <ApresentacaoClient />
    </UsuarioProvider>
  );
}
