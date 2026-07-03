import { Routes, Route } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import CircleHome from './pages/CircleHome'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'

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
    </Routes>
  )
}

export default App
