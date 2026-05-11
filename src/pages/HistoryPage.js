import { useEffect, useState } from 'react'
import { Bar, Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler } from 'chart.js'
import { supabase, PLATFORMS, PLATFORM_COLORS, fmt, achievementClass } from '../lib/supabase'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler)

const YEARS = ['2024', '2025', '2026', '2027']

const PERIODS = [
  { id: 'full',  label: '通期',   months: (y) => Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}`) },
  { id: 'h1',   label: '上半期', months: (y) => Array.from({ length: 6  }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}`) },
  { id: 'h2',   label: '下半期', months: (y) => Array.from({ length: 6  }, (_, i) => `${y}-${String(i + 7).padStart(2, '0')}`) },
]

function periodSummary(allData, months, metricField, budgetField) {
  const actual = allData.filter(d => months.includes(d.month)).reduce((s, d) => s + d[metricField], 0)
  const budget = allData.filter(d => months.includes(d.month)).reduce((s, d) => s + d[budgetField], 0)
  const ach = budget > 0 ? actual / budget : null
  return { actual, budget, ach }
}

export default function HistoryPage({ region, brand }) {
  const [allData, setAllData] = useState([])
  const [metric, setMetric] = useState('views')
  const [year, setYear] = useState('2026')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let q = supabase.from('kpi_data').select('*')
      if (region !== 'all') q = q.eq('region', region)
      if (brand !== 'all') q = q.eq('brand', brand)
      q = q.order('month')
      const { data } = await q
      setAllData(data || [])
      setLoading(false)
    }
    load()
  }, [region, brand])

  if (loading) return <div className="empty">読み込み中...</div>

  const yearData = allData.filter(d => d.month.startsWith(year))
  const months = [...new Set(yearData.map(d => d.month))].sort()
  const metricField = metric === 'views' ? 'views' : metric === 'followers' ? 'followers' : 'posts'
  const budgetField = metric === 'views' ? 'view_budget' : metric === 'followers' ? 'follower_budget' : 'post_budget'

  // 通期・半期サマリ
  const periodSummaries = PERIODS.map(p => ({
    ...p,
    ...periodSummary(yearData, p.months(year), metricField, budgetField),
  }))

  const periodBarData = {
    labels: PERIODS.map(p => p.label),
    datasets: [
      {
        label: '実績',
        data: periodSummaries.map(p => p.actual),
        backgroundColor: '#185FA5cc',
        borderRadius: 4,
      },
      {
        label: '予算',
        data: periodSummaries.map(p => p.budget),
        backgroundColor: '#D85A3044',
        borderColor: '#D85A30',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  }

  // 月次推移グラフ
  const lineData = {
    labels: months.map(m => m.replace('-', '年') + '月'),
    datasets: PLATFORMS.map(p => ({
      label: p,
      data: months.map(m => yearData.filter(d => d.platform === p && d.month === m).reduce((s, d) => s + d[metricField], 0)),
      borderColor: PLATFORM_COLORS[p],
      backgroundColor: PLATFORM_COLORS[p] + '22',
      tension: 0.35,
      fill: false,
      pointRadius: 4,
      pointHoverRadius: 6,
    })),
  }

  const totalActual = months.map(m => yearData.filter(d => d.month === m).reduce((s, d) => s + d[metricField], 0))
  const totalBudget = months.map(m => yearData.filter(d => d.month === m).reduce((s, d) => s + d[budgetField], 0))

  const summaryData = {
    labels: months.map(m => m.replace('-', '年') + '月'),
    datasets: [
      { label: '実績', data: totalActual, borderColor: '#185FA5', backgroundColor: '#185FA522', tension: 0.35, fill: true, pointRadius: 4 },
      { label: '予算', data: totalBudget, borderColor: '#D85A30', backgroundColor: 'transparent', borderDash: [5, 4], tension: 0.35, fill: false, pointRadius: 3 },
    ],
  }

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { font: { size: 11 }, usePointStyle: true, pointStyleWidth: 10 } } },
    scales: {
      y: { ticks: { callback: v => fmt(v), font: { size: 10 } }, grid: { color: 'rgba(0,0,0,.06)' } },
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    },
  }

  return (
    <div>
      {/* 年・指標セレクター */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <select value={year} onChange={e => setYear(e.target.value)}>
          {YEARS.map(y => <option key={y} value={y}>{y}年</option>)}
        </select>
        <div className="tabs" style={{ margin: 0 }}>
          {[['views', '閲覧数 ★'], ['followers', 'フォロワー数'], ['posts', '投稿数']].map(([v, l]) => (
            <button key={v} className={`tab ${metric === v ? 'active' : ''}`} onClick={() => setMetric(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* 通期・上半期・下半期 達成率 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">通期 / 半期別 達成率</span>
          <span className="badge badge-blue">{year}年</span>
        </div>

        {/* サマリカード */}
        <div className="metrics-grid" style={{ marginBottom: 16 }}>
          {periodSummaries.map(p => (
            <div key={p.id} className="metric-card">
              <div className="metric-label">{p.label}</div>
              <div className="metric-value" style={{ fontSize: 22 }}>{fmt(p.actual)}</div>
              <div className="metric-sub">
                予算: {p.budget > 0 ? fmt(p.budget) : '未設定'}
              </div>
              {p.ach !== null ? (
                <div style={{ marginTop: 6 }}>
                  <span className={achievementClass(p.ach)} style={{ fontSize: 18, fontWeight: 700 }}>
                    {(p.ach * 100).toFixed(0)}%
                  </span>
                </div>
              ) : (
                <div style={{ marginTop: 6, color: 'var(--c-text2)', fontSize: 13 }}>予算未設定</div>
              )}
            </div>
          ))}
        </div>

        {/* 実績 vs 予算 棒グラフ */}
        <div className="chart-wrap" style={{ height: 220 }}>
          <Bar data={periodBarData} options={{
            ...chartOptions,
            plugins: {
              ...chartOptions.plugins,
              legend: { ...chartOptions.plugins.legend, position: 'top' },
            },
          }} />
        </div>
      </div>

      {/* 実績 vs 予算 月次折れ線 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">実績 vs 予算 — 月次推移</span></div>
        <div className="chart-wrap" style={{ height: 260 }}>
          <Line data={summaryData} options={chartOptions} />
        </div>
      </div>

      {/* プラットフォーム別推移 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">プラットフォーム別推移</span></div>
        <div className="chart-wrap" style={{ height: 260 }}>
          <Line data={lineData} options={chartOptions} />
        </div>
      </div>

      {/* 月次サマリ表 */}
      <div className="card">
        <div className="card-header"><span className="card-title">月次サマリ</span></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>月</th>
                {PLATFORMS.map(p => <th key={p}>{p}</th>)}
                <th>合計</th>
                <th>予算</th>
                <th>達成率</th>
              </tr>
            </thead>
            <tbody>
              {months.map(m => {
                const vals = PLATFORMS.map(p => yearData.filter(d => d.platform === p && d.month === m).reduce((s, d) => s + d[metricField], 0))
                const total = vals.reduce((s, v) => s + v, 0)
                const budget = yearData.filter(d => d.month === m).reduce((s, d) => s + d[budgetField], 0)
                const ach = budget > 0 ? total / budget : null
                return (
                  <tr key={m}>
                    <td style={{ fontWeight: 500 }}>{m.replace('-', '年') + '月'}</td>
                    {vals.map((v, i) => <td key={i}>{fmt(v)}</td>)}
                    <td style={{ fontWeight: 600 }}>{fmt(total)}</td>
                    <td style={{ color: 'var(--c-text2)' }}>{budget > 0 ? fmt(budget) : '—'}</td>
                    <td>
                      {ach !== null ? (
                        <span className={achievementClass(ach)}>
                          {(ach * 100).toFixed(0)}%
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
