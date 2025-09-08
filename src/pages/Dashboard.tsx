import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useUnreadCounts } from '../hooks/useUnreadCounts'
import { Users, Calendar, Bell, BookOpen, BarChart3, Settings, Utensils, MessageSquare, UserCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import PushNotificationSettings from '../components/PushNotificationSettings'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const { unreadNotifications, unreadMessages } = useUnreadCounts()

  const getDashboardContent = () => {
    switch (user?.role) {
      case 'parent':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dobrodošli, {user.username}!</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link to="/menu" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <Utensils className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Jelovnik</h3>
                <p className="text-gray-600">Pregled dnevnog i nedeljnog jelovnika</p>
              </Link>
              <Link to="/notifications" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow relative">
                <Bell className="w-8 h-8 text-green-600 mb-4" />
                <Badge count={unreadNotifications} />
                <h3 className="text-lg font-semibold mb-2">Obaveštenja</h3>
                <p className="text-gray-600">Nova obaveštenja od vaspitača</p>
              </Link>
              <Link to="/attendance" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <UserCheck className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Prisustvo</h3>
                <p className="text-gray-600">Evidencija prisustva vašeg deteta</p>
              </Link>
              <Link to="/notes" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <MessageSquare className="w-8 h-8 text-orange-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Beleške</h3>
                <p className="text-gray-600">Direktne beleške od vaspitača</p>
              </Link>
              <Link to="/chat" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow relative">
                <MessageSquare className="w-8 h-8 text-pink-600 mb-4" />
                <Badge count={unreadMessages} />
                <h3 className="text-lg font-semibold mb-2">Chat sa vaspitačima</h3>
                <p className="text-gray-600">Direktna komunikacija sa vaspitačima</p>
              </Link>
            </div>
            
            {/* Push Notification Settings */}
            <div className="mt-8">
              <PushNotificationSettings />
            </div>
          </div>
        )

      case 'teacher':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dobrodošli, {user.username}!</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link to="/teacher-attendance" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <Users className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Evidencija prisustva</h3>
                <p className="text-gray-600">Check-in/out dece u grupi</p>
              </Link>
              <Link to="/send-notifications" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <Bell className="w-8 h-8 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Slanje obaveštenja</h3>
                <p className="text-gray-600">Masovna i individualna obaveštenja</p>
              </Link>
              <Link to="/teacher-notes" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <BookOpen className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Beleške roditeljima</h3>
                <p className="text-gray-600">Direktne beleške o deci</p>
              </Link>
              <Link to="/schedule" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <Calendar className="w-8 h-8 text-orange-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Raspored aktivnosti</h3>
                <p className="text-gray-600">Upravljanje rasporedom</p>
              </Link>
              <Link to="/menu" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <Utensils className="w-8 h-8 text-indigo-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Jelovnik</h3>
                <p className="text-gray-600">Pregled dnevnog i nedeljnog jelovnika</p>
              </Link>
              <Link to="/notifications" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow relative">
                <Bell className="w-8 h-8 text-red-600 mb-4" />
                <Badge count={unreadNotifications} />
                <h3 className="text-lg font-semibold mb-2">Obaveštenja</h3>
                <p className="text-gray-600">Nova obaveštenja od administracije</p>
              </Link>
              <Link to="/chat" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow relative">
                <MessageSquare className="w-8 h-8 text-pink-600 mb-4" />
                <Badge count={unreadMessages} />
                <h3 className="text-lg font-semibold mb-2">Chat sa roditeljima</h3>
                <p className="text-gray-600">Direktna komunikacija sa roditeljima</p>
              </Link>
            </div>
            
            {/* Push Notification Settings */}
            <div className="mt-8">
              <PushNotificationSettings />
            </div>
          </div>
        )

      case 'admin':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Administracija - {user.username}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link to="/user-management" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <Users className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upravljanje korisnicima</h3>
                <p className="text-gray-600">Dodavanje roditelja, vaspitača, dece</p>
              </Link>
              <Link to="/admin-menu" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <Utensils className="w-8 h-8 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upravljanje jelovnikom</h3>
                <p className="text-gray-600">Unos i izmena jelovnika</p>
              </Link>
              <Link to="/schedule" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <Calendar className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Raspored aktivnosti</h3>
                <p className="text-gray-600">Upravljanje rasporedom</p>
              </Link>
              <Link to="/send-notifications" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <Bell className="w-8 h-8 text-orange-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Slanje obaveštenja</h3>
                <p className="text-gray-600">Upravljanje obaveštenjima</p>
              </Link>
              <Link to="/notifications" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow relative">
                <Bell className="w-8 h-8 text-indigo-600 mb-4" />
                <Badge count={unreadNotifications} />
                <h3 className="text-lg font-semibold mb-2">Pregled obaveštenja</h3>
                <p className="text-gray-600">Sva obaveštenja u sistemu</p>
              </Link>
              <Link to="/chat" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow relative">
                <MessageSquare className="w-8 h-8 text-pink-600 mb-4" />
                <Badge count={unreadMessages} />
                <h3 className="text-lg font-semibold mb-2">Chat</h3>
                <p className="text-gray-600">Komunikacija sa korisnicima</p>
              </Link>
              <Link to="/statistics" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <BarChart3 className="w-8 h-8 text-red-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Statistike</h3>
                <p className="text-gray-600">Prisustvo, aktivnost, korišćenje</p>
              </Link>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <Settings className="w-8 h-8 text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Podešavanja</h3>
                <p className="text-gray-600">Sistemska podešavanja</p>
              </div>
            </div>
            
            {/* Push Notification Settings */}
            <div className="mt-8">
              <PushNotificationSettings />
            </div>
          </div>
        )

      default:
        return <div>Nepoznata uloga</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {getDashboardContent()}
      </div>
    </div>
  )
}

export default Dashboard
