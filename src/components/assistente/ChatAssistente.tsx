"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Mic, MicOff, Send, Sparkles, X } from "lucide-react";

interface Mensagem {
  role: "user" | "assistant";
  texto: string;
  acoes?: { ferramenta: string; ok: boolean }[];
  erro?: boolean;
}

const LABEL_FERRAMENTA: Record<string, string> = {
  buscar_clientes: "Consultou clientes",
  criar_cliente: "Criou cliente",
  atualizar_cliente: "Atualizou cliente",
  registrar_interacao: "Registrou interação",
  buscar_empreendimentos: "Consultou imóveis",
  criar_empreendimento: "Criou imóvel",
  buscar_construtoras: "Consultou construtoras",
  buscar_localizacoes: "Consultou regiões",
  buscar_indicadores: "Consultou indicadores",
  web_search: "Pesquisou na web",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionCtor = new () => any;

export function ChatAssistente() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [entrada, setEntrada] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [suportaVoz, setSuportaVoz] = useState(false);
  const listaRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reconhecimentoRef = useRef<any>(null);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    void Promise.resolve().then(() => setSuportaVoz(!!Ctor));
  }, []);

  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight });
  }, [mensagens, enviando]);

  async function enviar(texto: string) {
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;

    const historico = mensagens.map((m) => ({ role: m.role, texto: m.texto }));
    setMensagens((prev) => [...prev, { role: "user", texto: conteudo }]);
    setEntrada("");
    setEnviando(true);

    try {
      const res = await fetch("/api/assistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: conteudo, historico }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMensagens((prev) => [
          ...prev,
          { role: "assistant", texto: data.error?.toString?.() ?? "Não foi possível processar a mensagem.", erro: true },
        ]);
        return;
      }
      setMensagens((prev) => [...prev, { role: "assistant", texto: data.resposta, acoes: data.acoes }]);
    } catch {
      setMensagens((prev) => [...prev, { role: "assistant", texto: "Erro de conexão com o assistente.", erro: true }]);
    } finally {
      setEnviando(false);
    }
  }

  function alternarGravacao() {
    if (gravando) {
      reconhecimentoRef.current?.stop();
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;

    const reconhecimento = new Ctor();
    reconhecimento.lang = "pt-BR";
    reconhecimento.interimResults = false;
    reconhecimento.maxAlternatives = 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reconhecimento.onresult = (evento: any) => {
      const transcricao = evento.results?.[0]?.[0]?.transcript ?? "";
      setEntrada((prev) => (prev ? `${prev} ${transcricao}` : transcricao));
    };
    reconhecimento.onerror = () => setGravando(false);
    reconhecimento.onend = () => setGravando(false);

    reconhecimentoRef.current = reconhecimento;
    reconhecimento.start();
    setGravando(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Abrir assistente"
        className={`fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-800 ${aberto ? "hidden" : ""}`}
      >
        <Sparkles size={24} />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-40 sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(680px,calc(100vh-3rem))] sm:w-[400px]">
          <div className="flex h-full w-full flex-col overflow-hidden border border-gray-200 bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-blue-700 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <span className="font-semibold">Assistente Lastro</span>
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar assistente"
                className="rounded-lg p-1 hover:bg-blue-800"
              >
                <X size={18} />
              </button>
            </div>

            <div ref={listaRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
              {mensagens.length === 0 && (
                <p className="text-sm text-slate-400">
                  Pergunte sobre clientes, imóveis, construtoras ou peça para eu cadastrar ou atualizar algo no
                  sistema. Também posso pesquisar informações na web.
                </p>
              )}
              {mensagens.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-blue-700 text-white"
                        : m.erro
                          ? "border border-red-200 bg-red-50 text-red-700"
                          : "border border-gray-200 bg-white text-slate-800"
                    }`}
                  >
                    {m.texto}
                    {!!m.acoes?.length && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.acoes.map((a, j) => (
                          <span
                            key={j}
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              a.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                            }`}
                          >
                            {LABEL_FERRAMENTA[a.ferramenta] ?? a.ferramenta}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {enviando && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-slate-400">
                    Pensando...
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void enviar(entrada);
              }}
              className="flex items-end gap-2 border-t border-gray-200 bg-white p-3"
            >
              {suportaVoz && (
                <button
                  type="button"
                  onClick={alternarGravacao}
                  aria-label={gravando ? "Parar gravação" : "Falar"}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    gravando ? "bg-red-600 text-white" : "bg-gray-100 text-slate-600 hover:bg-gray-200"
                  }`}
                >
                  {gravando ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              )}
              <textarea
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void enviar(entrada);
                  }
                }}
                rows={1}
                placeholder="Escreva ou fale sua mensagem..."
                className="max-h-28 flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="submit"
                disabled={enviando || !entrada.trim()}
                aria-label="Enviar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
