import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import CircleHome from './pages/CircleHome'
import Dashboard from './pages/Dashboard'
import AddItem from './pages/AddItem'
import ProtectedRoute from './components/ProtectedRoute'

function Placeholder({ label }) {
  const navigate = useNavigate()
  const { circleId } = useParams()
  return (
    <div style={{ padding: 32 }}>
      <button type="button" onClick={() => navigate(`/circles/${circleId}`)}>← Back</button>
      <p style={{ color: '#6b6b6b', marginTop: 24 }}>{label} — coming soon.</p>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <CircleHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/circles/:circleId"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/circles/:circleId/add"
        element={
          <ProtectedRoute>
            <AddItem />
          </ProtectedRoute>
        }
      />
      <Route
        path="/circles/:circleId/items/:itemId"
        element={
          <ProtectedRoute>
            <Placeholder label="Item Detail (Screen 5)" />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
