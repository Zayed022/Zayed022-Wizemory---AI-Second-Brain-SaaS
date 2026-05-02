'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

// ── Demo data — realistic numbers for a pre-revenue SaaS ─────────────────────
const DEMO = {
  users: {
    total: 312, newToday: 8, newWeek: 47, newMonth: 142,
    free: 287, pro: 21, team: 4, paid: 25,
    activeToday: 43, activeWeek: 118, activeMonth: 201,
  },
  revenue: { mrr: 312, arr: 3744, ltv: 288, paidUsers: 25 },
  content:  { totalItems: 4218, itemsWeek: 312 },
  funnel:   { signups: 312, activated: 231, engaged: 118, paid: 25, activationRate: 74, conversionRate: 8, retentionRate: 64 },
  valuation: { conservative: 52000, optimistic: 180000, assetBased: 75000, recommended: 75000 },
  weeklySignups: [
    { week: 'W1', count: 12 }, { week: 'W2', count: 18 }, { week: 'W3', count: 23 },
    { week: 'W4', count: 31 }, { week: 'W5', count: 38 }, { week: 'W6', count: 44 },
    { week: 'W7', count: 51 }, { week: 'W8', count: 47 },
  ],
  dailyActive: [28, 35, 31, 43, 38, 52, 43, 41, 38, 45, 49, 53, 47, 43],
  topFeatures: [
    { name: 'AI Summarisation', uses: 1847, pct: 100 },
    { name: 'AI Q&A',           uses: 934,  pct: 51  },
    { name: 'Knowledge Graph',  uses: 621,  pct: 34  },
    { name: 'AI Agent',         uses: 289,  pct: 16  },
    { name: 'Spaced Repetition',uses: 412,  pct: 22  },
    { name: 'Data Export',      uses: 87,   pct: 5   },
  ],
  recentActivity: [
    { event: 'New Pro signup',     time: '4 min ago',  plan: 'PRO',  value: '$12/mo' },
    { event: 'New free signup',    time: '11 min ago', plan: 'FREE', value: '—' },
    { event: 'Item processed',     time: '14 min ago', plan: 'FREE', value: '—' },
    { event: 'New Pro signup',     time: '28 min ago', plan: 'PRO',  value: '$12/mo' },
    { event: 'Knowledge graph viewed', time: '35 min ago', plan: 'PRO', value: '—' },
    { event: 'New free signup',    time: '52 min ago', plan: 'FREE', value: '—' },
    { event: 'AI agent run',       time: '1h ago',     plan: 'PRO',  value: '—' },
    { event: 'New Team signup',    time: '2h ago',     plan: 'TEAM', value: '$49/mo' },
  ],
}

function fmt(n: number)  { return n >= 1000 ? `$${(n/1000).toFixed(1)}K` : `$${n}` }
function fmtN(n: number) { return n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n) }

const PLAN_DOT: Record<string, string> = {
  PRO: 'bg-violet-500', FREE: 'bg-ink-300', TEAM: 'bg-emerald-500'
}

// ── Chart drawing ─────────────────────────────────────────────────────────────
function drawCharts(data: typeof DEMO) {
  const C = (window as any).Chart
  if (!C) return

  // Destroy existing
  ;['chart-signups', 'chart-mrr', 'chart-dau', 'chart-funnel'].forEach(id => {
    const el = document.getElementById(id) as HTMLCanvasElement
    if (el) { const ex = C.getChart(el); if (ex) ex.destroy() }
  })

  const gridColor = '#f1f5f9'
  const tickColor = '#94a3b8'
  const baseOpts  = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  }

  // Weekly signups line chart
  const s = document.getElementById('chart-signups') as HTMLCanvasElement
  if (s) new C(s, {
    type: 'line',
    data: {
      labels:   data.weeklySignups.map(w => w.week),
      datasets: [{
        data:            data.weeklySignups.map(w => w.count),
        borderColor:     '#4f63f5',
        backgroundColor: '#4f63f510',
        borderWidth: 2.5, fill: true, tension: 0.4,
        pointRadius: 4, pointBackgroundColor: '#4f63f5', pointBorderColor: '#fff', pointBorderWidth: 2,
      }],
    },
    options: { ...baseOpts, scales: {
      x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } },
      y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } }, beginAtZero: true },
    }},
  })

  // MRR projection bar chart
  const r = document.getElementById('chart-mrr') as HTMLCanvasElement
  if (r) {
    const base = data.revenue.mrr
    const proj = Array.from({ length: 12 }, (_, i) => Math.round(base * Math.pow(1.12, i)))
    new C(r, {
      type: 'bar',
      data: {
        labels:   ['M1','M2','M3','M4','M5','M6','M7','M8','M9','M10','M11','M12'],
        datasets: [{
          data: proj,
          backgroundColor: proj.map((_, i) => i < 2 ? '#4f63f520' : '#4f63f540'),
          borderColor:     '#4f63f5', borderWidth: 1, borderRadius: 4,
        }],
      },
      options: { ...baseOpts, scales: {
        x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 9 } } },
        y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 9 }, callback: (v: number) => `$${v >= 1000 ? (v/1000).toFixed(0)+'K' : v}` }, beginAtZero: true },
      }},
    })
  }

  // Daily active users
  const d = document.getElementById('chart-dau') as HTMLCanvasElement
  if (d) new C(d, {
    type: 'line',
    data: {
      labels:   data.dailyActive.map((_, i) => `D${i+1}`),
      datasets: [{
        data:            data.dailyActive,
        borderColor:     '#1D9E75',
        backgroundColor: '#1D9E7510',
        borderWidth: 2, fill: true, tension: 0.4,
        pointRadius: 3, pointBackgroundColor: '#1D9E75',
      }],
    },
    options: { ...baseOpts, scales: {
      x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 9 } } },
      y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 9 } }, beginAtZero: true },
    }},
  })

  // Funnel horizontal bars
  const f = document.getElementById('chart-funnel') as HTMLCanvasElement
  if (f) new C(f, {
    type: 'bar',
    data: {
      labels:   ['Signups', 'Activated', 'Engaged', 'Paid'],
      datasets: [{
        data:            [data.funnel.signups, data.funnel.activated, data.funnel.engaged, data.funnel.paid],
        backgroundColor: ['#4f63f540', '#4f63f560', '#4f63f580', '#4f63f5'],
        borderColor:     '#4f63f5', borderWidth: 1, borderRadius: 6,
      }],
    },
    options: {
      ...baseOpts,
      indexAxis: 'y' as const,
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 9 } } },
        y: { grid: { display: false },   ticks: { color: tickColor, font: { size: 10, weight: '500' as any } } },
      },
    },
  })
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FounderPage() {
  const [data, setData]         = useState<typeof DEMO>(DEMO)
  const [isDemo, setIsDemo]     = useState(true)
  const [secret, setSecret]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [activeTab, setActiveTab] = useState<'overview'|'growth'|'revenue'|'features'|'activity'>('overview')
  const chartsDrawn             = useRef(false)

  // Load Chart.js and draw
  useEffect(() => {
    chartsDrawn.current = false
    const load = () => {
      if (!(window as any).Chart) {
        const s   = document.createElement('script')
        s.src     = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
        s.onload  = () => { chartsDrawn.current = true; drawCharts(data) }
        document.head.appendChild(s)
      } else {
        chartsDrawn.current = true; drawCharts(data)
      }
    }
    // Small delay so DOM is ready
    const t = setTimeout(load, 100)
    return () => clearTimeout(t)
  }, [data, activeTab])

  async function loadReal() {
    if (!secret) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin', { headers: { 'x-admin-secret': secret } })
      if (res.ok) {
        const real = await res.json()
        setData({ ...DEMO, ...real })
        setIsDemo(false)
        chartsDrawn.current = false
      } else {
        alert('Invalid admin secret')
      }
    } catch { alert('Could not connect to server') }
    finally { setLoading(false) }
  }

  const tabs = [
    { id: 'overview',  label: 'Overview' },
    { id: 'growth',    label: 'Growth' },
    { id: 'revenue',   label: 'Revenue' },
    { id: 'features',  label: 'Feature usage' },
    { id: 'activity',  label: 'Live activity' },
  ] as const

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-display text-xl text-slate-900">
              Wize<span className="text-violet-500">Mory</span>
            </Link>
            <span className="text-slate-300">·</span>
            <span className="text-sm text-slate-500 font-medium">Founder dashboard</span>
            {isDemo && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium border border-amber-200">
                Demo data
              </span>
            )}
            {!isDemo && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium border border-emerald-200">
                ✓ Live data
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input value={secret} onChange={e => setSecret(e.target.value)}
              type="password" placeholder="Admin secret"
              onKeyDown={e => { if (e.key === 'Enter') loadReal() }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-violet-400 w-36" />
            <button onClick={loadReal} disabled={loading || !secret}
              className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 disabled:opacity-50 transition-colors">
              {loading ? '…' : 'Load real data'}
            </button>
            <Link href="/demo" className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition-colors">
              Demo →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Valuation banner */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="text-xs text-violet-200 uppercase tracking-widest font-medium mb-4">
            Estimated acquisition value
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold mb-1">{fmt(data.valuation.conservative)}</div>
              <div className="text-sm text-violet-200">Conservative · 3× ARR</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-300 mb-1">{fmt(data.valuation.recommended)}</div>
              <div className="text-sm text-violet-200">Recommended ask</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">{fmt(data.valuation.optimistic)}</div>
              <div className="text-sm text-violet-200">Optimistic · 8× ARR + asset</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-violet-500/30 text-xs text-violet-300">
            Based on {fmt(data.revenue.arr)} ARR · {data.users.paid} paid users · {data.funnel.activationRate}% activation · {fmt(data.valuation.assetBased)} asset floor · $0/mo infrastructure
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total users',   value: fmtN(data.users.total),        sub: `+${data.users.newWeek} this week`,         color: 'text-violet-600', bg: 'bg-violet-50',  icon: '👥' },
            { label: 'MRR',           value: fmt(data.revenue.mrr),          sub: `${fmt(data.revenue.arr)} ARR`,             color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '💰' },
            { label: 'Paid users',    value: fmtN(data.users.paid),          sub: `${data.funnel.conversionRate}% conversion`, color: 'text-blue-600',   bg: 'bg-blue-50',    icon: '✓' },
            { label: 'Monthly active',value: fmtN(data.users.activeMonth),   sub: `${data.funnel.retentionRate}% retention`,  color: 'text-amber-600',  bg: 'bg-amber-50',   icon: '📈' },
          ].map(m => (
            <div key={m.label} className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{m.label}</span>
                <div className={`w-8 h-8 ${m.bg} rounded-lg flex items-center justify-center text-sm`}>{m.icon}</div>
              </div>
              <div className={`text-2xl font-bold ${m.color} mb-1`}>{m.value}</div>
              <div className="text-xs text-slate-400">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.id ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            {/* Signup trend */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-800">Weekly signups</h3>
                  <p className="text-xs text-slate-400">Last 8 weeks</p>
                </div>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                  ↑ {Math.round(((DEMO.weeklySignups[7].count - DEMO.weeklySignups[0].count) / DEMO.weeklySignups[0].count) * 100)}% growth
                </span>
              </div>
              <div style={{ height: '180px', position: 'relative' }}>
                <canvas id="chart-signups" />
              </div>
            </div>

            {/* Funnel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-800">Conversion funnel</h3>
                <p className="text-xs text-slate-400">{data.funnel.conversionRate}% free → paid</p>
              </div>
              <div style={{ height: '180px', position: 'relative' }}>
                <canvas id="chart-funnel" />
              </div>
            </div>

            {/* Plan breakdown */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Plan breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: 'Free users',  n: data.users.free,  color: '#94a3b8', pct: Math.round((data.users.free  / data.users.total) * 100) },
                  { label: 'Pro users',   n: data.users.pro,   color: '#4f63f5', pct: Math.round((data.users.pro   / data.users.total) * 100) },
                  { label: 'Team users',  n: data.users.team,  color: '#1D9E75', pct: Math.round((data.users.team  / data.users.total) * 100) },
                ].map(p => (
                  <div key={p.label}>
                    <div className="flex justify-between text-sm text-slate-600 mb-1.5">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        {p.label}
                      </span>
                      <span className="font-medium">{p.n} <span className="text-slate-400 font-normal">({p.pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${p.pct}%`, background: p.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Why acquirers buy */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Why acquirers buy WizeMory</h3>
              <div className="space-y-3">
                {[
                  { icon: '🔒', t: '$0/mo infrastructure',   d: 'Gemini free + Supabase free + Vercel free. 99%+ gross margin.' },
                  { icon: '⚡', t: 'Agentic AI loop',        d: 'Gemini function calling — rare capability, hard to replicate.' },
                  { icon: '📈', t: 'Built-in viral loop',    d: 'Referral system + share cards = $0 CAC.' },
                  { icon: '🏢', t: 'B2B upside untouched',   d: 'Team plan at $49/user — one 10-person team = $490/mo MRR.' },
                ].map(r => (
                  <div key={r.t} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    <span className="text-lg">{r.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-slate-800">{r.t}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{r.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'growth' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-800">Weekly signups</h3>
                  <p className="text-xs text-slate-400">8-week trend</p>
                </div>
                <span className="text-sm font-bold text-violet-600">+{data.users.newWeek} this week</span>
              </div>
              <div style={{ height: '220px', position: 'relative' }}>
                <canvas id="chart-signups" />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-800">Daily active users</h3>
                  <p className="text-xs text-slate-400">Last 14 days</p>
                </div>
                <span className="text-sm font-bold text-emerald-600">{data.users.activeToday} today</span>
              </div>
              <div style={{ height: '220px', position: 'relative' }}>
                <canvas id="chart-dau" />
              </div>
            </div>
            <div className="col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Growth statistics</h3>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'New users today',  value: data.users.newToday },
                  { label: 'New this week',     value: data.users.newWeek },
                  { label: 'New this month',    value: data.users.newMonth },
                  { label: 'Total registered',  value: data.users.total },
                  { label: 'Active today',      value: data.users.activeToday },
                  { label: 'Active this week',  value: data.users.activeWeek },
                  { label: 'Active this month', value: data.users.activeMonth },
                  { label: 'Activation rate',   value: `${data.funnel.activationRate}%` },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className="text-xl font-bold text-slate-800">{s.value}</div>
                    <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-800">12-month MRR projection</h3>
                <p className="text-xs text-slate-400">Assuming 12% monthly growth from current baseline</p>
              </div>
              <div style={{ height: '220px', position: 'relative' }}>
                <canvas id="chart-mrr" />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Unit economics</h3>
              <div className="space-y-3">
                {[
                  { label: 'Current MRR',         value: fmt(data.revenue.mrr) },
                  { label: 'Current ARR',          value: fmt(data.revenue.arr) },
                  { label: 'Avg LTV (Pro)',         value: fmt(data.revenue.ltv) },
                  { label: 'Infrastructure cost',  value: '~$0/month' },
                  { label: 'Gross margin',         value: '99%+' },
                  { label: 'Customer count',       value: String(data.users.paid) },
                  { label: 'ARPU',                 value: fmt(Math.round(data.revenue.mrr / (data.users.paid || 1))) + '/mo' },
                  { label: 'Conversion rate',      value: `${data.funnel.conversionRate}%` },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                    <span className="text-sm text-slate-600">{r.label}</span>
                    <span className="text-sm font-semibold text-slate-900">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Revenue scenarios</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 text-xs uppercase tracking-wide border-b border-slate-100">
                      <th className="text-left pb-3">Pro subscribers</th>
                      <th className="text-right pb-3">MRR</th>
                      <th className="text-right pb-3">ARR</th>
                      <th className="text-right pb-3">Infra cost</th>
                      <th className="text-right pb-3">Gross margin</th>
                      <th className="text-right pb-3">3× valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[
                      [100,   1200,   14400,   '<$1',   '99.9%', '$43K'  ],
                      [250,   3000,   36000,   '<$2',   '99.9%', '$108K' ],
                      [500,   6000,   72000,   '~$5',   '99.9%', '$216K' ],
                      [1000,  12000,  144000,  '~$10',  '99.9%', '$432K' ],
                      [5000,  60000,  720000,  '~$50',  '99.9%', '$2.16M'],
                    ].map(([users, mrr, arr, infra, margin, val]) => (
                      <tr key={String(users)} className={users === 250 ? 'bg-violet-50 font-medium' : ''}>
                        <td className="py-3 text-slate-700">{users.toLocaleString()}</td>
                        <td className="py-3 text-right text-slate-700">${(mrr as number).toLocaleString()}</td>
                        <td className="py-3 text-right text-slate-700">${(arr as number).toLocaleString()}</td>
                        <td className="py-3 text-right text-slate-500">{infra as string}/mo</td>
                        <td className="py-3 text-right text-emerald-600">{margin as string}</td>
                        <td className="py-3 text-right font-semibold text-violet-600">{val as string}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 mt-3">* Highlighted row: near-term realistic target for an active operator with distribution</p>
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-slate-800">Feature usage breakdown</h3>
                <p className="text-xs text-slate-400">Total interactions across all {fmtN(data.content.totalItems)} items processed</p>
              </div>
              <div className="text-sm text-slate-500">
                <span className="font-semibold text-slate-800">{fmtN(data.content.totalItems)}</span> total items processed
              </div>
            </div>
            <div className="space-y-4">
              {data.topFeatures.map(f => (
                <div key={f.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-slate-700">{f.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{f.uses.toLocaleString()} uses</span>
                      <span className="text-sm font-semibold text-slate-800 w-10 text-right">{f.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${f.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-5 border-t border-slate-100 grid grid-cols-3 gap-4">
              {[
                { label: 'Items processed',  value: fmtN(data.content.totalItems), sub: 'total across all users' },
                { label: 'Items this week',  value: fmtN(data.content.itemsWeek),  sub: 'in the last 7 days' },
                { label: 'Avg per user',     value: (data.content.totalItems / data.users.activeMonth).toFixed(1), sub: 'items per monthly active user' },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-slate-800">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                  <div className="text-[10px] text-slate-400">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">Live activity feed</h3>
                  <p className="text-xs text-slate-400">Recent user events</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {data.recentActivity.map((a, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${PLAN_DOT[a.plan] ?? 'bg-slate-300'}`} />
                    <div className="flex-1">
                      <span className="text-sm text-slate-700">{a.event}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      a.plan === 'PRO'  ? 'bg-violet-100 text-violet-700' :
                      a.plan === 'TEAM' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>{a.plan}</span>
                    {a.value !== '—' && <span className="text-xs font-semibold text-emerald-600">{a.value}</span>}
                    <span className="text-xs text-slate-400 shrink-0">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h3 className="font-semibold text-slate-800 mb-3">Right now</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Active sessions',  value: data.users.activeToday,             icon: '👥' },
                    { label: 'Items processing', value: 3,                                   icon: '⚡' },
                    { label: 'AI queries today', value: Math.round(data.users.activeToday * 2.3), icon: '🧠' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span>{s.icon}</span>
                        <span className="text-sm text-slate-600">{s.label}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-800">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h3 className="font-semibold text-slate-800 mb-3">This week</h3>
                <div className="space-y-2">
                  {[
                    { label: 'New signups',    value: data.users.newWeek },
                    { label: 'Items saved',    value: data.content.itemsWeek },
                    { label: 'Pro upgrades',   value: 4 },
                    { label: 'Revenue added',  value: '$48' },
                  ].map(s => (
                    <div key={s.label} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0 text-sm">
                      <span className="text-slate-500">{s.label}</span>
                      <span className="font-semibold text-slate-800">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-5 text-white">
                <div className="text-xs text-violet-200 uppercase tracking-wide mb-2">Recommended ask</div>
                <div className="text-3xl font-bold mb-1">{fmt(data.valuation.recommended)}</div>
                <div className="text-xs text-violet-200">Asset value + early traction premium</div>
                <Link href="/pricing" className="mt-4 block text-center py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors">
                  View pricing →
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
