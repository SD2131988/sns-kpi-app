import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) setError('メールアドレスまたはパスワードが正しくありません')
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">SNS KPI 管理システム</div>
        <div className="card">
          <h1>ログイン</h1>
          <p>アカウント情報を入力してください</p>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="login-fields">
              <input
                type="email" placeholder="メールアドレス"
                value={email} onChange={e => setEmail(e.target.value)} required
              />
              <input
                type="password" placeholder="パスワード"
                value={password} onChange={e => setPassword(e.target.value)} required
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        </div>
        <p style={{ fontSize: 12, color: 'var(--c-text3)', textAlign: 'center', marginTop: 16 }}>
          アカウントはシステム管理者が発行します
        </p>
      </div>
    </div>
  )
}
