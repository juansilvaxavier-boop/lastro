"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { formatarMoeda, paraNumero } from "@/lib/format";
import type { Empreendimento, Cliente } from "@/types/dominio";

type Modo = "a_vista" | "financiamento_bancario" | "financiamento_construtora" | "fluxo_personalizado";

interface ResultadoAVista {
  valorFinal: number;
  desconto: number;
}
interface ResultadoFinanciamento {
  parcelaInicial: number;
  parcelaFinal: number;
  totalPago: number;
  totalJuros: number;
}
interface ResultadoParcelasObra {
  totalPagoObra: number;
  saldoResidualNaEntrega: number;
  financiamentoPosEntrega: ResultadoFinanciamento | null;
}
interface ItemFluxo {
  mes: number;
  tipo: "entrada" | "mensal" | "balao" | "chaves" | "financiamento";
  valor: number;
}
interface ResultadoFluxo {
  totalPago: number;
  itens: ItemFluxo[];
  financiamento: ResultadoFinanciamento | null;
}

const LABEL_TIPO_ITEM_FLUXO: Record<ItemFluxo["tipo"], string> = {
  entrada: "Ato/sinal",
  mensal: "Parcelas da entrada",
  balao: "Balões",
  chaves: "Saldo devedor (à vista na entrega)",
  financiamento: "Financiamento",
};

export function CalculadoraModal({
  aberto,
  onFechar,
  empreendimento,
  cliente,
}: {
  aberto: boolean;
  onFechar: () => void;
  empreendimento: Empreendimento | null;
  cliente: Cliente | null;
}) {
  const [modo, setModo] = useState<Modo>("financiamento_bancario");

  const [percentualDesconto, setPercentualDesconto] = useState("5");

  const [valorEntradaPct, setValorEntradaPct] = useState("20");
  const [numParcelas, setNumParcelas] = useState("360");
  const [taxaJurosAnual, setTaxaJurosAnual] = useState("11");
  const [sistema, setSistema] = useState<"SAC" | "PRICE">("SAC");

  const [numParcelasObra, setNumParcelasObra] = useState("36");
  const [taxaIncMensal, setTaxaIncMensal] = useState("0.4");
  const [percentualFinanciadoNaEntrega, setPercentualFinanciadoNaEntrega] = useState("40");
  const [converter, setConverter] = useState(true);

  const [valorEntradaFluxo, setValorEntradaFluxo] = useState("10");

  const [parcelaEntradaValor, setParcelaEntradaValor] = useState("2000");
  const [parcelaEntradaQtd, setParcelaEntradaQtd] = useState("12");
  const [parcelaEntradaMesInicial, setParcelaEntradaMesInicial] = useState("1");

  const [incluirBaloes, setIncluirBaloes] = useState(false);
  const [balaoValor, setBalaoValor] = useState("10000");
  const [balaoPeriodicidade, setBalaoPeriodicidade] = useState("6");
  const [balaoQtd, setBalaoQtd] = useState("4");
  const [balaoMesInicial, setBalaoMesInicial] = useState("");

  const [saldoDevedorValor, setSaldoDevedorValor] = useState("");
  const [saldoDevedorMes, setSaldoDevedorMes] = useState("36");
  const [financiarSaldoDevedor, setFinanciarSaldoDevedor] = useState(false);
  const [saldoDevedorNumParcelas, setSaldoDevedorNumParcelas] = useState("120");
  const [saldoDevedorTaxaJuros, setSaldoDevedorTaxaJuros] = useState("11");
  const [saldoDevedorSistema, setSaldoDevedorSistema] = useState<"SAC" | "PRICE">("SAC");

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<unknown>(null);
  const [alertaRenda, setAlertaRenda] = useState(false);

  if (!empreendimento) return null;
  const preco = empreendimento.preco_total;

  async function calcular(e: React.FormEvent) {
    e.preventDefault();
    if (!empreendimento) return;
    setErro(null);
    setResultado(null);
    setEnviando(true);

    let parametros: Record<string, unknown> = {};
    if (modo === "a_vista") {
      parametros = { percentualDesconto: (paraNumero(percentualDesconto) ?? 0) / 100 };
    } else if (modo === "financiamento_bancario") {
      parametros = {
        valorEntrada: (preco * (paraNumero(valorEntradaPct) ?? 0)) / 100,
        numParcelas: paraNumero(numParcelas) ?? 360,
        taxaJurosAnual: (paraNumero(taxaJurosAnual) ?? 0) / 100,
        sistema,
      };
    } else if (modo === "financiamento_construtora") {
      parametros = {
        valorEntrada: (preco * (paraNumero(valorEntradaPct) ?? 0)) / 100,
        numParcelasObra: paraNumero(numParcelasObra) ?? 36,
        taxaIncMensal: (paraNumero(taxaIncMensal) ?? 0) / 100,
        percentualFinanciadoNaEntrega: (paraNumero(percentualFinanciadoNaEntrega) ?? 0) / 100,
        converterEmFinanciamentoBancario: converter,
        taxaJurosAnualPosEntrega: (paraNumero(taxaJurosAnual) ?? 0) / 100,
        numParcelasPosEntrega: paraNumero(numParcelas) ?? 240,
        sistemaPosEntrega: sistema,
      };
    } else {
      const qtdParcelasEntrada = paraNumero(parcelaEntradaQtd) ?? 0;
      const saldoDevedor = paraNumero(saldoDevedorValor) ?? 0;

      parametros = {
        valorEntrada: (preco * (paraNumero(valorEntradaFluxo) ?? 0)) / 100,
        parcelasMensais:
          qtdParcelasEntrada > 0
            ? {
                valor: paraNumero(parcelaEntradaValor) ?? 0,
                quantidade: qtdParcelasEntrada,
                mesInicial: paraNumero(parcelaEntradaMesInicial) ?? 1,
              }
            : undefined,
        baloes: incluirBaloes
          ? [
              {
                valor: paraNumero(balaoValor) ?? 0,
                periodicidadeMeses: paraNumero(balaoPeriodicidade) ?? 6,
                quantidade: paraNumero(balaoQtd) ?? 1,
                mesInicial: paraNumero(balaoMesInicial) || undefined,
              },
            ]
          : undefined,
        valorNaEntrega:
          saldoDevedor > 0 && !financiarSaldoDevedor
            ? { valor: saldoDevedor, mes: paraNumero(saldoDevedorMes) ?? 0 }
            : undefined,
        saldoFinanciado:
          saldoDevedor > 0 && financiarSaldoDevedor
            ? {
                valor: saldoDevedor,
                numParcelas: paraNumero(saldoDevedorNumParcelas) ?? 120,
                taxaJurosAnual: (paraNumero(saldoDevedorTaxaJuros) ?? 0) / 100,
                sistema: saldoDevedorSistema,
              }
            : undefined,
      };
    }

    const res = await fetch("/api/simulacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        empreendimentoId: empreendimento.id,
        clienteId: cliente?.id ?? null,
        formaPagamento: modo,
        parametros,
      }),
    });

    setEnviando(false);
    if (!res.ok) {
      setErro("Não foi possível calcular. Confira os valores informados.");
      return;
    }
    const data = await res.json();
    setResultado(data.simulacao.resultado);
    setAlertaRenda(data.alertaComprometimentoRenda);
  }

  return (
    <Modal aberto={aberto} titulo={`Calculadora — ${empreendimento.nome}`} onFechar={onFechar} largura="max-w-2xl">
      <p className="mb-4 text-sm text-slate-500">Preço do imóvel: {formatarMoeda(preco)}</p>

      <form onSubmit={calcular} className="flex flex-col gap-4">
        <Field label="Forma de pagamento">
          <select className="input" value={modo} onChange={(e) => setModo(e.target.value as Modo)}>
            <option value="a_vista">À vista</option>
            <option value="financiamento_bancario">Financiamento bancário (SFH/SAC/PRICE)</option>
            <option value="financiamento_construtora">Financiamento direto com a construtora</option>
            <option value="fluxo_personalizado">Fluxo de pagamento personalizado</option>
          </select>
        </Field>

        {modo === "a_vista" && (
          <Field label="Desconto à vista (%)">
            <input className="input" type="number" value={percentualDesconto} onChange={(e) => setPercentualDesconto(e.target.value)} />
          </Field>
        )}

        {(modo === "financiamento_bancario" || modo === "financiamento_construtora") && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Entrada (% do preço)">
              <input className="input" type="number" value={valorEntradaPct} onChange={(e) => setValorEntradaPct(e.target.value)} />
            </Field>
            <Field label="Sistema de amortização">
              <select className="input" value={sistema} onChange={(e) => setSistema(e.target.value as typeof sistema)}>
                <option value="SAC">SAC</option>
                <option value="PRICE">PRICE</option>
              </select>
            </Field>
          </div>
        )}

        {modo === "financiamento_bancario" && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Número de parcelas">
              <input className="input" type="number" value={numParcelas} onChange={(e) => setNumParcelas(e.target.value)} />
            </Field>
            <Field label="Taxa de juros (% a.a.)">
              <input className="input" type="number" value={taxaJurosAnual} onChange={(e) => setTaxaJurosAnual(e.target.value)} />
            </Field>
          </div>
        )}

        {modo === "financiamento_construtora" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Parcelas até a entrega">
                <input className="input" type="number" value={numParcelasObra} onChange={(e) => setNumParcelasObra(e.target.value)} />
              </Field>
              <Field label="INCC estimado (% a.m.)">
                <input className="input" type="number" step="0.01" value={taxaIncMensal} onChange={(e) => setTaxaIncMensal(e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="% do saldo financiado na entrega">
                <input
                  className="input"
                  type="number"
                  value={percentualFinanciadoNaEntrega}
                  onChange={(e) => setPercentualFinanciadoNaEntrega(e.target.value)}
                />
              </Field>
              <Field label="Taxa pós-entrega (% a.a.)">
                <input className="input" type="number" value={taxaJurosAnual} onChange={(e) => setTaxaJurosAnual(e.target.value)} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={converter} onChange={(e) => setConverter(e.target.checked)} />
              Converter saldo residual em financiamento bancário na entrega
            </label>
          </>
        )}

        {modo === "fluxo_personalizado" && (
          <>
            <Field label="Ato/sinal (% do preço)">
              <input className="input" type="number" value={valorEntradaFluxo} onChange={(e) => setValorEntradaFluxo(e.target.value)} />
            </Field>

            <p className="text-sm font-semibold text-slate-700">Parcelas da entrada</p>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Valor da parcela (R$)">
                <input className="input" type="number" value={parcelaEntradaValor} onChange={(e) => setParcelaEntradaValor(e.target.value)} />
              </Field>
              <Field label="Quantidade">
                <input className="input" type="number" value={parcelaEntradaQtd} onChange={(e) => setParcelaEntradaQtd(e.target.value)} />
              </Field>
              <Field label="1ª parcela (mês)">
                <input
                  className="input"
                  type="number"
                  value={parcelaEntradaMesInicial}
                  onChange={(e) => setParcelaEntradaMesInicial(e.target.value)}
                />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={incluirBaloes} onChange={(e) => setIncluirBaloes(e.target.checked)} />
              Balões
            </label>
            {incluirBaloes && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Valor do balão (R$)">
                  <input className="input" type="number" value={balaoValor} onChange={(e) => setBalaoValor(e.target.value)} />
                </Field>
                <Field label="Quantidade de balões">
                  <input className="input" type="number" value={balaoQtd} onChange={(e) => setBalaoQtd(e.target.value)} />
                </Field>
                <Field label="Periodicidade (meses)">
                  <input
                    className="input"
                    type="number"
                    value={balaoPeriodicidade}
                    onChange={(e) => setBalaoPeriodicidade(e.target.value)}
                  />
                </Field>
                <Field label="1º balão (mês, opcional)">
                  <input
                    className="input"
                    type="number"
                    placeholder={balaoPeriodicidade}
                    value={balaoMesInicial}
                    onChange={(e) => setBalaoMesInicial(e.target.value)}
                  />
                </Field>
              </div>
            )}

            <p className="text-sm font-semibold text-slate-700">Saldo devedor</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Valor do saldo devedor (R$)">
                <input className="input" type="number" value={saldoDevedorValor} onChange={(e) => setSaldoDevedorValor(e.target.value)} />
              </Field>
              <Field label="Mês da entrega">
                <input className="input" type="number" value={saldoDevedorMes} onChange={(e) => setSaldoDevedorMes(e.target.value)} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={financiarSaldoDevedor}
                onChange={(e) => setFinanciarSaldoDevedor(e.target.checked)}
              />
              Financiar o saldo devedor (em vez de pagar à vista na entrega)
            </label>
            {financiarSaldoDevedor && (
              <div className="grid grid-cols-3 gap-4">
                <Field label="Número de parcelas">
                  <input
                    className="input"
                    type="number"
                    value={saldoDevedorNumParcelas}
                    onChange={(e) => setSaldoDevedorNumParcelas(e.target.value)}
                  />
                </Field>
                <Field label="Taxa de juros (% a.a.)">
                  <input
                    className="input"
                    type="number"
                    value={saldoDevedorTaxaJuros}
                    onChange={(e) => setSaldoDevedorTaxaJuros(e.target.value)}
                  />
                </Field>
                <Field label="Sistema">
                  <select
                    className="input"
                    value={saldoDevedorSistema}
                    onChange={(e) => setSaldoDevedorSistema(e.target.value as typeof saldoDevedorSistema)}
                  >
                    <option value="SAC">SAC</option>
                    <option value="PRICE">PRICE</option>
                  </select>
                </Field>
              </div>
            )}
          </>
        )}

        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <Button type="submit" disabled={enviando}>
          {enviando ? "Calculando..." : "Calcular"}
        </Button>
      </form>

      {resultado !== null && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          {alertaRenda && (
            <p className="mb-3 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800">
              Atenção: a parcela estimada ultrapassa 30% da renda informada do cliente.
            </p>
          )}
          {modo === "a_vista" && (
            <ResultadoTexto pares={[
              ["Desconto", formatarMoeda((resultado as ResultadoAVista).desconto)],
              ["Valor final", formatarMoeda((resultado as ResultadoAVista).valorFinal)],
            ]} />
          )}
          {modo === "financiamento_bancario" && (
            <ResultadoTexto pares={[
              ["1ª parcela", formatarMoeda((resultado as ResultadoFinanciamento).parcelaInicial)],
              ["Última parcela", formatarMoeda((resultado as ResultadoFinanciamento).parcelaFinal)],
              ["Total pago", formatarMoeda((resultado as ResultadoFinanciamento).totalPago)],
              ["Total de juros", formatarMoeda((resultado as ResultadoFinanciamento).totalJuros)],
            ]} />
          )}
          {modo === "financiamento_construtora" && (
            <ResultadoTexto pares={[
              ["Total pago durante a obra", formatarMoeda((resultado as ResultadoParcelasObra).totalPagoObra)],
              ["Saldo residual na entrega", formatarMoeda((resultado as ResultadoParcelasObra).saldoResidualNaEntrega)],
              ...((resultado as ResultadoParcelasObra).financiamentoPosEntrega
                ? ([
                    ["1ª parcela pós-entrega", formatarMoeda((resultado as ResultadoParcelasObra).financiamentoPosEntrega!.parcelaInicial)],
                    ["Total pós-entrega", formatarMoeda((resultado as ResultadoParcelasObra).financiamentoPosEntrega!.totalPago)],
                  ] as [string, string][])
                : []),
            ]} />
          )}
          {modo === "fluxo_personalizado" && (
            <FluxoPersonalizadoResultado resultado={resultado as ResultadoFluxo} />
          )}
        </div>
      )}
    </Modal>
  );
}

function FluxoPersonalizadoResultado({ resultado }: { resultado: ResultadoFluxo }) {
  const grupos = new Map<ItemFluxo["tipo"], { quantidade: number; total: number }>();
  for (const item of resultado.itens) {
    const g = grupos.get(item.tipo) ?? { quantidade: 0, total: 0 };
    g.quantidade += 1;
    g.total += item.valor;
    grupos.set(item.tipo, g);
  }

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {[...grupos.entries()].map(([tipo, g]) => (
          <div key={tipo} className="flex justify-between gap-2 border-b border-gray-100 pb-1">
            <dt className="text-slate-500">
              {LABEL_TIPO_ITEM_FLUXO[tipo]} {g.quantidade > 1 ? `(${g.quantidade}x)` : ""}
            </dt>
            <dd className="font-medium text-slate-900">{formatarMoeda(g.total)}</dd>
          </div>
        ))}
      </dl>
      {resultado.financiamento && (
        <div>
          <p className="mb-1 text-sm font-semibold text-slate-700">Saldo devedor financiado</p>
          <ResultadoTexto
            pares={[
              ["1ª parcela", formatarMoeda(resultado.financiamento.parcelaInicial)],
              ["Última parcela", formatarMoeda(resultado.financiamento.parcelaFinal)],
              ["Total do financiamento", formatarMoeda(resultado.financiamento.totalPago)],
            ]}
          />
        </div>
      )}
      <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-semibold">
        <span>Total pago</span>
        <span>{formatarMoeda(resultado.totalPago)}</span>
      </div>
    </div>
  );
}

function ResultadoTexto({ pares }: { pares: [string, string][] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      {pares.map(([label, valor]) => (
        <div key={label} className="flex justify-between gap-2 border-b border-gray-100 pb-1">
          <dt className="text-slate-500">{label}</dt>
          <dd className="font-medium text-slate-900">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}
