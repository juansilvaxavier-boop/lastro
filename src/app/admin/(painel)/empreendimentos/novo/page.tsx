import { createClient } from "@/lib/supabase/server";
import { EmpreendimentoForm } from "@/components/admin/EmpreendimentoForm";

export default async function NovoEmpreendimentoPage() {
  const supabase = await createClient();
  const { data: bairros } = await supabase.from("bairros").select("id, nome").order("nome");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">Novo empreendimento</h1>
      <EmpreendimentoForm bairros={bairros ?? []} />
    </div>
  );
}
