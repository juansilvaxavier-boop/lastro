import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmpreendimentoForm } from "@/components/admin/EmpreendimentoForm";

const paraString = (v: number | string | null | undefined) => (v == null ? "" : String(v));

export default async function EditarEmpreendimentoPage({ params }: PageProps<"/admin/empreendimentos/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: emp, error }, { data: bairros }] = await Promise.all([
    supabase.from("empreendimentos").select("*").eq("id", id).single(),
    supabase.from("bairros").select("id, nome").order("nome"),
  ]);
  if (error || !emp) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">Editar empreendimento</h1>
      <EmpreendimentoForm
        bairros={bairros ?? []}
        inicial={{
          id: emp.id,
          nome: emp.nome,
          incorporadora: emp.incorporadora ?? "",
          bairroId: emp.bairro_id ?? "",
          endereco: emp.endereco ?? "",
          tipo: emp.tipo,
          statusObra: emp.status_obra ?? "",
          dataEntregaPrevista: emp.data_entrega_prevista ?? "",
          preco: paraString(emp.preco),
          areaM2: paraString(emp.area_m2),
          quartos: paraString(emp.quartos),
          vagas: paraString(emp.vagas),
          valorCondominio: paraString(emp.valor_condominio),
          iptuAnual: paraString(emp.iptu_anual),
          aluguelEstimado: paraString(emp.aluguel_estimado),
          ativo: emp.ativo,
        }}
      />
    </div>
  );
}
