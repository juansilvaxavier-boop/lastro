import { BairroForm } from "@/components/admin/BairroForm";

export default function NovoBairroPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">Novo bairro</h1>
      <BairroForm />
    </div>
  );
}
