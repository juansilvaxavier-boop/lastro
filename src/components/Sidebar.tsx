"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, Home, User, HardHat, MapPin, Database, Presentation } from "lucide-react";

const LINKS = [
  { href: "/tendencias", label: "Tendências", icon: TrendingUp },
  { href: "/imoveis", label: "Imóveis", icon: Home },
  { href: "/clientes", label: "Clientes", icon: User },
  { href: "/construtoras", label: "Construtoras", icon: HardHat },
  { href: "/regioes", label: "Regiões", icon: MapPin },
  { href: "/dados", label: "Dados", icon: Database },
  { href: "/apresentacao", label: "Modo apresentação", icon: Presentation },
];

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className={`hidden shrink-0 border-r border-gray-200 bg-gray-50 py-4 transition-all sm:block ${
        collapsed ? "w-0 overflow-hidden border-r-0 py-0" : "w-56 px-3"
      }`}
    >
      <nav className="flex flex-col gap-1">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const ativo = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap ${
                ativo ? "bg-gray-200 text-slate-900" : "text-slate-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
