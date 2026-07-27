"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface PontoMapa {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  cor?: string;
}

export interface PontoInteresseMapa {
  id: string;
  nome: string;
  tipo: string;
  latitude: number;
  longitude: number;
}

const EMOJI_TIPO_PONTO_INTERESSE: Record<string, string> = {
  shopping: "🛍️",
  hospital: "🏥",
  universidade: "🎓",
  via: "🛣️",
  outro: "📍",
};

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function criarIcone(nome: string, cor: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%)">
             <span style="margin-bottom:2px;padding:2px 8px;border-radius:9999px;background:white;border:1px solid #e5e7eb;font-size:11px;font-weight:600;color:#0f172a;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.15);">${escaparHtml(nome)}</span>
             <div style="width:12px;height:12px;border-radius:9999px;background:${cor};border:2px solid white;box-shadow:0 0 0 1px ${cor};"></div>
           </div>`,
    iconSize: [0, 0],
  });
}

function criarIconePontoInteresse(nome: string, tipo: string): L.DivIcon {
  const emoji = EMOJI_TIPO_PONTO_INTERESSE[tipo] ?? EMOJI_TIPO_PONTO_INTERESSE.outro;
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%)">
             <span style="margin-bottom:2px;padding:2px 8px;border-radius:9999px;background:#fff7ed;border:1px solid #fdba74;font-size:11px;font-weight:600;color:#9a3412;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.15);">${emoji} ${escaparHtml(nome)}</span>
             <div style="width:14px;height:14px;display:flex;align-items:center;justify-content:center;font-size:11px;border-radius:9999px;background:white;border:2px solid #f97316;">${emoji}</div>
           </div>`,
    iconSize: [0, 0],
  });
}

export function MapaCidade({
  pontos,
  pontosInteresse = [],
}: {
  pontos: PontoMapa[];
  pontosInteresse?: PontoInteresseMapa[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const marcadoresRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([-20.8113, -49.3758], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    marcadoresRef.current.forEach((m) => m.remove());
    const marcadoresBairros = pontos.map((ponto) =>
      L.marker([ponto.latitude, ponto.longitude], { icon: criarIcone(ponto.nome, ponto.cor ?? "#1d4ed8") }).addTo(map)
    );
    const marcadoresPontosInteresse = pontosInteresse.map((ponto) =>
      L.marker([ponto.latitude, ponto.longitude], { icon: criarIconePontoInteresse(ponto.nome, ponto.tipo) }).addTo(
        map
      )
    );
    marcadoresRef.current = [...marcadoresBairros, ...marcadoresPontosInteresse];

    const todosPontos = [...pontos, ...pontosInteresse];
    if (todosPontos.length > 0) {
      const bounds = L.latLngBounds(todosPontos.map((p) => [p.latitude, p.longitude] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [pontos, pontosInteresse]);

  return <div ref={containerRef} className="h-[480px] w-full rounded-2xl" />;
}
