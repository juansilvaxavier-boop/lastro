import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ehAdmin } from "@/lib/admin";
import { SignOutButton } from "@/components/SignOutButton";

const LINKS = [
  { href: "/admin", label: "Empreendimentos" },
  { href: "/admin/bairros", label: "Bairros" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const admin = await ehAdmin(supabase, user.id);
  if (!admin) redirect("/admin/login");

  return (
    <>
      <header className="border-b border-slate-200 bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/admin" className="text-lg font-bold text-white">
            Lastro admin
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-300">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            ))}
            <SignOutButton redirectTo="/admin/login" />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </>
  );
}
