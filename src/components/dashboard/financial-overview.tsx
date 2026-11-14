"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  Package,
  PiggyBank,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import { mockInventory, calculateInventoryFinancials } from "@/lib/mock-data";
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";

// Calculate margins by category
function getCategoryBreakdown() {
  const categories: Record<string, { cost: number; retail: number; quantity: number }> = {};

  mockInventory.forEach((item) => {
    const cat = item.category || "Other";
    if (!categories[cat]) {
      categories[cat] = { cost: 0, retail: 0, quantity: 0 };
    }
    categories[cat].cost += (item.costPrice || 0) * item.quantity;
    categories[cat].retail += (item.unitPrice || 0) * item.quantity;
    categories[cat].quantity += item.quantity;
  });

  return Object.entries(categories).map(([name, data]) => ({
    name,
    cost: data.cost,
    retail: data.retail,
    profit: data.retail - data.cost,
    margin: data.retail > 0 ? ((data.retail - data.cost) / data.retail) * 100 : 0,
    quantity: data.quantity,
  })).sort((a, b) => b.profit - a.profit);
}

const COLORS = [
  "hsl(142.1 76.2% 36.3%)", // emerald
  "hsl(221.2 83.2% 53.3%)", // blue
  "hsl(262.1 83.3% 57.8%)", // purple
  "hsl(24.6 95% 53.1%)",    // orange
  "hsl(346.8 77.2% 49.8%)", // red
];

interface FinancialOverviewProps {
  showDetailedView?: boolean;
}

export function FinancialOverview({ showDetailedView = true }: FinancialOverviewProps) {
  const financials = calculateInventoryFinancials();
  const categoryData = getCategoryBreakdown();

  // Mock monthly revenue data
  const monthlyRevenue = 68000;
  const monthlyCosts = 28500;
  const monthlyProfit = monthlyRevenue - monthlyCosts;
  const profitMargin = (monthlyProfit / monthlyRevenue) * 100;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold">Financial Overview</CardTitle>
            <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0">
              {profitMargin.toFixed(0)}% margin
            </Badge>
          </div>
          <CardDescription>Revenue, costs, and profit margins</CardDescription>
        </div>
        <Wallet className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {/* Key Financial Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              Monthly Revenue
            </div>
            <p className="text-2xl font-bold">${monthlyRevenue.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-xs text-emerald-500">+9.7% vs last month</span>
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <PiggyBank className="h-4 w-4" />
              Monthly Profit
            </div>
            <p className="text-2xl font-bold text-emerald-500">${monthlyProfit.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">After ${monthlyCosts.toLocaleString()} costs</span>
            </div>
          </div>
        </div>

        {/* Inventory Value Summary */}
        <div className="rounded-lg bg-muted/50 p-4 mb-6">
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <Package className="h-4 w-4" />
            Inventory Value Breakdown
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Cost (what you paid)</span>
              <span className="font-medium">${financials.totalCostValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Retail Value</span>
              <span className="font-medium">${financials.totalRetailValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-sm font-medium">Potential Profit</span>
              <span className="font-bold text-emerald-500">${financials.totalPotentialProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <Progress
              value={financials.averageMargin}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground text-center">
              Average margin: {financials.averageMargin.toFixed(1)}%
            </p>
          </div>
        </div>

        {showDetailedView && (
          <>
            {/* Profit by Category */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                Profit by Category
              </div>
              <ChartContainer
                config={{
                  profit: {
                    label: "Profit",
                    color: "hsl(142.1 76.2% 36.3%)",
                  },
                }}
                className="h-[160px] w-full"
              >
                <BarChart data={categoryData} layout="vertical">
                  <XAxis type="number" tickFormatter={(v) => `$${v / 1000}k`} fontSize={11} />
                  <YAxis type="category" dataKey="name" width={90} fontSize={11} />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-3">
                          <p className="text-sm font-medium text-slate-300">{data.name}</p>
                          <p className="text-lg font-bold text-emerald-400">
                            ${data.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })} profit
                          </p>
                          <p className="text-xs text-slate-400">
                            {data.margin.toFixed(0)}% margin • {data.quantity} units
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>

            {/* Category Details */}
            <div className="space-y-2 mt-4">
              {categoryData.map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <div>
                      <p className="text-sm font-medium">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">{cat.quantity} units</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-emerald-500">
                      ${cat.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground">{cat.margin.toFixed(0)}% margin</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
