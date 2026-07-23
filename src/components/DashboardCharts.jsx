import React, { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

export default function DashboardCharts({ employees, getGenderName, leaveRequests = [], holidays = [] }) {
  // Chart toggle states
  const [managerChartType, setManagerChartType] = useState("bar"); // "bar" or "pie"
  const [roleChartType, setRoleChartType] = useState("line"); // "line" or "bar"

  // 1. Gender Data for Pie Chart
  const genderData = useMemo(() => {
    const counts = {};
    employees.forEach((emp) => {
      const gender = getGenderName(emp.genderId) || "Unknown";
      counts[gender] = (counts[gender] || 0) + 1;
    });
    return Object.keys(counts).map((key) => ({
      name: key,
      value: counts[key],
    }));
  }, [employees, getGenderName]);

  // 2. Manager Data
  const managerData = useMemo(() => {
    const counts = {};
    employees.forEach((emp) => {
      const manager = emp.managerName || "Executive";
      counts[manager] = (counts[manager] || 0) + 1;
    });
    return Object.keys(counts)
      .map((key) => ({ name: key, value: counts[key] }))
      .sort((a, b) => b.value - a.value);
  }, [employees]);

  // 3. Role/Title Data
  const roleData = useMemo(() => {
    const counts = {};
    employees.forEach((emp) => {
      const title = emp.title || "No Title";
      counts[title] = (counts[title] || 0) + 1;
    });
    return Object.keys(counts)
      .map((key) => ({ name: key, value: counts[key] }))
      .sort((a, b) => b.value - a.value);
  }, [employees]);

  // 4. Age Demographics Data
  const ageData = useMemo(() => {
    const buckets = {
      "20-25": 0,
      "26-30": 0,
      "31-40": 0,
      "41+": 0,
      "Unknown": 0,
    };
    const currentYear = new Date().getFullYear();

    employees.forEach((emp) => {
      if (!emp.dob) {
        buckets["Unknown"]++;
        return;
      }
      const dobYear = new Date(emp.dob).getFullYear();
      const age = currentYear - dobYear;

      if (age >= 20 && age <= 25) buckets["20-25"]++;
      else if (age >= 26 && age <= 30) buckets["26-30"]++;
      else if (age >= 31 && age <= 40) buckets["31-40"]++;
      else if (age > 40) buckets["41+"]++;
      else buckets["Unknown"]++;
    });

    return Object.keys(buckets).map((key) => ({
      name: key,
      value: buckets[key],
    }));
  }, [employees]);

  // 5. Leaves Data (Sum of total days by leave type)
  const leavesData = useMemo(() => {
    const counts = {};
    if (leaveRequests && leaveRequests.length > 0) {
      leaveRequests.forEach((req) => {
        const type = req.leaveType || "Unknown";
        counts[type] = (counts[type] || 0) + (req.totalDays || 1);
      });
    }
    return Object.keys(counts)
      .map((key) => ({ name: key, value: counts[key] }))
      .sort((a, b) => b.value - a.value);
  }, [leaveRequests]);

  // Colors for charts
  const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f43f5e", "#f59e0b", "#14b8a6", "#ec4899"];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-xl text-sm z-50">
          <p className="font-semibold text-slate-900 dark:text-white mb-1">{label || payload[0].name}</p>
          <p className="text-blue-600 dark:text-blue-400">
            {payload[0].value} {payload[0].value === 1 ? "Employee" : "Employees"}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!employees || employees.length === 0) {
    return null;
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8 transition-all duration-300">
      
      {/* 1. Manager Distribution with Toggle */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl group hover:border-emerald-300 dark:hover:border-emerald-900/50 transition-all duration-300 flex flex-col h-64">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Manager Spread</h3>
          <button onClick={() => setManagerChartType(managerChartType === "bar" ? "pie" : "bar")} className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition">
            Toggle
          </button>
        </div>
        <div className="flex-1 min-h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            {managerChartType === "bar" ? (
              <BarChart data={managerData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} angle={-35} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {managerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Pie data={managerData} cx="50%" cy="50%" outerRadius={60} dataKey="value" stroke="none">
                  {managerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Roles Distribution with Toggle */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl group hover:border-violet-300 dark:hover:border-violet-900/50 transition-all duration-300 flex flex-col h-64">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Roles Distribution</h3>
          <button onClick={() => setRoleChartType(roleChartType === "line" ? "bar" : "line")} className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition">
            Toggle
          </button>
        </div>
        <div className="flex-1 min-h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            {roleChartType === "line" ? (
              <LineChart data={roleData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} angle={-35} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
              </LineChart>
            ) : (
              <BarChart data={roleData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} angle={-35} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Leaves by Type */}
      {leavesData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl group hover:border-orange-300 dark:hover:border-orange-900/50 transition-all duration-300 flex flex-col h-64 xl:col-span-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Leave Types</h3>
          <div className="flex-1 min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={leavesData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value" stroke="none">
                  {leavesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. Age Demographics */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl group hover:border-rose-300 dark:hover:border-rose-900/50 transition-all duration-300 flex flex-col h-64">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Age Demographics</h3>
        <div className="flex-1 min-h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} angle={-35} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
              <Bar dataKey="value" fill="#f43f5e" radius={[4, 4, 0, 0]}>
                {ageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Gender Distribution */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl group hover:border-blue-300 dark:hover:border-blue-900/50 transition-all duration-300 flex flex-col h-64">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Gender Distribution</h3>
        <div className="flex-1 min-h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value" stroke="none">
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </section>
  );
}
