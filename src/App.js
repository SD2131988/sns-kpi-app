import { useState } from 'react'
import { useAuth } from './lib/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import InputPage from './pages/InputPage'
import HistoryPage from './pages/HistoryPage'
import UsersPage from './pages/UsersPage'

const MONTHS = []
for (let y = 2024; y <= 2027; y++) {
  for (let m = 1; m <= 12; m++) {
    MONTHS.push(`${y}-${String(m).padStart(2, '0')}`)
  }
}

export default function App() {
  const { user, profile, loading, signOut } = useAuth()
  const [page, setPage] = useState('dashboard')
  const [month, setMonth] = useState('2026-04')
  const [region, setRegion] = useState('all')
  const [brand, setBrand] = useState('all')

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--c-text2)', fontSize: 13 }}>
        読み込み中...
      </div>
    )
  }

  if (!user) return <Login />

  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'ダッシュボード' },
    { id: 'input', icon: '✏️', label: '数値入力' },
    { id: 'history', icon: '📈', label: '推移グラフ' },
  ]
  if (profile?.role === 'admin') navItems.push({ id: 'users', icon: '👥', label: 'メンバー管理' })

  const pageTitles = { dashboard: 'ダッシュボード', input: '数値入力', history: '推移グラフ', users: 'メンバー管理' }

  const showControls = page !== 'users'

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-logo">SNS KPI</div>

        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </div>
        ))}

        <div className="nav-section">地域フィルター</div>
        {[['all','全地域'],['国内','国内'],['グローバル','グローバル']].map(([v, l]) => (
          <div key={v} className={`nav-item ${region === v ? 'active' : ''}`} onClick={() => setRegion(v)}>
            <span className="nav-icon">🌐</span>{l}
          </div>
        ))}

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{profile?.name || user.email}</span>
            <br />
            <span style={{ fontSize: 11 }}>{profile?.role === 'admin' ? '管理者' : 'メンバー'}</span>
          </div>
          <button className="btn btn-sm" onClick={signOut} style={{ width: '100%', justifyContent: 'center' }}>
            ログアウト
          </button>
        </div>
      </nav>

      {/* Main */}
      <div className="main-area">
        <div className="topbar">
          <span className="topbar-title">{pageTitles[page]}</span>
          {showControls && (
            <div className="controls">
              <select value={month} onChange={e => setMonth(e.target.value)}>
                {MONTHS.filter(m => m >= '2026-01' && m <= '2026-12').map(m => (
                  <option key={m} value={m}>{m.replace('-', '年') + '月'}</option>
                ))}
              </select>
              <select value={brand} onChange={e => setBrand(e.target.value)}>
                <option value="all">全ブランド</option>
                <option value="DS">DS</option>
                <option value="UNY">UNY</option>
              </select>
            </div>
          )}
        </div>

        <div className="page-content">
          {page === 'dashboard' && <Dashboard month={month} region={region} brand={brand} />}
          {page === 'input' && <InputPage month={month} />}
          {page === 'history' && <HistoryPage region={region} brand={brand} />}
          {page === 'users' && <UsersPage />}
        </div>
      </div>
    </div>
  )
}
