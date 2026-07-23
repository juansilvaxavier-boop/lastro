import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/mapa-calor", label: "Mapa de calor" },
  { href: "/dashboard/comparar", label: "Comparar" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/alertas", label: "Alertas" },
];

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let alertasNaoLidos = 0;
  if (user) {
    const { data: perfil } = await supabase.from("perfis").select("id").eq("user_id", user.id).maybeSingle();
    if (perfil) {
      const { count } = await supabase
        .from("alertas")
        .select("id", { count: "exact", head: true })
        .eq("perfil_id", perfil.id)
        .eq("lido", false);
      alertasNaoLidos = count ?? 0;
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-lg font-bold text-slate-900">
          Lastro
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="relative hover:text-slate-900">
              {link.label}
              {link.href === "/alertas" && alertasNaoLidos > 0 && (
                <span className="absolute -right-3 -top-2 rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                  {alertasNaoLidos}
                </span>
              )}
            </Link>
          ))}
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
