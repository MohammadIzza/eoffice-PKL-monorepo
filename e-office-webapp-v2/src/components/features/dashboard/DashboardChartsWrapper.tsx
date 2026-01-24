'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface DashboardChartsWrapperProps {
  chartData: Array<{ date: string; count: number }>;
  pieData: Array<{ name: string; value: number; color: string }>;
}

export function DashboardChartsWrapper({ chartData, pieData }: DashboardChartsWrapperProps) {
  return (
    <div className="grid lg:grid-cols-12 gap-4 mb-8 animate-slide-up">
      {/* Bar Chart */}
      <Card className="lg:col-span-8 border border-[rgba(0,0,0,0.08)] shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardHeader className="border-b border-[rgba(0,0,0,0.08)] pb-5 px-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2 mb-1.5 tracking-tight text-[#1D1D1F]">
                <TrendingUp className="w-5 h-5 text-[#0071E3]" />
                Tren Pengajuan 7 Hari Terakhir
              </CardTitle>
              <CardDescription className="text-sm text-[#86868B]">
                Jumlah surat yang diajukan per hari
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 px-6 pb-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#86868B' }}
                stroke="rgba(0,0,0,0.1)"
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#86868B' }}
                stroke="rgba(0,0,0,0.1)"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  padding: '12px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
                }}
                labelStyle={{ fontWeight: 600, marginBottom: '4px', color: '#1D1D1F' }}
              />
              <Bar 
                dataKey="count" 
                fill="#0071E3"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card className="lg:col-span-4 border border-[rgba(0,0,0,0.08)] shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardHeader className="border-b border-[rgba(0,0,0,0.08)] pb-5 px-6 pt-6">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 mb-1.5 tracking-tight text-[#1D1D1F]">
            <BarChart3 className="w-5 h-5 text-[#0071E3]" />
            Distribusi Status
          </CardTitle>
          <CardDescription className="text-sm text-[#86868B]">
            Persentase surat berdasarkan status
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 px-6 pb-6">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) => `${(((percent ?? 0) * 100)).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    padding: '12px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '16px' }}
                  iconType="circle"
                  layout="vertical"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-[#86868B] text-sm">
              Belum ada data
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
