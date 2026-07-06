import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import './Dashboard.css'

function daysUntil(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(dateStr + 'T00:00:00')
  return Math.round((expiry - today) / (1000 * 60 * 60 * 24))
}

function urgency(days) {
  if (days < 0) return 'expired'
  if (days <= 2) return 'soon'
  return 'fresh'
}

function expiryLabel(days) {
  if (days < -1) return `Expired ${Math.abs(days)} days ago`
  if (days === -1) return 'Expired yesterday'
  if (days === 0) return 'Expires today'
  if (days === 1) return 'Expires tomorrow'
  return `Expires in ${days} days`
}

export default function Dashboard() {
  const { user } = useAuth()
  const { circleId } = useParams()
  const navigate = useNavigate()

  const [circle, setCircle] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')

      const [circleRes, productsRes] = await Promise.all([
        supabase
          .from('circles')
          .select('id, name, invite_code')
          .eq('id', circleId)
          .maybeSingle(),
        supabase
          .from('products')
          .select('id, name, best_before, photo_url, added_by')
          .eq('circle_id', circleId)
          .eq('status', 'active')
          .order('best_before', { ascending: true }),
      ])

      if (circleRes.error) {
        setError(circleRes.error.message)
        setLoading(false)
        return
      }

      if (!circleRes.data) {
        setError('Circle not found.')
        setLoading(false)
        return
      }

      if (productsRes.error) {
        setError(productsRes.error.message)
        setLoading(false)
        return
      }

      setCircle(circleRes.data)
      setProducts(productsRes.data)
      setLoading(false)
    }

    load()
  }, [circleId])

  return (
    <div className="dash-screen">
      <div className="dash-inner">
        <div className="dash-header">
          <button
            type="button"
            className="dash-back"
            onClick={() => navigate('/')}
          >
            ← Circles
          </button>
          <p className="dash-user">{user?.email}</p>
        </div>

        {loading && <p className="dash-loading">Loading…</p>}
        {error && <p className="dash-error">{error}</p>}

        {circle && (
          <>
            <h1 className="dash-title">{circle.name}</h1>
            <p className="dash-invite">Invite code: <strong>{circle.invite_code}</strong></p>
          </>
        )}

        {!loading && !error && products.length === 0 && (
          <p className="dash-empty">Nothing tracked yet. Tap + to add the first item.</p>
        )}

        {products.length > 0 && (
          <ul className="dash-list">
            {products.map((p) => {
              const days = daysUntil(p.best_before)
              const u = urgency(days)
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`dash-item dash-item--${u}`}
                    onClick={() => navigate(`/circles/${circleId}/items/${p.id}`)}
                  >
                    <div className="dash-item-accent" />
                    <div className="dash-item-body">
                      <span className="dash-item-name">{p.name}</span>
                      <span className={`dash-item-date dash-item-date--${u}`}>
                        {expiryLabel(days)}
                      </span>
                    </div>
                    <span className="dash-item-arrow">→</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <button
        type="button"
        className="dash-fab"
        onClick={() => navigate(`/circles/${circleId}/add`)}
        aria-label="Add item"
      >
        +
      </button>
    </div>
  )
}
