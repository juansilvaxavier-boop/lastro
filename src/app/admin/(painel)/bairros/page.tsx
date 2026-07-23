import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminBairrosPage() {
  const supabase = await createClient();
  const { data: bairros } = await supabase.from("bairros").select("*").order("nome");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bairros</h1>
          <p className="text-sm text-slate-500">Dados de bairro usados no score de valorização.</p>
        </div>
        <Link
          href="/admin/bairros/novo"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Novo bairro
        </Link>
      </div>

      {!bairros || bairros.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum bairro cadastrado ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Cidade/UF</th>
                <th className="px-4 py-3">População</th>
                <th className="px-4 py-3">Renda média</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {bairros.map((b) => (
                <tr key={b.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{b.nome}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {b.cidade}/{b.estado}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{b.populacao?.toLocaleString("pt-BR") ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {b.renda_media != null
                      ? Number(b.renda_media).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/bairros/${b.id}`} className="text-sm font-medium text-slate-700 hover:text-slate-900">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
