import { useEffect, useState } from 'react'
import { supabase, fmt } from '../lib/supabase'

export default function SummaryPage({ month, region, brand }) {
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setDataLoading(true)
      let q = supabase.from('kpi_data').select('*').eq('month', month)
      if (region !== 'all') q = q.eq('region', region)
      if (brand !== 'all') q = q.eq('brand', brand)
      const { data } = await q
      setRows(data || [])
      setDataLoading(false)
    }
    load()
  }, [month, region, brand])

  async function generateSummary() {
    if (!rows.length) return
    setLoading(true)
    setSummary('')

    const totalViews = rows.reduce((s, d) => s + d.views, 0)
    const totalFol = rows.reduce((s, d) => s + d.followers, 0)
    const viewBudget = rows.reduce((s, d) => s + d.view_budget, 0)
    const folBudget = rows.reduce((s, d) => s + d.follower_budget, 0)
    const viewAch = viewBudget > 0 ? (totalViews / viewBudget * 100).toFixed(0) + '%' : '予算未設定'
    const folAch = folBudget > 0 ? (totalFol / folBudget * 100).toFixed(0) + '%' : '予算未設定'

    const breakdown = rows.map(d =>
      `・${d.region} ${d.brand} ${d.platform}: 閲覧数 ${fmt(d.views)}（予算比 ${d.view_budget > 0 ? (d.views / d.view_budget * 100).toFixed(0) + '%' : '—'}）/ フォロワー ${fmt(d.followers)} / 投稿 ${d.posts}件`
    ).join('\n')

    const prompt = `あなたはSNSマーケティングの専門アナリストです。
以下の月次KPIデータを分析し、日本語でレポートを作成してください。

【分析対象】
期間: ${month}
地域: ${region === 'all' ? '全地域' : region}
ブランド: ${brand === 'all' ? '全ブランド' : brand}

【サマリKPI】
- 閲覧数合計: ${fmt(totalViews)}（予算比: ${viewAch}）※最重要KPI
- フォロワー数合計: ${fmt(totalFol)}（予算比: ${folAch}）※サブKPI

【プラットフォーム別詳細】
${breakdown}

【レポート要件】
以下の構成で300〜400字程度でまとめてください:
1. 総括（閲覧数を中心に全体評価）
2. 注目すべき点（好調・課題のプラットフォームやブランド）
3. 翌月への改善提案（具体的なアクション2〜3点）`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const json = await res.json()
      const text = json.content?.map(b => b.text || '').join('') || 'サマリを生成できませんでした。'
      setSummary(text)
    } catch (e) {
      setSummary('生成中にエラーが発生しました。')
    }
    setLoading(false)
  }

  if (dataLoading) return <div className="empty">読み込み中...</div>

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">AIサマリレポート</span>
          <span className="badge badge-blue">{month}</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <button className="btn btn-primary" onClick={generateSummary} disabled={loading || !rows.length}>
            {loading ? '生成中...' : '✨ AIサマリを生成'}
          </button>
          {!rows.length && <span style={{ fontSize: 12, color: 'var(--c-text2)', marginLeft: 10 }}>データがありません</span>}
        </div>

        {loading && (
          <div className="ai-box">
            <div className="ai-label">Claude が分析中...</div>
            <div style={{ color: 'var(--c-text2)' }}>しばらくお待ちください</div>
          </div>
        )}

        {summary && (
          <div className="ai-box">
            <div className="ai-label">✦ AI 分析レポート</div>
            {summary}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">今月のデータ概要</span></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>地域</th><th>ブランド</th><th>プラットフォーム</th><th>閲覧数★</th><th>予算比</th><th>フォロワー</th><th>予算比</th><th>投稿数</th></tr>
            </thead>
            <tbody>
              {rows.sort((a, b) => b.views - a.views).map(d => {
                const vAch = d.view_budget > 0 ? d.views / d.view_budget : null
                const fAch = d.follower_budget > 0 ? d.followers / d.follower_budget : null
                return (
                  <tr key={`${d.region}-${d.brand}-${d.platform}`}>
                    <td>{d.region}</td>
                    <td>{d.brand}</td>
                    <td>{d.platform}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(d.views)}</td>
                    <td>{vAch !== null ? <span className={vAch >= 1 ? 'ach-good' : 'ach-bad'}>{(vAch * 100).toFixed(0)}%</span> : '—'}</td>
                    <td>{fmt(d.followers)}</td>
                    <td>{fAch !== null ? <span className={fAch >= 1 ? 'ach-good' : 'ach-bad'}>{(fAch * 100).toFixed(0)}%</span> : '—'}</td>
                    <td>{d.posts}</td>
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
