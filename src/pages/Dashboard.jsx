import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { circleId } = useParams()
  const navigate = useNavigate()

  const [circle, setCircle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCircle() {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('circles')
        .select('id, name, invite_code')
        .eq('id', circleId)
        .maybeSingle()

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setCircle(data)
      }
      setLoading(false)
    }

    loadCircle()
  }, [circleId])

  return (
    <div style={{ padding: 32 }}>
      <button type="button" onClick={() => navigate('/')}>
        ← Your circles
      </button>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: '#c0392b' }}>{error}</p>}

      {circle && (
        <>
          <h1>{circle.name}</h1>
          <p>Invite code: {circle.invite_code}</p>
        </>
      )}

      <p>Signed in as {user?.email}</p>
      <p style={{ color: '#6b6b6b' }}>The shared item list is coming next.</p>
      <button type="button" onClick={signOut}>
        Sign out
      </button>
    </div>
  )
}