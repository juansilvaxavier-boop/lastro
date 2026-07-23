import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlertaItem } from "@/components/AlertaItem";

export default async function AlertasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase.from("perfis").select("id").eq("user_id", user.id).maybeSingle();
  if (!perfil) redirect("/onboarding");

  const { data: alertas } = await supabase
    .from("alertas")
    .select("*")
    .eq("perfil_id", perfil.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Alertas de oportunidade</h1>
        <p className="text-sm text-slate-500">Avisamos quando um imóvel novo combina com o seu perfil.</p>
      </div>

      {!alertas || alertas.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum alerta por enquanto.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {alertas.map((a) => (
            <AlertaItem
              key={a.id}
              id={a.id}
              titulo={a.titulo}
              mensagem={a.mensagem}
              lido={a.lido}
              empreendimentoId={a.empreendimento_id}
              criadoEm={a.created_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}
