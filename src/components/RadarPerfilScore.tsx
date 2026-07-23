"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

interface Props {
  scoreValorizacao: number;
  scoreRenda: number;
  penalidadeLiquidez: number;
  penalidadeRisco: number;
  penalidadeOrcamento: number;
  scoreEncaixe: number;
}

export function RadarPerfilScore({
  scoreValorizacao,
  scoreRenda,
  penalidadeLiquidez,
  penalidadeRisco,
  penalidadeOrcamento,
  scoreEncaixe,
}: Props) {
  const dados = [
    { eixo: "Valorização", valor: scoreValorizacao },
    { eixo: "Renda", valor: scoreRenda },
    { eixo: "Liquidez", valor: Math.max(0, 100 - penalidadeLiquidez * 4) },
    { eixo: "Risco", valor: Math.max(0, 100 - penalidadeRisco * 4) },
    { eixo: "Orçamento", valor: Math.max(0, 100 - penalidadeOrcamento * 3) },
    { eixo: "Encaixe", valor: scoreEncaixe },
  ];

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={dados} outerRadius="75%">
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="eixo" tick={{ fontSize: 12, fill: "#475569" }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} />
          <Radar name="Encaixe com seu perfil" dataKey="valor" stroke="#0f172a" fill="#0f172a" fillOpacity={0.25} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
