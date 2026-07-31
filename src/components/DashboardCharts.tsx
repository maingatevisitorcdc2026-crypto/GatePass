/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { DashboardStats } from '../types';

interface DashboardChartsProps {
  stats: DashboardStats;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#14b8a6', '#ef4444', '#f97316'];

export default function DashboardCharts({ stats }: DashboardChartsProps) {
  const { visitsByArea, visitsByType, visitsByHour } = stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {/* 1. Hour Distribution Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col col-span-1 md:col-span-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">สถิติผู้เข้าติดต่อสะสมรายชั่วโมง </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={visitsByHour} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                labelStyle={{ fontWeight: 'bold', color: '#2563eb' }}
              />
              <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="จำนวนการเข้าพื้นที่" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Area Pie Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">การเข้าติดต่อตามส่วนงาน/พื้นที่</h3>
        <div className="h-64 w-full flex items-center justify-center relative">
          {visitsByArea.length === 0 ? (
            <span className="text-xs text-slate-500 font-mono">ไม่มีข้อมูลการเข้าพื้นที่ในช่วงที่เลือก</span>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={visitsByArea}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {visitsByArea.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}

          {/* Central Summary */}
          {visitsByArea.length > 0 && (
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-slate-100">
                {visitsByArea.reduce((sum, item) => sum + item.value, 0)}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ครั้งทั้งหมด</span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] max-h-24 overflow-y-auto font-medium text-slate-400">
          {visitsByArea.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-1.5 truncate">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="truncate">{entry.name}</span>
              <span className="font-bold text-slate-300 shrink-0">({entry.value})</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Visitor Type Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col col-span-1 md:col-span-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">ประเภทผู้เข้าติดต่อสูงสุด</h3>
        <div className="h-64 w-full">
          {visitsByType.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center">
              <span className="text-xs text-slate-500 font-mono">ไม่มีข้อมูลประเภทผู้ติดต่อในช่วงที่เลือก</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitsByType} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} name="จำนวน">
                  {visitsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
