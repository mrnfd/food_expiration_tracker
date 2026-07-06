import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import './CircleHome.css'

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export default function CircleHome() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [circles, setCircles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [newCircleName, setNewCircleName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)

  async function loadCircles() {
    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('circle_members')
      .select('circle:circles(id, name, invite_code)')
      .eq('user_id', user.id)

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setCircles(data.map((row) => row.circle).filter(Boolean))
    setLoading(false)
  }

  useEffect(() => {
    loadCircles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    setCreating(true)

    const { data: circle, error: createError } = await supabase
      .from('circles')
      .insert({ name: newCircleName.trim(), invite_code: generateInviteCode() })
      .select()
      .single()

    if (createError) {
      setError(createError.message)
      setCreating(false)
      return
    }

    const { error: memberError } = await supabase
      .from('circle_members')
      .insert({ circle_id: circle.id, user_id: user.id, role: 'owner' })

    setCreating(false)

    if (memberError) {
      setError(memberError.message)
      return
    }

    setNewCircleName('')
    setShowCreateForm(false)
    await loadCircles()
  }

  async function handleJoin(e) {
    e.preventDefault()
    setError('')
    setJoining(true)

    const code = joinCode.trim().toUpperCase()

    const { data: rows, error: lookupError } = await supabase
      .rpc('lookup_circle_by_invite_code', { invite: code })

    const circle = rows?.[0] ?? null

    if (lookupError) {
      setError(lookupError.message)
      setJoining(false)
      return
    }

    if (!circle) {
      setError('No circle found with that invite code.')
      setJoining(false)
      return
    }

    const { error: memberError } = await supabase
      .from('circle_members')
      .insert({ circle_id: circle.id, user_id: user.id, role: 'member' })

    setJoining(false)

    if (memberError) {
      if (memberError.code === '23505') {
        setError("You're already in that circle.")
      } else {
        setError(memberError.message)
      }
      return
    }

    setJoinCode('')
    setShowJoinForm(false)
    await loadCircles()
  }

  return (
    <div className="circle-screen">
      <div className="circle-card">
        <div className="circle-header">
          <div>
            <h1 className="circle-title">Your circles</h1>
            <p className="circle-subtitle">{user.email}</p>
          </div>
          <button type="button" className="circle-signout" onClick={signOut}>
            Sign out
          </button>
        </div>

        {loading && <p className="circle-loading">Loading…</p>}

        {!loading && circles.length === 0 && (
          <p className="circle-empty">
            You&apos;re not in any circles yet. Create one or join with an invite code.
          </p>
        )}

        {!loading && circles.length > 0 && (
          <ul className="circle-list">
            {circles.map((circle) => (
              <li key={circle.id}>
                <button
                  type="button"
                  className="circle-list-item"
                  onClick={() => navigate(`/circles/${circle.id}`)}
                >
                  <span className="circle-list-name">{circle.name}</span>
                  <span className="circle-list-arrow">→</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="circle-error">{error}</p>}

        <div className="circle-actions">
          <button
            type="button"
            className="circle-action-btn primary"
            onClick={() => {
              setShowCreateForm((v) => !v)
              setShowJoinForm(false)
              setError('')
            }}
          >
            Create a circle
          </button>
          <button
            type="button"
            className="circle-action-btn"
            onClick={() => {
              setShowJoinForm((v) => !v)
              setShowCreateForm(false)
              setError('')
            }}
          >
            Join a circle
          </button>
        </div>

        {showCreateForm && (
          <form className="circle-form" onSubmit={handleCreate}>
            <label className="circle-field">
              <span className="circle-field-label">Circle name</span>
              <input
                type="text"
                value={newCircleName}
                onChange={(e) => setNewCircleName(e.target.value)}
                placeholder="e.g. Maple Street Apartment"
                required
              />
            </label>
            <button type="submit" className="circle-continue" disabled={creating}>
              {creating ? 'Creating…' : 'Create circle'}
            </button>
          </form>
        )}

        {showJoinForm && (
          <form className="circle-form" onSubmit={handleJoin}>
            <label className="circle-field">
              <span className="circle-field-label">Invite code</span>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="e.g. AB12CD"
                required
              />
            </label>
            <button type="submit" className="circle-continue" disabled={joining}>
              {joining ? 'Joining…' : 'Join circle'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}