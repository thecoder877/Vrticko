import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { getCurrentUserInfo, testSupabaseConnection } from './utils/debug'
import { usePushNotifications } from './hooks/usePushNotifications'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './components/Login'
import Dashboard from './pages/Dashboard'
import MenuPage from './pages/MenuPage'
import NotificationsPage from './pages/NotificationsPage'
import AttendancePage from './pages/AttendancePage'
import NotesPage from './pages/NotesPage'
import TeacherAttendancePage from './pages/TeacherAttendancePage'
import SendNotificationsPage from './pages/SendNotificationsPage'
import TeacherNotesPage from './pages/TeacherNotesPage'
import SchedulePage from './pages/SchedulePage'
import UserManagementPage from './pages/UserManagementPage'
import AdminMenuPage from './pages/AdminMenuPage'
import StatisticsPage from './pages/StatisticsPage'
import ChatPage from './pages/ChatPage'
import { LogOut, Home, ChevronRight } from 'lucide-react'

const AppContent: React.FC = () => {
  const { user, signOut, loading } = useAuth()
  const location = useLocation()
  const [isSigningOut, setIsSigningOut] = useState(false)
  
  // Initialize push notifications for real-time notifications
  const { setupRealtimeNotifications } = usePushNotifications()
  const [realtimeSetup, setRealtimeSetup] = useState(false)

  // Expose auth context to global window for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).authContext = { user, signOut, loading }
      console.log('Auth context exposed to window.authContext for debugging')
      
      // Also expose debug utilities
      ;(window as any).testSupabaseConnection = testSupabaseConnection
      ;(window as any).getCurrentUserInfo = getCurrentUserInfo
    }
  }, [user, signOut, loading])

  // Setup real-time notifications when user is logged in
  useEffect(() => {
    if (user && !loading && !realtimeSetup) {
      console.log('Setting up real-time notifications for user:', user.id)
      setRealtimeSetup(true)
      
      // Delay setup to ensure user is fully loaded
      const timeoutId = setTimeout(() => {
        const cleanup = setupRealtimeNotifications()
        
        // Store cleanup function
        if (cleanup) {
          (window as any).realtimeCleanup = cleanup
        }
      }, 1000)
      
      return () => {
        clearTimeout(timeoutId)
        if ((window as any).realtimeCleanup) {
          console.log('Cleaning up real-time notifications')
          ;(window as any).realtimeCleanup()
          delete (window as any).realtimeCleanup
        }
      }
    }
  }, [user, loading, setupRealtimeNotifications, realtimeSetup])

  const handleSignOut = async () => {
    if (isSigningOut || loading) return // Prevent multiple calls
    
    try {
      setIsSigningOut(true)
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/menu': return 'Jelovnik'
      case '/notifications': return 'Obaveštenja'
      case '/attendance': return 'Prisustvo'
      case '/notes': return 'Beleške'
      case '/teacher-attendance': return 'Evidencija prisustva'
      case '/send-notifications': return 'Slanje obaveštenja'
      case '/teacher-notes': return 'Beleške roditeljima'
      case '/schedule': return 'Raspored aktivnosti'
      case '/user-management': return 'Upravljanje korisnicima'
      case '/admin-menu': return 'Upravljanje jelovnikom'
      case '/statistics': return 'Statistike'
      case '/chat': return 'Chat'
      case '/dashboard': return 'Dashboard'
      default: return 'Dashboard'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-gray-600">Učitavanje...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user && (
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link to="/dashboard" className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">Vrtićko</h1>
                </Link>
                <span className="ml-4 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {user.role === 'parent' && 'Roditelj'}
                  {user.role === 'teacher' && 'Vaspitač'}
                  {user.role === 'admin' && 'Administracija'}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Dobrodošli, {user.username}</span>
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut || loading}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {isSigningOut ? 'Odjavljivanje...' : 'Odjavi se'}
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Breadcrumb Navigation */}
      {user && location.pathname !== '/dashboard' && (
        <div className="bg-gray-50 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex items-center space-x-2 text-sm">
              <Link to="/dashboard" className="flex items-center text-gray-500 hover:text-gray-700">
                <Home className="w-4 h-4 mr-1" />
                Dashboard
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 font-medium">{getPageTitle()}</span>
            </nav>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/menu"
          element={
            <ProtectedRoute allowedRoles={['parent', 'teacher', 'admin']}>
              <MenuPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={['parent', 'teacher', 'admin']}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute allowedRoles={['parent']}>
              <AttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes"
          element={
            <ProtectedRoute allowedRoles={['parent']}>
              <NotesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher-attendance"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherAttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/send-notifications"
          element={
            <ProtectedRoute allowedRoles={['parent', 'teacher', 'admin']}>
              <SendNotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher-notes"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherNotesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <SchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-management"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-menu"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminMenuPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <StatisticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute allowedRoles={['parent', 'teacher', 'admin']}>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/unauthorized" element={<div className="min-h-screen flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-red-600 mb-4">Nemate dozvolu za pristup</h1><p className="text-gray-600">Kontaktirajte administratora za pomoć.</p></div></div>} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App