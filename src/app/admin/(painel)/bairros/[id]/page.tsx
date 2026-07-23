import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BairroForm } from "@/components/admin/BairroForm";

const paraString = (v: number | string | null | undefined) => (v == null ? "" : String(v));

export default async function EditarBairroPage({ params }: PageProps<"/admin/bairros/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: bairro, error } = await supabase.from("bairros").select("*").eq("id", id).single();
  if (error || !bairro) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">Editar bairro</h1>
      <BairroForm
        inicial={{
          id: bairro.id,
          nome: bairro.nome,
          cidade: bairro.cidade,
          estado: bairro.estado,
          populacao: paraString(bairro.populacao),
          densidadeDemografica: paraString(bairro.densidade_demografica),
          rendaMedia: paraString(bairro.renda_media),
          zoneamento: bairro.zoneamento ?? "",
          planoDiretorUrl: bairro.plano_diretor_url ?? "",
          ultimaRevisaoManual: bairro.ultima_revisao_manual ?? "",
        }}
      />
    </div>
  );
}
