import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import './AddItem.css'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const SOURCE_LABEL = {
  ocr: { text: 'Date read from packaging', color: 'green' },
  ai_estimate: { text: 'AI estimate — please check the date', color: 'amber' },
  manual: { text: "Couldn't identify — please fill in manually", color: 'gray' },
}

export default function AddItem() {
  const { user } = useAuth()
  const { circleId: defaultCircleId } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [source, setSource] = useState(null)

  const [name, setName] = useState('')
  const [bestBefore, setBestBefore] = useState('')
  const [selectedCircleId, setSelectedCircleId] = useState(defaultCircleId)
  const [remind, setRemind] = useState(true)
  const [circles, setCircles] = useState([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCircles() {
      const { data } = await supabase
        .from('circle_members')
        .select('circle:circles(id, name)')
        .eq('user_id', user.id)
      if (data) setCircles(data.map((r) => r.circle).filter(Boolean))
    }
    loadCircles()
  }, [user.id])

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoPreview(URL.createObjectURL(file))
    setAnalyzing(true)
    setSource(null)
    setError('')

    const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
    const storagePath = `${user.id}/${Date.now()}.${ext}`

    const [uploadResult, analyzeResult] = await Promise.allSettled([
      // Upload to Storage
      (async () => {
        const { error: upErr } = await supabase.storage
          .from('product-photos')
          .upload(storagePath, file)
        if (upErr) throw upErr
        const { data } = supabase.storage
          .from('product-photos')
          .getPublicUrl(storagePath)
        return data.publicUrl
      })(),
      // Analyze with Gemini
      (async () => {
        const base64 = await fileToBase64(file)
        const { data, error: fnErr } = await supabase.functions.invoke('analyze-photo', {
          body: { image_data: base64, mime_type: file.type },
        })
        if (fnErr) throw fnErr
        return data
      })(),
    ])

    if (uploadResult.status === 'fulfilled') {
      setPhotoUrl(uploadResult.value)
    }

    if (analyzeResult.status === 'fulfilled') {
      const result = analyzeResult.value
      if (result?.name) setName(result.name)
      if (result?.best_before) setBestBefore(result.best_before)
      setSource(result?.source ?? 'manual')
    } else {
      setSource('manual')
    }

    setAnalyzing(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert({
        circle_id: selectedCircleId,
        added_by: user.id,
        name: name.trim(),
        best_before: bestBefore,
        photo_url: photoUrl ?? null,
        status: 'active',
        source: source ?? 'manual',
      })
      .select('id')
      .single()

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    if (remind) {
      const { data: members } = await supabase
        .from('circle_members')
        .select('user_id')
        .eq('circle_id', selectedCircleId)

      if (members?.length) {
        const sendAt = bestBefore + 'T09:00:00Z'
        await supabase.from('notifications').insert(
          members.map((m) => ({
            product_id: product.id,
            user_id: m.user_id,
            send_at: sendAt,
            channel: 'push',
            sent: false,
          }))
        )
      }
    }

    setSaving(false)
    navigate(`/circles/${selectedCircleId}`)
  }

  const sourceInfo = source ? SOURCE_LABEL[source] : null

  return (
    <div className="add-screen">
      <div className="add-inner">
        <div className="add-header">
          <button
            type="button"
            className="add-back"
            onClick={() => navigate(`/circles/${defaultCircleId}`)}
          >
            ← Back
          </button>
        </div>

        <h1 className="add-title">Add item</h1>

        <form className="add-form" onSubmit={handleSave}>

          {/* Photo picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="add-file-input"
            onChange={handlePhotoChange}
          />

          {!photoPreview ? (
            <button
              type="button"
              className="add-photo-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>Take a photo</span>
            </button>
          ) : (
            <button
              type="button"
              className="add-photo-preview"
              onClick={() => fileInputRef.current?.click()}
            >
              <img src={photoPreview} alt="Product" />
              {analyzing && (
                <div className="add-photo-overlay">
                  <div className="add-spinner" />
                  <span>Analysing…</span>
                </div>
              )}
            </button>
          )}

          {/* Source indicator */}
          {sourceInfo && (
            <p className={`add-source add-source--${sourceInfo.color}`}>
              {sourceInfo.text}
            </p>
          )}

          {/* Fields */}
          <div className="add-card">
            <label className="add-field">
              <span className="add-field-label">Item name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Milk"
                required
                disabled={analyzing}
              />
            </label>

            <div className="add-divider" />

            <label className="add-field">
              <span className="add-field-label">Best before</span>
              <input
                type="date"
                value={bestBefore}
                onChange={(e) => setBestBefore(e.target.value)}
                required
                disabled={analyzing}
              />
            </label>

            {circles.length > 1 && (
              <>
                <div className="add-divider" />
                <label className="add-field">
                  <span className="add-field-label">Circle</span>
                  <select
                    value={selectedCircleId}
                    onChange={(e) => setSelectedCircleId(e.target.value)}
                  >
                    {circles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
          </div>

          {/* Remind toggle */}
          <label className="add-toggle-row">
            <div className="add-toggle-text">
              <span className="add-toggle-label">Remind the circle</span>
              <span className="add-toggle-hint">Notify members on the best-before date</span>
            </div>
            <div
              className={`add-toggle-track ${remind ? 'add-toggle-track--on' : ''}`}
              onClick={() => setRemind((v) => !v)}
              role="switch"
              aria-checked={remind}
              tabIndex={0}
              onKeyDown={(e) => e.key === ' ' && setRemind((v) => !v)}
            >
              <div className="add-toggle-thumb" />
            </div>
          </label>

          {error && <p className="add-error">{error}</p>}

          <button
            type="submit"
            className="add-save"
            disabled={saving || analyzing}
          >
            {saving ? 'Saving…' : 'Save item'}
          </button>
        </form>
      </div>
    </div>
  )
}
