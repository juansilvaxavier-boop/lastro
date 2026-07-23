import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function WatchlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase.from("perfis").select("id").eq("user_id", user.id).maybeSingle();
  if (!perfil) redirect("/onboarding");

  const { data: itens } = await supabase
    .from("watchlist")
    .select("*, empreendimentos(nome, preco, bairros(nome))")
    .eq("perfil_id", perfil.id)
    .order("created_at", { ascending: false });

  const salvos = (itens ?? []).filter((i) => i.status === "salvo");
  const descartados = (itens ?? []).filter((i) => i.status === "descartado");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Watchlist</h1>
        <p className="text-sm text-slate-500">Imóveis salvos e descartados — evita reavaliar do zero.</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Salvos ({salvos.length})</h2>
        {salvos.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum imóvel salvo ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {salvos.map((i) => (
              <li key={i.id}>
                <Link
                  href={`/dashboard/${i.empreendimento_id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-400"
                >
                  <p className="font-medium text-slate-900">{i.empreendimentos?.nome}</p>
                  <p className="text-xs text-slate-500">{i.empreendimentos?.bairros?.nome}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Descartados ({descartados.length})</h2>
        {descartados.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum imóvel descartado ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {descartados.map((i) => (
              <li key={i.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">{i.empreendimentos?.nome}</p>
                <p className="text-xs text-slate-500">{i.empreendimentos?.bairros?.nome}</p>
                {i.motivo_descarte && <p className="mt-1 text-sm text-slate-600">“{i.motivo_descarte}”</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
