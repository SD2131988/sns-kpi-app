import { useEffect, useState } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js'
import { supabase, PLATFORMS, PLATFORM_COLORS, BRAND_COLORS, fmt, getPrevMonth, achievementClass } from '../lib/supabase'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

export default function Dashboard({ month, region, brand }) {
  const [rows, setRows] = useState([])
  const [prevRows, setPrevRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let q = supabase.from('kpi_data').select('*').eq('month', month)
      if (region !== 'all') q = q.eq('region', region)
      if (brand !== 'all') q = q.eq('brand', brand)
      const { data } = await q
      setRows(data || [])

      let q2 = supabase.from('kpi_data').select('*').eq('month', getPrevMonth(month))
      if (region !== 'all') q2 = q2.eq('region', region)
      if (brand !== 'all') q2 = q2.eq('brand', brand)
      const { data: prev } = await q2
      setPrevRows(prev || [])
      setLoading(false)
    }
    load()
  }, [month, region, brand])

  if (loading) return <div className="empty">読み込み中...</div>
  if (!rows.length) return <div className="empty">データがありません。数値入力から登録してください。</div>

  const totalViews = rows.reduce((s, d) => s + d.views, 0)
  const totalFollowers = rows.reduce((s, d) => s + d.followers, 0)
  const totalPosts = rows.reduce((s, d) => s + d.posts, 0)
  const viewBudget = rows.reduce((s, d) => s + d.view_budget, 0)
  const folBudget = rows.reduce((s, d) => s + d.follower_budget, 0)
  const viewAch = viewBudget > 0 ? totalViews / viewBudget : null
  const folAch = folBudget > 0 ? totalFollowers / folBudget : null

  const prevViews = prevRows.reduce((s, d) => s + d.views, 0)
  const prevFol = prevRows.reduce((s, d) => s + d.followers, 0)
  const viewDiff = prevViews > 0 ? ((totalViews - prevViews) / prevViews * 100).toFixed(1) : null
  const folDiff = prevFol > 0 ? ((totalFollowers - prevFol) / prevFol * 100).toFixed(1) : null

  const byPlatform = PLATFORMS.map(p => ({
    p, views: rows.filter(d => d.platform === p).reduce((s, d) => s + d.views, 0),
    followers: rows.filter(d => d.platform === p).reduce((s, d) => s + d.followers, 0),
  }))

  const barData = {
    labels: PLATFORMS,
    datasets: [{
      label: '閲覧数',
      data: byPlatform.map(d => d.views),
      backgroundColor: PLATFORMS.map(p => PLATFORM_COLORS[p] + 'cc'),
      borderRadius: 4,
    }],
  }

  const donutData = {
    labels: byPlatform.filter(d => d.followers > 0).map(d => d.p),
    datasets: [{
      data: byPlatform.filter(d => d.followers > 0).map(d => d.followers),
      backgroundColor: byPlatform.filter(d => d.followers > 0).map(d => PLATFORM_COLORS[d.p] + 'cc'),
      borderWidth: 0,
    }],
  }

  return (
    <div>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">閲覧数<span className="kpi-star">★</span></div>
          <div className="metric-value">{fmt(totalViews)}</div>
          <div className={`metric-sub ${viewDiff !== null ? (+viewDiff >= 0 ? 'up' : 'down') : ''}`}>
            {viewDiff !== null ? `${+viewDiff >= 0 ? '▲' : '▼'}${Math.abs(viewDiff)}% 前月比` : '前月データなし'}
            {viewAch !== null && ` | 予算比 ${(viewAch * 100).toFixed(0)}%`}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">フォロワー数</div>
          <div className="metric-value">{fmt(totalFollowers)}</div>
          <div className={`metric-sub ${folDiff !== null ? (+folDiff >= 0 ? 'up' : 'down') : ''}`}>
            {folDiff !== null ? `${+folDiff >= 0 ? '▲' : '▼'}${Math.abs(folDiff)}% 前月比` : '前月データなし'}
            {folAch !== null && ` | 予算比 ${(folAch * 100).toFixed(0)}%`}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">投稿数</div>
          <div className="metric-value">{totalPosts.toLocaleString()}</div>
          <div className="metric-sub">{rows.length} アカウント</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">1投稿あたり閲覧数</div>
          <div className="metric-value">{totalPosts > 0 ? fmt(totalViews / totalPosts) : '—'}</div>
          <div className="metric-sub">エンゲージメント</div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">プラットフォーム別 閲覧数</span>
            <span className="badge badge-blue">{month}</span>
          </div>
          <div className="chart-wrap">
            <Bar data={barData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { ticks: { callback: v => fmt(v), font: { size: 10 } }, grid: { color: 'rgba(0,0,0,.06)' } },
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
              },
            }} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">フォロワー構成</span>
            <span className="badge badge-green">割合</span>
          </div>
          <div className="chart-wrap">
            {donutData.labels.length > 0 ? (
              <Doughnut data={donutData} options={{
                responsive: true, maintainAspectRatio: false,
                cutout: '60%',
                plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 10 } } },
              }} />
            ) : <div className="empty">データなし</div>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">アカウント別KPI</span></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>地域</th><th>ブランド</th><th>プラットフォーム</th>
                <th>閲覧数<span className="kpi-star">★</span></th><th>予算</th><th>達成率</th>
                <th>フォロワー</th><th>予算</th><th>達成率</th><th>投稿数</th>
              </tr>
            </thead>
            <tbody>
              {rows.sort((a, b) => b.views - a.views).map(d => {
                const vAch = d.view_budget > 0 ? d.views / d.view_budget : null
                const fAch = d.follower_budget > 0 ? d.followers / d.follower_budget : null
                return (
                  <tr key={`${d.region}-${d.brand}-${d.platform}`}>
                    <td><span className="badge badge-blue">{d.region}</span></td>
                    <td>
                      <span className="dot" style={{ background: BRAND_COLORS[d.brand] }} />
                      {d.brand}
                    </td>
                    <td>
                      <span className="dot" style={{ background: PLATFORM_COLORS[d.platform] }} />
                      {d.platform}
                    </td>
                    <td style={{ fontWeight: 600 }}>{fmt(d.views)}</td>
                    <td style={{ color: 'var(--c-text2)' }}>{d.view_budget > 0 ? fmt(d.view_budget) : '—'}</td>
                    <td>{vAch !== null ? <span className={achievementClass(vAch)}>{(vAch * 100).toFixed(0)}%</span> : '—'}</td>
                    <td>{fmt(d.followers)}</td>
                    <td style={{ color: 'var(--c-text2)' }}>{d.follower_budget > 0 ? fmt(d.follower_budget) : '—'}</td>
                    <td>{fAch !== null ? <span className={achievementClass(fAch)}>{(fAch * 100).toFixed(0)}%</span> : '—'}</td>
                    <td>{d.posts.toLocaleString()}</td>
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
