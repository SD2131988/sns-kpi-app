import { useEffect, useState, useRef } from 'react'
import { supabase, PLATFORMS, BRANDS, REGIONS, PLATFORM_COLORS, BRAND_COLORS } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const CSV_HEADERS = ['month', 'region', 'brand', 'platform', 'views', 'view_budget', 'followers', 'follower_budget', 'posts', 'post_budget', 'ad_cost', 'note']
const CSV_TEMPLATE = CSV_HEADERS.join(',') + '\n2026-04,国内,DS,X,100000,120000,5000,6000,30,35,50000,\n'

function parseCSV(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return { error: 'データ行がありません' }

  const headers = lines[0].split(',').map(h => h.trim())
  const required = ['month', 'region', 'brand', 'platform']
  for (const r of required) {
    if (!headers.includes(r)) return { error: `必須列 "${r}" がありません` }
  }

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    const row = {}
    headers.forEach((h, idx) => { row[h] = (values[idx] || '').trim() })

    if (!row.month?.match(/^\d{4}-\d{2}$/)) return { error: `${i + 1}行目: month の形式が不正です (例: 2026-04)` }
    if (!REGIONS.includes(row.region)) return { error: `${i + 1}行目: region は "${REGIONS.join('" か "')}" を指定してください` }
    if (!BRANDS.includes(row.brand)) return { error: `${i + 1}行目: brand は "${BRANDS.join('" か "')}" を指定してください` }
    if (!PLATFORMS.includes(row.platform)) return { error: `${i + 1}行目: platform は "${PLATFORMS.join('" か "')}" を指定してください` }

    rows.push({
      month: row.month,
      region: row.region,
      brand: row.brand,
      platform: row.platform,
      views: parseInt(row.views) || 0,
      view_budget: parseInt(row.view_budget) || 0,
      followers: parseInt(row.followers) || 0,
      follower_budget: parseInt(row.follower_budget) || 0,
      posts: parseInt(row.posts) || 0,
      post_budget: parseInt(row.post_budget) || 0,
      ad_cost: parseInt(row.ad_cost) || 0,
      note: row.note || '',
    })
  }
  return { rows }
}

export default function InputPage({ month }) {
  const { user } = useAuth()
  const [data, setData] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeRegion, setActiveRegion] = useState('国内')

  // CSV upload state
  const [csvMode, setCsvMode] = useState(false)
  const [csvPreview, setCsvPreview] = useState(null)
  const [csvError, setCsvError] = useState('')
  const [csvImporting, setCsvImporting] = useState(false)
  const [csvImported, setCsvImported] = useState(false)
  const fileInputRef = useRef()

  useEffect(() => { loadData() }, [month])

  async function loadData() {
    const { data: rows } = await supabase.from('kpi_data').select('*').eq('month', month)
    const map = {}
    ;(rows || []).forEach(r => {
      map[`${r.region}_${r.brand}_${r.platform}`] = r
    })
    setData(map)
  }

  function getVal(region, brand, platform, field) {
    const key = `${region}_${brand}_${platform}`
    return data[key]?.[field] ?? ''
  }

  function setVal(region, brand, platform, field, value) {
    const key = `${region}_${brand}_${platform}`
    setData(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), region, brand, platform, [field]: value }
    }))
  }

  async function handleSave() {
    setSaving(true)
    const rows = Object.values(data).map(d => ({
      month,
      region: d.region,
      brand: d.brand,
      platform: d.platform,
      views: parseInt(d.views) || 0,
      view_budget: parseInt(d.view_budget) || 0,
      followers: parseInt(d.followers) || 0,
      follower_budget: parseInt(d.follower_budget) || 0,
      posts: parseInt(d.posts) || 0,
      post_budget: parseInt(d.post_budget) || 0,
      ad_cost: parseInt(d.ad_cost) || 0,
      note: d.note || '',
      updated_by: user.id,
    }))

    const { error } = await supabase.from('kpi_data').upsert(rows, {
      onConflict: 'month,region,brand,platform'
    })

    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  function handleFileChange(e) {
    setCsvError('')
    setCsvPreview(null)
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target.result
      const result = parseCSV(text)
      if (result.error) {
        setCsvError(result.error)
      } else {
        setCsvPreview(result.rows)
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function handleCsvImport() {
    if (!csvPreview?.length) return
    setCsvImporting(true)
    const rows = csvPreview.map(r => ({ ...r, updated_by: user.id }))
    const { error } = await supabase.from('kpi_data').upsert(rows, {
      onConflict: 'month,region,brand,platform'
    })
    setCsvImporting(false)
    if (!error) {
      setCsvImported(true)
      setCsvPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setTimeout(() => { setCsvImported(false); loadData() }, 2000)
    } else {
      setCsvError('インポートに失敗しました: ' + error.message)
    }
  }

  function downloadTemplate() {
    const blob = new Blob(['﻿' + CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'kpi_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const numInput = (region, brand, platform, field, placeholder) => (
    <input
      type="number"
      value={getVal(region, brand, platform, field)}
      onChange={e => setVal(region, brand, platform, field, e.target.value)}
      placeholder={placeholder || '0'}
      style={{ width: '100%' }}
    />
  )

  return (
    <div>
      {saved && <div className="alert alert-success">✓ 保存しました</div>}
      {csvImported && <div className="alert alert-success">✓ CSVをインポートしました</div>}

      {/* モード切り替え */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${!csvMode ? 'active' : ''}`} onClick={() => setCsvMode(false)}>手動入力</button>
        <button className={`tab ${csvMode ? 'active' : ''}`} onClick={() => setCsvMode(true)}>CSVインポート</button>
      </div>

      {/* CSV インポートモード */}
      {csvMode && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">CSVインポート</span>
            <button className="btn btn-sm" onClick={downloadTemplate}>テンプレートDL</button>
          </div>

          <div style={{ marginBottom: 12, color: 'var(--c-text2)', fontSize: 13 }}>
            CSVフォーマット: <code style={{ fontSize: 11 }}>month, region, brand, platform, views, view_budget, followers, follower_budget, posts, post_budget, ad_cost, note</code>
            <br />
            既存データは上書きされます（month + region + brand + platform をキーに）。
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              style={{ fontSize: 13 }}
            />
          </div>

          {csvError && (
            <div className="alert" style={{ background: '#fee2e2', color: '#b91c1c', marginBottom: 12 }}>
              {csvError}
            </div>
          )}

          {csvPreview && (
            <>
              <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--c-text2)' }}>
                {csvPreview.length} 行を読み込みました。内容を確認して「インポート実行」してください。
              </div>
              <div className="table-wrap" style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 12 }}>
                <table>
                  <thead>
                    <tr>
                      <th>月</th><th>地域</th><th>ブランド</th><th>プラットフォーム</th>
                      <th>閲覧数</th><th>閲覧予算</th><th>フォロワー</th><th>フォロワー予算</th>
                      <th>投稿数</th><th>投稿予算</th><th>広告費</th><th>メモ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((r, i) => (
                      <tr key={i}>
                        <td>{r.month}</td>
                        <td>{r.region}</td>
                        <td>{r.brand}</td>
                        <td>{r.platform}</td>
                        <td>{r.views.toLocaleString()}</td>
                        <td>{r.view_budget.toLocaleString()}</td>
                        <td>{r.followers.toLocaleString()}</td>
                        <td>{r.follower_budget.toLocaleString()}</td>
                        <td>{r.posts}</td>
                        <td>{r.post_budget}</td>
                        <td>{r.ad_cost.toLocaleString()}</td>
                        <td>{r.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="btn btn-primary" onClick={handleCsvImport} disabled={csvImporting}>
                {csvImporting ? 'インポート中...' : '📥 インポート実行（上書き含む）'}
              </button>
            </>
          )}
        </div>
      )}

      {/* 手動入力モード */}
      {!csvMode && (
        <>
          <div className="tabs">
            {REGIONS.map(r => (
              <button key={r} className={`tab ${activeRegion === r ? 'active' : ''}`} onClick={() => setActiveRegion(r)}>
                {r}
              </button>
            ))}
          </div>

          {BRANDS.map(brand => (
            <div key={brand} className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="dot" style={{ background: BRAND_COLORS[brand] }} />
                  {brand} — {activeRegion} {month}
                </span>
              </div>

              {PLATFORMS.map(platform => (
                <div key={platform} className="platform-section">
                  <div className="platform-label">
                    <span className="dot" style={{ background: PLATFORM_COLORS[platform] }} />
                    {platform}
                  </div>
                  <div className="form-grid">
                    <div className="field">
                      <label>閲覧数 ★（実績）</label>
                      {numInput(activeRegion, brand, platform, 'views')}
                    </div>
                    <div className="field">
                      <label>閲覧数 予算</label>
                      {numInput(activeRegion, brand, platform, 'view_budget')}
                    </div>
                    <div className="field">
                      <label>フォロワー数（実績）</label>
                      {numInput(activeRegion, brand, platform, 'followers')}
                    </div>
                    <div className="field">
                      <label>フォロワー数 予算</label>
                      {numInput(activeRegion, brand, platform, 'follower_budget')}
                    </div>
                    <div className="field">
                      <label>投稿数（実績）</label>
                      {numInput(activeRegion, brand, platform, 'posts')}
                    </div>
                    <div className="field">
                      <label>投稿数 予算</label>
                      {numInput(activeRegion, brand, platform, 'post_budget')}
                    </div>
                    <div className="field">
                      <label>広告コスト（円）</label>
                      {numInput(activeRegion, brand, platform, 'ad_cost')}
                    </div>
                    <div className="field">
                      <label>メモ</label>
                      <input
                        type="text"
                        value={getVal(activeRegion, brand, platform, 'note')}
                        onChange={e => setVal(activeRegion, brand, platform, 'note', e.target.value)}
                        placeholder="特記事項など"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                  <hr className="section-divider" />
                </div>
              ))}
            </div>
          ))}

          <div style={{ display: 'flex', gap: 12, position: 'sticky', bottom: 20 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '💾 まとめて保存'}
            </button>
            <button className="btn" onClick={loadData}>↺ 再読み込み</button>
          </div>
        </>
      )}
    </div>
  )
}
