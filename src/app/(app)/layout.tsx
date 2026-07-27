import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Shell } from "@/components/Shell";
import { UsuarioProvider } from "@/components/UsuarioContext";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
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
      <Shell nome={usuario.nome} email={usuario.email ?? user.email ?? null}>
        {children}
      </Shell>
    </UsuarioProvider>
  );
}
