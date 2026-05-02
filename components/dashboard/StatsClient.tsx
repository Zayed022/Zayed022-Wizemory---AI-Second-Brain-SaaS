'use client'
import { useEffect, useState } from 'react'

export default function StatsClient({ userName, memberSince }: { userName: string; memberSince: string }) {
  const [data, setData]   = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!data) return
    drawCharts(data)
  }, [data])

  if (loading) return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      {[1,2,3].map(i => <div key={i} className="h-32 skeleton rounded-2xl" />)}
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink-900">Your knowledge stats</h1>
        <p className="text-ink-400 text-sm mt-1">
          Member since {new Date(memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Hero metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Items saved',      value: data?.total ?? 0,         suffix: '',   icon: '⊞', color: '#7340f5' },
          { label: 'Hours saved',      value: data?.hoursSaved ?? 0,    suffix: 'h',  icon: '⏱', color: '#1D9E75' },
          { label: 'Learning streak',  value: data?.streak ?? 0,        suffix: ' 🔥',icon: '',  color: '#f59e0b' },
          { label: 'Knowledge score',  value: data?.knowledgeScore ?? 0,suffix: '',   icon: '✦', color: '#3b82f6' },
        ].map(m => (
          <div key={m.label} className="bg-white border border-ink-100 rounded-2xl p-5">
            <div className="text-xs text-ink-400 uppercase tracking-wide font-medium mb-2">{m.label}</div>
            <div className="font-display text-4xl" style={{ color: m.color }}>
              {m.value}{m.suffix}
            </div>
          </div>
        ))}
      </div>

      {/* Weekly growth chart */}
      <div className="bg-white border border-ink-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-ink-900">Knowledge growth</h2>
          <span className="text-xs text-ink-400">Last 8 weeks</span>
        </div>
        <div style={{ position: 'relative', height: '200px' }}>
          <canvas id="growth-chart" role="img" aria-label="Weekly knowledge growth chart">
            Weekly items saved over the last 8 weeks.
          </canvas>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Type breakdown */}
        <div className="bg-white border border-ink-100 rounded-2xl p-5">
          <h2 className="font-medium text-ink-900 mb-4">Content types</h2>
          <div style={{ position: 'relative', height: '180px' }}>
            <canvas id="type-chart" role="img" aria-label="Breakdown of saved content by type">
              Content type distribution across saved items.
            </canvas>
          </div>
        </div>

        {/* Top topics */}
        <div className="bg-white border border-ink-100 rounded-2xl p-5">
          <h2 className="font-medium text-ink-900 mb-4">Top topics</h2>
          <div className="space-y-2.5">
            {(data?.topTopics ?? []).slice(0, 6).map((t: any, i: number) => {
              const max = data?.topTopics?.[0]?.count ?? 1
              return (
                <div key={t.topic} className="flex items-center gap-3">
                  <span className="text-xs text-ink-400 w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-ink-700">{t.topic}</span>
                      <span className="text-ink-400">{t.count}</span>
                    </div>
                    <div className="h-1.5 bg-ink-100 rounded-full">
                      <div className="h-full rounded-full bg-violet-400 transition-all"
                        style={{ width: `${(t.count / max) * 100}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Achievement cards */}
      <div className="bg-white border border-ink-100 rounded-2xl p-5">
        <h2 className="font-medium text-ink-900 mb-4">Achievements</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: '🗺️', label: 'Explorer',    desc: 'Saved 10 items',    earned: (data?.total ?? 0) >= 10  },
            { icon: '📚', label: 'Scholar',     desc: 'Saved 50 items',    earned: (data?.total ?? 0) >= 50  },
            { icon: '🏛️', label: 'Curator',     desc: 'Saved 100 items',   earned: (data?.total ?? 0) >= 100 },
            { icon: '🔥', label: '7-day streak',desc: '7 days in a row',   earned: (data?.streak ?? 0) >= 7  },
            { icon: '⚡', label: 'Powerhouse',  desc: '30-day streak',     earned: (data?.streak ?? 0) >= 30 },
            { icon: '🧠', label: 'Brain Master', desc: 'Score 500+',       earned: (data?.knowledgeScore ?? 0) >= 500 },
            { icon: '🎯', label: 'Focused',     desc: '5+ topics',         earned: (data?.topTopics?.length ?? 0) >= 5 },
            { icon: '🌟', label: 'Pro',         desc: 'Upgraded to Pro',   earned: data?.plan !== 'FREE' },
          ].map(a => (
            <div key={a.label} className={`rounded-xl p-3 text-center border transition-all ${a.earned ? 'bg-violet-50 border-violet-100' : 'bg-ink-50 border-transparent opacity-40 grayscale'}`}>
              <div className="text-2xl mb-1">{a.icon}</div>
              <div className="text-xs font-medium text-ink-800">{a.label}</div>
              <div className="text-[10px] text-ink-400 mt-0.5">{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function drawCharts(data: any) {
  if (!(window as any).Chart) {
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
    s.onload = () => actuallyDraw(data)
    document.head.appendChild(s)
  } else {
    actuallyDraw(data)
  }
}

function actuallyDraw(data: any) {
  const C = (window as any).Chart
  if (!C) return

  // Destroy existing
  ;['growth-chart','type-chart'].forEach(id => {
    const el = document.getElementById(id) as HTMLCanvasElement
    if (el) { const ex = C.getChart(el); if (ex) ex.destroy() }
  })

  // Growth chart
  const g = document.getElementById('growth-chart') as HTMLCanvasElement
  if (g && data.weeklyGrowth) {
    new C(g, {
      type: 'bar',
      data: {
        labels:   data.weeklyGrowth.map((w: any) => w.week),
        datasets: [{
          label:           'Items saved',
          data:            data.weeklyGrowth.map((w: any) => w.count),
          backgroundColor: '#7340f520',
          borderColor:     '#7340f5',
          borderWidth:     1.5,
          borderRadius:    4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#f0eeea' }, ticks: { font: { size: 11 } } },
          y: { grid: { color: '#f0eeea' }, ticks: { font: { size: 11 }, stepSize: 1 }, beginAtZero: true },
        },
      },
    })
  }

  // Type chart
  const t = document.getElementById('type-chart') as HTMLCanvasElement
  if (t && data.typeBreakdown?.length > 0) {
    const colorMap: Record<string, string> = {
      ARTICLE: '#3b82f6', NOTE: '#7340f5', YOUTUBE: '#ef4444',
      VOICE: '#f59e0b', PDF: '#ec4899', BOOKMARK: '#1D9E75',
    }
    new C(t, {
      type: 'doughnut',
      data: {
        labels:   data.typeBreakdown.map((t: any) => t.type),
        datasets: [{
          data:            data.typeBreakdown.map((t: any) => t.count),
          backgroundColor: data.typeBreakdown.map((t: any) => (colorMap[t.type] ?? '#928c82') + '90'),
          borderColor:     data.typeBreakdown.map((t: any) => colorMap[t.type] ?? '#928c82'),
          borderWidth:     1.5,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 10 } } },
        cutout: '65%',
      },
    })
  }
}
