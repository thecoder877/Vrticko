import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useUnreadCounts } from '../hooks/useUnreadCounts'
import { Bell, Calendar, User, AlertCircle } from 'lucide-react'

type NotificationItem = {
  id: string
  title: string
  message: string
  target: 'all' | 'parents' | 'teachers' | string
  created_at: string
  created_by: string
  read_at: string | null
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { refreshCounts } = useUnreadCounts()

  // Označi sve kao pročitane (per-user)
  const markAllAsRead = useCallback(async (userId: string) => {
    const { error } = await supabase
      .from('user_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)
    if (error) console.warn('markAllAsRead error:', error)
  }, [])

  // Povuci notifikacije preko pivot tabele (JOIN na notifications)
  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select(`
          read_at,
          deleted_at,
          notification:notifications (
            id, title, message, target, created_at, created_by
          )
        `)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        // sort po vremenu kreiranja notifikacije (novije gore)
        .order('created_at', { foreignTable: 'notifications', ascending: false })
        // dodatni tie-breaker da stabilizujemo poredak kada su timestampovi isti
        .order('id', { foreignTable: 'notifications', ascending: false })

      if (error) throw error

      const list: NotificationItem[] = (data || []).map((row: any) => ({
        id: row.notification.id,
        title: row.notification.title,
        message: row.notification.message,
        target: row.notification.target,
        created_at: row.notification.created_at,
        created_by: row.notification.created_by,
        read_at: row.read_at
      }))

      // dodatna klijentska zaštita – uvek novije gore
      list.sort((a, b) => {
        const t = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        return t !== 0 ? t : b.id.localeCompare(a.id)
      })

      setNotifications(list)
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Na mount: mark → refresh badge → fetch list
  useEffect(() => {
    if (!user) return
    ;(async () => {
      await markAllAsRead(user.id)
      await refreshCounts()
      await fetchNotifications()
    })()
  }, [user, markAllAsRead, refreshCounts, fetchNotifications])

  // Realtime osvežavanje liste i badge-a
  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel('user_notifications_rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_notifications', filter: `user_id=eq.${user.id}` },
        async () => {
          await refreshCounts()
          await fetchNotifications()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [user, fetchNotifications, refreshCounts])

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

  const getNotificationIcon = (target: string) => {
    if (target === 'all') return <AlertCircle className="w-5 h-5 text-blue-500" />
    if (target === 'parents') return <User className="w-5 h-5 text-green-500" />
    if (target === 'teachers') return <User className="w-5 h-5 text-purple-500" />
    return <Bell className="w-5 h-5 text-orange-500" />
  }

  const getNotificationType = (target: string) => {
    if (target === 'all') return 'Svi korisnici'
    if (target === 'parents') return 'Roditelji'
    if (target === 'teachers') return 'Vaspitači'
    return 'Individualno'
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Obaveštenja</h1>
          <p className="text-gray-600">Nova obaveštenja od vaspitača i administracije</p>
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div key={n.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">{getNotificationIcon(n.target)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{n.title}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getNotificationType(n.target)}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{n.message}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(n.created_at)}
                      {n.read_at ? (
                        <span className="ml-3 text-xs bg-gray-100 rounded px-2 py-0.5">pročitano</span>
                      ) : (
                        <span className="ml-3 text-xs bg-yellow-100 rounded px-2 py-0.5">novo</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema novih obaveštenja</h3>
            <p className="text-gray-600">
              Kada vaspitači ili administracija pošalju obaveštenja, pojaviće se ovde.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationsPage
