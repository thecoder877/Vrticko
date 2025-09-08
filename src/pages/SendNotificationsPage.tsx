import React, { useState, useEffect } from 'react'
import { supabase, type Notification, type Child, type User } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Send, Users, Bell, AlertCircle } from 'lucide-react'

const SendNotificationsPage: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([])
  const [parents, setParents] = useState<User[]>([])
  const [teachers, setTeachers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [notification, setNotification] = useState({
    title: '',
    message: '',
    target: 'all' as 'all' | 'parents' | 'teachers' | 'individual' | string
  })
  const [selectedParentId, setSelectedParentId] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch children
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .order('name')

      if (childrenError) throw childrenError
      setChildren(childrenData || [])

      // Fetch parents
      const { data: parentsData, error: parentsError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'parent')
        .order('username')

      if (parentsError) throw parentsError
      setParents(parentsData || [])

      // Fetch teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'teacher')
        .order('username')

      if (teachersError) throw teachersError
      setTeachers(teachersData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notification.title.trim() || !notification.message.trim()) {
      alert('Molimo unesite naslov i poruku')
      return
    }

    // For individual notifications, check if a parent or teacher is selected
    if (notification.target === 'individual') {
      if (user?.role === 'parent' && !selectedTeacherId) {
        alert('Molimo izaberite vaspitača za individualno obaveštenje')
        return
      } else if (user?.role !== 'parent' && !selectedParentId) {
        alert('Molimo izaberite roditelja za individualno obaveštenje')
        return
      }
    }

    try {
      setSending(true)
      
      // For individual notifications, use the selected parent or teacher ID
      let targetValue = notification.target
      if (notification.target === 'individual') {
        if (user?.role === 'parent') {
          targetValue = selectedTeacherId
        } else {
          targetValue = selectedParentId
        }
      }
      
      // Save notification to database
      const { error } = await supabase
        .from('notifications')
        .insert({
          title: notification.title,
          message: notification.message,
          target: targetValue,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })

      if (error) throw error

      // Send push notification
      try {
        const pushTarget = notification.target === 'individual' ? targetValue : notification.target
        const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
          body: {
            title: notification.title,
            message: notification.message,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            userId: pushTarget === 'individual' ? targetValue : undefined,
            target: pushTarget === 'individual' ? undefined : pushTarget
          }
        })

        if (pushError) {
          console.warn('Push notification failed:', pushError)
          // Don't fail the whole operation if push fails
        }
      } catch (pushError) {
        console.warn('Push notification error:', pushError)
        // Don't fail the whole operation if push fails
      }

      setMessage('Obaveštenje je uspešno poslato!')
      setNotification({ title: '', message: '', target: 'all' })
      setSelectedParentId('')
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error sending notification:', error)
      setMessage('Greška pri slanju obaveštenja')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSending(false)
    }
  }

  const getTargetDescription = (target: string) => {
    switch (target) {
      case 'all': return 'Svi korisnici (roditelji, vaspitači, administracija)'
      case 'parents': return 'Svi roditelji'
      case 'teachers': return 'Svi vaspitači'
      case 'individual': 
        return user?.role === 'parent' 
          ? 'Individualno obaveštenje izabranom vaspitaču'
          : 'Individualno obaveštenje izabranom roditelju'
      default: return 'Individualno obaveštenje'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user?.role === 'parent' ? 'Kontakt vaspitača' : 'Slanje obaveštenja'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'parent' 
              ? 'Pošaljite poruku vaspitačima' 
              : 'Masovna i individualna obaveštenja roditeljima'
            }
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('uspešno') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Send Notification Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <Send className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold">Pošalji obaveštenje</h2>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Naslov
                </label>
                <input
                  type="text"
                  value={notification.title}
                  onChange={(e) => setNotification({ ...notification, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Unesite naslov obaveštenja"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poruka
                </label>
                <textarea
                  value={notification.message}
                  onChange={(e) => setNotification({ ...notification, message: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Unesite poruku obaveštenja"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primaoci
                </label>
                <select
                  value={notification.target}
                  onChange={(e) => setNotification({ ...notification, target: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {user?.role === 'parent' ? (
                    <>
                      <option value="teachers">Svi vaspitači</option>
                      <option value="individual">Individualno vaspitaču</option>
                    </>
                  ) : (
                    <>
                      <option value="all">Svi korisnici</option>
                      <option value="parents">Svi roditelji</option>
                      <option value="teachers">Svi vaspitači</option>
                      <option value="individual">Individualno roditelju</option>
                    </>
                  )}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {getTargetDescription(notification.target)}
                </p>
              </div>

              {/* Individual selection */}
              {notification.target === 'individual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {user?.role === 'parent' ? 'Izaberite vaspitača' : 'Izaberite roditelja'}
                  </label>
                  <select
                    value={user?.role === 'parent' ? selectedTeacherId : selectedParentId}
                    onChange={(e) => {
                      if (user?.role === 'parent') {
                        setSelectedTeacherId(e.target.value)
                      } else {
                        setSelectedParentId(e.target.value)
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">
                      {user?.role === 'parent' ? 'Izaberite vaspitača' : 'Izaberite roditelja'}
                    </option>
                    {(user?.role === 'parent' ? teachers : parents).map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.username}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Pošalji obaveštenje
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Templates */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <Bell className="w-6 h-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold">Brzi šabloni</h2>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setNotification({
                    title: 'Izlet u zoološki vrt',
                    message: 'Dragi roditelji, organizujemo izlet u zoološki vrt u petak. Molimo da dete donese ručak i vodu. Sastanak je u 9:00 ispred vrtića.',
                    target: 'parents'
                  })
                  setSelectedParentId('')
                }}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900">Izlet</h3>
                <p className="text-sm text-gray-600">Obaveštenje o izletu</p>
              </button>

              <button
                onClick={() => {
                  setNotification({
                    title: 'Roditeljski sastanak',
                    message: 'Pozivamo vas na roditeljski sastanak koji će se održati u ponedeljak u 18:00. Molimo da se prijavite do petka.',
                    target: 'parents'
                  })
                  setSelectedParentId('')
                }}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900">Sastanak</h3>
                <p className="text-sm text-gray-600">Obaveštenje o sastanku</p>
              </button>

              <button
                onClick={() => {
                  setNotification({
                    title: 'Bolest u grupi',
                    message: 'Obaveštavamo vas da je u grupi zabeležen slučaj prehlade. Molimo da pazite na simptome kod vašeg deteta i kontaktirajte nas ako je potrebno.',
                    target: 'parents'
                  })
                  setSelectedParentId('')
                }}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900">Zdravlje</h3>
                <p className="text-sm text-gray-600">Obaveštenje o zdravlju</p>
              </button>

              <button
                onClick={() => {
                  setNotification({
                    title: 'Praznik',
                    message: 'Obaveštavamo vas da će vrtić biti zatvoren tokom praznika. Molimo da organizujete negu deteta za te dane.',
                    target: 'all'
                  })
                  setSelectedParentId('')
                }}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900">Praznik</h3>
                <p className="text-sm text-gray-600">Obaveštenje o prazniku</p>
              </button>
            </div>
          </div>
        </div>

        {/* Parents List for Individual Notifications */}
        {parents.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Users className="w-5 h-5 text-purple-600 mr-2" />
              <h2 className="text-lg font-semibold">Individualna obaveštenja</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Lista roditelja dostupnih za individualna obaveštenja.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {parents.map((parent) => (
                <div key={parent.id} className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="font-medium text-gray-900">{parent.username}</div>
                  <div className="text-sm text-gray-500">Roditelj</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SendNotificationsPage
