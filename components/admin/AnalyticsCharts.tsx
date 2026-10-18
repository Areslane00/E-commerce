"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { TrendingUp, BarChart3, PieChart as PieIcon } from "lucide-react";

interface AnalyticsChartsProps {
  revenueByDay: {
    date: string;
    revenue: number;
    orders_count: number;
  }[];
  topProducts: {
    product_name: string;
    total_sold: number;
    total_revenue: number;
  }[];
  ordersByStatus: {
    status: string;
    count: number;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  "En attente": "#f59e0b", // Amber
  "Confirmée": "#3b82f6", // Blue
  "Expédiée": "#a855f7", // Purple
  "Livrée": "#10b981", // Emerald
  "Annulée": "#f43f5e", // Rose
};

export function AnalyticsCharts({
  revenueByDay,
  topProducts,
  ordersByStatus,
}: AnalyticsChartsProps) {
  const [mounted, setMounted] = useState(false);
  const [revenueRange, setRevenueRange] = useState<"7" | "30">("7");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  // Filter revenue data according to range selection
  const daysLimit = revenueRange === "7" ? 7 : 30;
  const filteredRevenue = revenueByDay.slice(-daysLimit).map((item) => ({
    ...item,
    formattedDate: new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
    }).format(new Date(item.date)),
  }));

  // Top products formatted
  const formattedTopProducts = topProducts.slice(0, 5).map((p) => ({
    name: p.product_name.length > 18 ? p.product_name.slice(0, 18) + "..." : p.product_name,
    ventes: Number(p.total_sold),
    revenu: Number(p.total_revenue),
  }));

  // Filter out status with 0 count for clean pie display
  const pieData = ordersByStatus.filter((s) => s.count > 0);

  return (
    <div className="space-y-6">
      {/* 1. Line Chart : Évolution des revenus */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Chiffre d&apos;affaires Journalier
              </h3>
              <p className="text-[11px] text-zinc-400">
                Revenus générés par les commandes non-annulées
              </p>
            </div>
          </div>

          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setRevenueRange("7")}
              className={`px-3 py-1 rounded-lg transition-all ${
                revenueRange === "7"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              7 derniers jours
            </button>
            <button
              onClick={() => setRevenueRange("30")}
              className={`px-3 py-1 rounded-lg transition-all ${
                revenueRange === "30"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              30 derniers jours
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis
                dataKey="formattedDate"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#888888" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}€`}
                tick={{ fontSize: 11, fill: "#888888" }}
              />
              <Tooltip
                formatter={(value: any) => [formatPrice(value), "Revenus"]}
                labelFormatter={(label) => `Date : ${label}`}
                contentStyle={{
                  backgroundColor: "rgba(24, 24, 27, 0.95)",
                  borderRadius: "12px",
                  border: "none",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: "#10b981" }}
                activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid of 2 charts : Bar Chart & Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. Bar Chart : Top 5 Produits */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Top 5 Produits les Plus Vendus
              </h3>
              <p className="text-[11px] text-zinc-400">
                Classés par volume d&apos;unités commandées
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {formattedTopProducts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                Aucune vente enregistrée pour le moment.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedTopProducts} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#888888" }}
                    width={110}
                  />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      name === "ventes" ? `${value} unités` : formatPrice(value),
                      name === "ventes" ? "Quantité vendue" : "Chiffre d'affaires",
                    ]}
                    contentStyle={{
                      backgroundColor: "rgba(24, 24, 27, 0.95)",
                      borderRadius: "12px",
                      border: "none",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="ventes" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 3. Pie Chart : Commandes par statut */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Commandes par Statut
              </h3>
              <p className="text-[11px] text-zinc-400">
                Répartition des commandes en cours et terminées
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                Aucune commande enregistrée.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status] || "#71717a"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: string) => [`${value} commande(s)`, name]}
                    contentStyle={{
                      backgroundColor: "rgba(24, 24, 27, 0.95)",
                      borderRadius: "12px",
                      border: "none",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val) => <span className="text-xs text-foreground font-medium">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
