"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Objetivo = "valorizacao" | "renda" | "misto";
type Prazo = "curto" | "medio" | "longo";
type Liquidez = "baixa" | "media" | "alta";
type Risco = "baixa" | "media" | "alta";

const OPCOES_OBJETIVO: { valor: Objetivo; label: string; desc: string }[] = [
  { valor: "valorizacao", label: "Valorização", desc: "Quero que o imóvel valorize para vender ou capitalizar no futuro." },
  { valor: "renda", label: "Renda", desc: "Quero fluxo de caixa mensal com aluguel." },
  { valor: "misto", label: "Misto", desc: "Um pouco de cada — valorização e renda." },
];

const OPCOES_PRAZO: { valor: Prazo; label: string }[] = [
  { valor: "curto", label: "Curto (até 2 anos)" },
  { valor: "medio", label: "Médio (2 a 7 anos)" },
  { valor: "longo", label: "Longo (mais de 7 anos)" },
];

const OPCOES_LIQUIDEZ: { valor: Liquidez; label: string; desc: string }[] = [
  { valor: "alta", label: "Alta", desc: "Posso precisar resgatar o capital rapidamente." },
  { valor: "media", label: "Média", desc: "Consigo esperar, mas prefiro não travar por muitos anos." },
  { valor: "baixa", label: "Baixa", desc: "Não preciso desse dinheiro tão cedo." },
];

const OPCOES_RISCO: { valor: Risco; label: string }[] = [
  { valor: "baixa", label: "Baixa — prefiro imóveis prontos e incorporadoras consolidadas" },
  { valor: "media", label: "Média — aceito algum risco de obra por um preço melhor" },
  { valor: "alta", label: "Alta — topo lançamentos e obras não iniciadas por potencial maior" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<"essencial" | "refinamento">("essencial");
  const [objetivo, setObjetivo] = useState<Objetivo | null>(null);
  const [prazo, setPrazo] = useState<Prazo | null>(null);
  const [liquidez, setLiquidez] = useState<Liquidez | null>(null);
  const [risco, setRisco] = useState<Risco>("media");
  const [capitalDisponivel, setCapitalDisponivel] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const essencialCompleta = objetivo && prazo && liquidez;

  async function salvar(pularRefinamento: boolean) {
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/perfil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objetivo,
          prazo,
          liquidez,
          toleranciaRisco: risco,
          capitalDisponivel: pularRefinamento || !capitalDisponivel ? undefined : Number(capitalDisponivel),
          refinamento: pularRefinamento ? {} : { observacoes },
        }),
      });
      if (!res.ok) throw new Error("Falha ao salvar perfil");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErro("Não foi possível salvar seu perfil. Tente novamente.");
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <p className="text-sm font-medium text-slate-500">Bem-vindo ao Lastro</p>
        <h1 className="text-2xl font-bold text-slate-900">
          {etapa === "essencial" ? "Vamos entender seu perfil" : "Refinamento opcional"}
        </h1>
      </div>

      {etapa === "essencial" ? (
        <div className="flex flex-col gap-8">
          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-slate-800">1. Qual seu objetivo principal?</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {OPCOES_OBJETIVO.map((o) => (
                <button
                  key={o.valor}
                  type="button"
                  onClick={() => setObjetivo(o.valor)}
                  className={`rounded-xl border p-4 text-left text-sm transition ${
                    objetivo === o.valor ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-400"
                  }`}
                >
                  <div className="font-semibold">{o.label}</div>
                  <div className={`mt-1 text-xs ${objetivo === o.valor ? "text-slate-300" : "text-slate-500"}`}>{o.desc}</div>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-slate-800">2. Qual seu prazo de investimento?</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {OPCOES_PRAZO.map((o) => (
                <button
                  key={o.valor}
                  type="button"
                  onClick={() => setPrazo(o.valor)}
                  className={`rounded-xl border p-4 text-left text-sm transition ${
                    prazo === o.valor ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-400"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-slate-800">3. Qual sua necessidade de liquidez?</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {OPCOES_LIQUIDEZ.map((o) => (
                <button
                  key={o.valor}
                  type="button"
                  onClick={() => setLiquidez(o.valor)}
                  className={`rounded-xl border p-4 text-left text-sm transition ${
                    liquidez === o.valor ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-400"
                  }`}
                >
                  <div className="font-semibold">{o.label}</div>
                  <div className={`mt-1 text-xs ${liquidez === o.valor ? "text-slate-300" : "text-slate-500"}`}>{o.desc}</div>
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            disabled={!essencialCompleta}
            onClick={() => setEtapa("refinamento")}
            className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-40"
          >
            Continuar
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-slate-800">Qual sua tolerância a risco de obra?</legend>
            <div className="flex flex-col gap-3">
              {OPCOES_RISCO.map((o) => (
                <button
                  key={o.valor}
                  type="button"
                  onClick={() => setRisco(o.valor)}
                  className={`rounded-xl border p-4 text-left text-sm transition ${
                    risco === o.valor ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-400"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-800">Capital disponível para entrada (opcional)</legend>
            <input
              type="number"
              value={capitalDisponivel}
              onChange={(e) => setCapitalDisponivel(e.target.value)}
              placeholder="Ex: 150000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-400">
              Usamos isso para sinalizar quando um imóvel pede uma entrada maior do que você tem disponível.
            </p>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-800">Alguma observação adicional? (opcional)</legend>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Ex: já tenho um imóvel na planta e prefiro diversificar em imóveis prontos."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </fieldset>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEtapa("essencial")}
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Voltar
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={() => salvar(false)}
              className="flex-1 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {enviando ? "Salvando..." : "Concluir"}
            </button>
          </div>
          <button
            type="button"
            disabled={enviando}
            onClick={() => salvar(true)}
            className="text-center text-sm text-slate-400 hover:text-slate-700"
          >
            Pular refinamento por agora
          </button>
        </div>
      )}
    </main>
  );
}
