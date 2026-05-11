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
  const postBudget = rows.reduce((s, d) => s + d.post_budget, 0)
  const viewAch = viewBudget > 0 ? totalViews / viewBudget : null
  const folAch = folBudget > 0 ? totalFollowers / folBudget : null
  const postAch = postBudget > 0 ? totalPosts / postBudget : null

  const prevViews = prevRows.reduce((s, d) => s + d.views, 0)
  const prevFol = prevRows.reduce((s, d) => s + d.followers, 0)
  const prevPosts = prevRows.reduce((s, d) => s + d.posts, 0)
  const viewDiff = prevViews > 0 ? ((totalViews - prevViews) / prevViews * 100).toFixed(1) : null
  const folDiff = prevFol > 0 ? ((totalFollowers - prevFol) / prevFol * 100).toFixed(1) : null
  const postDiff = prevPosts > 0 ? ((totalPosts - prevPosts) / prevPosts * 100).toFixed(1) : null

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

      {/* サマリ説明文 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">月次サマリ</span>
          <span className="badge badge-blue">{month}</span>
        </div>

        {/* 全体サマリ */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>■ 全体</div>
          <table style={{ width: 'auto', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 90 }}>指標</th>
                <th style={{ minWidth: 80 }}>実績</th>
                <th style={{ minWidth: 70 }}>予算比</th>
                <th style={{ minWidth: 80 }}>前月比</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>閲覧数 ★</td>
                <td style={{ fontWeight: 600 }}>{fmt(totalViews)}</td>
                <td>{viewAch !== null ? <span className={achievementClass(viewAch)}>{(viewAch * 100).toFixed(0)}%</span> : '—'}</td>
                <td className={viewDiff !== null ? (+viewDiff >= 0 ? 'up' : 'down') : ''}>
                  {viewDiff !== null ? `${+viewDiff >= 0 ? '▲' : '▼'}${Math.abs(viewDiff)}%` : '—'}
                </td>
              </tr>
              <tr>
                <td>フォロワー数</td>
                <td style={{ fontWeight: 600 }}>{fmt(totalFollowers)}</td>
                <td>{folAch !== null ? <span className={achievementClass(folAch)}>{(folAch * 100).toFixed(0)}%</span> : '—'}</td>
                <td className={folDiff !== null ? (+folDiff >= 0 ? 'up' : 'down') : ''}>
                  {folDiff !== null ? `${+folDiff >= 0 ? '▲' : '▼'}${Math.abs(folDiff)}%` : '—'}
                </td>
              </tr>
              <tr>
                <td>投稿数</td>
                <td style={{ fontWeight: 600 }}>{totalPosts.toLocaleString()}件</td>
                <td>{postAch !== null ? <span className={achievementClass(postAch)}>{(postAch * 100).toFixed(0)}%</span> : '—'}</td>
                <td className={postDiff !== null ? (+postDiff >= 0 ? 'up' : 'down') : ''}>
                  {postDiff !== null ? `${+postDiff >= 0 ? '▲' : '▼'}${Math.abs(postDiff)}%` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 媒体別サマリ */}
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>■ 媒体別</div>
        <div className="table-wrap">
          <table style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th>ブランド</th>
                <th>媒体</th>
                <th>閲覧数</th>
                <th>閲覧予算比</th>
                <th>閲覧前月比</th>
                <th>フォロワー</th>
                <th>フォロワー予算比</th>
                <th>フォロワー前月比</th>
                <th>投稿数</th>
                <th>投稿予算比</th>
                <th>投稿前月比</th>
              </tr>
            </thead>
            <tbody>
              {['DS', 'UNY'].flatMap(b =>
                PLATFORMS.map(p => {
                  const cur = rows.find(d => d.brand === b && d.platform === p)
                  const prev = prevRows.find(d => d.brand === b && d.platform === p)
                  if (!cur) return null
                  const vAch = cur.view_budget > 0 ? cur.views / cur.view_budget : null
                  const fAch = cur.follower_budget > 0 ? cur.followers / cur.follower_budget : null
                  const pAch = cur.post_budget > 0 ? cur.posts / cur.post_budget : null
                  const vDiff = prev?.views > 0 ? ((cur.views - prev.views) / prev.views * 100).toFixed(1) : null
                  const fDiff = prev?.followers > 0 ? ((cur.followers - prev.followers) / prev.followers * 100).toFixed(1) : null
                  const pDiff = prev?.posts > 0 ? ((cur.posts - prev.posts) / prev.posts * 100).toFixed(1) : null
                  return (
                    <tr key={`${b}-${p}`}>
                      <td>
                        <span className="dot" style={{ background: BRAND_COLORS[b] }} />{b}
                      </td>
                      <td>
                        <span className="dot" style={{ background: PLATFORM_COLORS[p] }} />{p}
                      </td>
                      <td style={{ fontWeight: 600 }}>{fmt(cur.views)}</td>
                      <td>{vAch !== null ? <span className={achievementClass(vAch)}>{(vAch * 100).toFixed(0)}%</span> : '—'}</td>
                      <td className={vDiff !== null ? (+vDiff >= 0 ? 'up' : 'down') : ''}>
                        {vDiff !== null ? `${+vDiff >= 0 ? '▲' : '▼'}${Math.abs(vDiff)}%` : '—'}
                      </td>
                      <td>{fmt(cur.followers)}</td>
                      <td>{fAch !== null ? <span className={achievementClass(fAch)}>{(fAch * 100).toFixed(0)}%</span> : '—'}</td>
                      <td className={fDiff !== null ? (+fDiff >= 0 ? 'up' : 'down') : ''}>
                        {fDiff !== null ? `${+fDiff >= 0 ? '▲' : '▼'}${Math.abs(fDiff)}%` : '—'}
                      </td>
                      <td>{cur.posts.toLocaleString()}件</td>
                      <td>{pAch !== null ? <span className={achievementClass(pAch)}>{(pAch * 100).toFixed(0)}%</span> : '—'}</td>
                      <td className={pDiff !== null ? (+pDiff >= 0 ? 'up' : 'down') : ''}>
                        {pDiff !== null ? `${+pDiff >= 0 ? '▲' : '▼'}${Math.abs(pDiff)}%` : '—'}
                      </td>
                    </tr>
                  )
                }).filter(Boolean)
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
