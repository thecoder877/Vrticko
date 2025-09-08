import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export const useUnreadCounts = () => {
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Brojimo isključivo iz user_notifications (read_at IS NULL)
  const fetchUnreadCounts = useCallback(async () => {
    if (!user) {
      setUnreadNotifications(0)
      setUnreadMessages(0)
      return { notifications: 0, messages: 0 }
    }

    try {
      // --- NOTIFIKACIJE ---
      const { count: notifCount, error: notifErr } = await supabase
        .from('user_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .is('read_at', null)

      if (notifErr) console.warn('Unread notifications count error:', notifErr)
      setUnreadNotifications(notifCount ?? 0)

      // --- PORUKE (ostavi tvoju postojeću logiku po read_status JSON-u) ---
      const { data: messagesData, error: messagesErr } = await supabase
        .from('chat_messages')
        .select('id, receiver_id, read_status')
        .eq('receiver_id', user.id)

      if (messagesErr) console.warn('Unread messages fetch error:', messagesErr)

      const unreadMsg = (messagesData ?? []).filter((m: any) => {
        const rs = m.read_status || {}
        const isRead = !!rs[user.id]
        return !isRead
      }).length
      setUnreadMessages(unreadMsg)

      return { notifications: notifCount ?? 0, messages: unreadMsg }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setUnreadNotifications(0)
      setUnreadMessages(0)
      setLoading(false)
      return
    }

    // inicijalno učitavanje
    fetchUnreadCounts()

    // --- Realtime: user_notifications (samo redovi ovog korisnika) ---
    const notifCh = supabase
      .channel('user_notifications_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_notifications', filter: `user_id=eq.${user.id}` },
        () => { fetchUnreadCounts() }
      )
      .subscribe()

    // --- Realtime: chat_messages (globalno, filtriramo u fetchUnreadCounts) ---
    const msgCh = supabase
      .channel('chat_messages_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        () => { fetchUnreadCounts() }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(notifCh)
      supabase.removeChannel(msgCh)
    }
  }, [user, fetchUnreadCounts])

  // eksplicitni refresh bez setTimeout-a
  const refreshCounts = useCallback(async () => {
    return fetchUnreadCounts()
  }, [fetchUnreadCounts])

  return {
    unreadNotifications,
    unreadMessages,
    loading,
    refreshCounts
  }
}
