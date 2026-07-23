"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "enviando" | "enviado" | "erro">("idle");

  async function enviarLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("enviando");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=/` },
    });
    setStatus(error ? "erro" : "enviado");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Lastro</h1>
        <p className="mt-1 text-sm text-slate-500">
          Análise de investimento imobiliário — Rio Preto/SP
        </p>
      </div>

      {status === "enviado" ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Enviamos um link de acesso para <strong>{email}</strong>. Confira sua caixa de entrada.
        </p>
      ) : (
        <form onSubmit={enviarLink} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Seu e-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "enviando"}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {status === "enviando" ? "Enviando..." : "Entrar com link mágico"}
          </button>
          {status === "erro" && (
            <p className="text-sm text-red-600">Nao foi possivel enviar o link. Tente novamente.</p>
          )}
        </form>
      )}
    </main>
  );
}
