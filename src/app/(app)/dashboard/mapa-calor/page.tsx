import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function corIntensidade(valor: number, min: number, max: number, invertido = false): string {
  if (max === min) return "bg-slate-100 text-slate-500";
  const t = Math.max(0, Math.min(1, (valor - min) / (max - min)));
  const escala = invertido ? 1 - t : t;
  if (escala >= 0.75) return "bg-emerald-600 text-white";
  if (escala >= 0.5) return "bg-emerald-300 text-emerald-950";
  if (escala >= 0.25) return "bg-amber-200 text-amber-900";
  return "bg-red-200 text-red-900";
}

export default async function MapaDeCalorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase.from("perfis").select("id").eq("user_id", user.id).maybeSingle();
  if (!perfil) redirect("/onboarding");

  const { data: empreendimentos } = await supabase
    .from("empreendimentos")
    .select("id, preco, area_m2, bairro_id, bairros(nome), scores(score_valorizacao, score_renda, calculado_em)")
    .eq("ativo", true);

  type Linha = {
    bairroId: string;
    nome: string;
    somaValorizacao: number;
    somaRenda: number;
    somaPrecoM2: number;
    contPrecoM2: number;
    count: number;
  };

  const porBairro = new Map<string, Linha>();

  for (const emp of empreendimentos ?? []) {
    const bairroId = emp.bairro_id ?? "sem-bairro";
    const nome = emp.bairros?.nome ?? "Sem bairro";
    if (!porBairro.has(bairroId)) {
      porBairro.set(bairroId, { bairroId, nome, somaValorizacao: 0, somaRenda: 0, somaPrecoM2: 0, contPrecoM2: 0, count: 0 });
    }
    const linha = porBairro.get(bairroId)!;

    const scoresOrdenados = [...(emp.scores ?? [])].sort(
      (a, b) => new Date(b.calculado_em).getTime() - new Date(a.calculado_em).getTime()
    );
    const ultimo = scoresOrdenados[0];
    if (ultimo) {
      linha.somaValorizacao += Number(ultimo.score_valorizacao);
      linha.somaRenda += Number(ultimo.score_renda);
      linha.count += 1;
    }
    if (emp.area_m2 && Number(emp.area_m2) > 0) {
      linha.somaPrecoM2 += Number(emp.preco) / Number(emp.area_m2);
      linha.contPrecoM2 += 1;
    }
  }

  const linhas = [...porBairro.values()]
    .filter((l) => l.count > 0)
    .map((l) => ({
      nome: l.nome,
      scoreValorizacaoMedio: l.somaValorizacao / l.count,
      scoreRendaMedio: l.somaRenda / l.count,
      precoM2Medio: l.contPrecoM2 > 0 ? l.somaPrecoM2 / l.contPrecoM2 : null,
      count: l.count,
    }))
    .sort((a, b) => b.scoreValorizacaoMedio - a.scoreValorizacaoMedio);

  const precosValidos = linhas.map((l) => l.precoM2Medio).filter((v): v is number => v != null);
  const minPreco = precosValidos.length ? Math.min(...precosValidos) : 0;
  const maxPreco = precosValidos.length ? Math.max(...precosValidos) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mapa de calor por bairro</h1>
        <p className="text-sm text-slate-500">
          Onde estão os melhores scores médios de valorização e renda — quanto mais verde, melhor.
        </p>
      </div>

      {linhas.length === 0 ? (
        <p className="text-sm text-slate-400">Sem empreendimentos com score calculado ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Bairro</th>
                <th className="px-4 py-3">Score valorização médio</th>
                <th className="px-4 py-3">Score renda médio</th>
                <th className="px-4 py-3">Preço médio/m²</th>
                <th className="px-4 py-3">Empreendimentos</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.nome} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{l.nome}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-md px-3 py-1 font-semibold ${corIntensidade(l.scoreValorizacaoMedio, 0, 100)}`}>
                      {l.scoreValorizacaoMedio.toFixed(0)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-md px-3 py-1 font-semibold ${corIntensidade(l.scoreRendaMedio, 0, 100)}`}>
                      {l.scoreRendaMedio.toFixed(0)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {l.precoM2Medio != null ? (
                      <span className={`inline-block rounded-md px-3 py-1 font-semibold ${corIntensidade(l.precoM2Medio, minPreco, maxPreco, true)}`}>
                        {l.precoM2Medio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{l.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
