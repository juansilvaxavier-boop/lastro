"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface PontoMapa {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function criarIcone(nome: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%)">
             <span style="margin-bottom:2px;padding:2px 8px;border-radius:9999px;background:white;border:1px solid #e5e7eb;font-size:11px;font-weight:600;color:#0f172a;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.15);">${escaparHtml(nome)}</span>
             <div style="width:12px;height:12px;border-radius:9999px;background:#1d4ed8;border:2px solid white;box-shadow:0 0 0 1px #1d4ed8;"></div>
           </div>`,
    iconSize: [0, 0],
  });
}

export function MapaCidade({ pontos }: { pontos: PontoMapa[] }) {
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
    marcadoresRef.current = pontos.map((ponto) =>
      L.marker([ponto.latitude, ponto.longitude], { icon: criarIcone(ponto.nome) }).addTo(map)
    );

    if (pontos.length > 0) {
      const bounds = L.latLngBounds(pontos.map((p) => [p.latitude, p.longitude] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [pontos]);

  return <div ref={containerRef} className="h-[480px] w-full rounded-2xl" />;
}
