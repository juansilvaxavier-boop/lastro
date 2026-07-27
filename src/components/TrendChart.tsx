"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChartLegend, type SerieChart } from "./ui/ChartLegend";

export interface PontoSerie {
  data: string; // ISO
  [serie: string]: number | string;
}

export function TrendChart({
  titulo,
  series,
  dados,
  altura = 260,
}: {
  titulo: string;
  series: SerieChart[];
  dados: PontoSerie[];
  altura?: number;
}) {
  return (
    <div>
      <h3 className="mb-1 text-xl font-bold text-slate-900">{titulo}</h3>
      <ChartLegend series={series} />
      <ResponsiveContainer width="100%" height={altura}>
        <LineChart data={dados} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="data"
            tickFormatter={(v: string) => format(new Date(v), "MMM. 'de' yyyy", { locale: ptBR })}
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip
            labelFormatter={(v) => format(new Date(String(v)), "MMM. 'de' yyyy", { locale: ptBR })}
            contentStyle={{ borderRadius: 12, borderColor: "#e5e7eb" }}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 4, fill: s.color, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
