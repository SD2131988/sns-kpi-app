import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function UsersPage() {
  const { profile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', role: 'member' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    setUsers(data || [])
    setLoading(false)
  }

  async function handleAddUser(e) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    // Admin creates user via Supabase Auth Admin API
    // Note: In production, this should go through a secure server-side function
    // For now, show instructions
    setMsg(`ユーザー「${newUser.email}」をSupabaseのAuthentication > UsersからInvite userで招待してください。名前とロールはprofilesテーブルで設定できます。`)
    setSaving(false)
    setShowAdd(false)
    setNewUser({ email: '', password: '', name: '', role: 'member' })
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="card">
        <div className="empty">このページは管理者のみアクセスできます</div>
      </div>
    )
  }

  return (
    <div>
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-title">メンバー一覧 ({users.length}名)</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ メンバー追加案内</button>
        </div>

        {loading ? <div className="empty">読み込み中...</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>名前</th><th>メールアドレス</th><th>ロール</th><th>登録日</th><th>操作</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ color: 'var(--c-text2)' }}>{u.id.slice(0, 8)}...</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-blue' : 'badge-green'}`}>
                        {u.role === 'admin' ? '管理者' : 'メンバー'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--c-text2)' }}>{new Date(u.created_at).toLocaleDateString('ja-JP')}</td>
                    <td>
                      <button className="btn btn-sm" onClick={async () => {
                        const newRole = u.role === 'admin' ? 'member' : 'admin'
                        await supabase.from('profiles').update({ role: newRole }).eq('id', u.id)
                        loadUsers()
                      }}>
                        {u.role === 'admin' ? 'メンバーに変更' : '管理者に変更'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>メンバー招待方法</h2>
            <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--c-text2)' }}>
              <p style={{ marginBottom: 12 }}>Supabaseダッシュボードからユーザーを招待します：</p>
              <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>Supabase Dashboard を開く</li>
                <li>Authentication → Users を選択</li>
                <li>「Invite user」ボタンをクリック</li>
                <li>メールアドレスを入力して招待メールを送信</li>
                <li>招待されたユーザーがメール内リンクからパスワードを設定</li>
              </ol>
              <p style={{ marginTop: 12 }}>招待後、このページでロールを「管理者」に変更できます。</p>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowAdd(false)}>閉じる</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
