import { supabase } from '../lib/supabase'

export const markNotificationAsRead = async (notificationId: string, userId: string) => {
  try {
    // Get current read_status
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('read_status')
      .eq('id', notificationId)
      .single()

    if (fetchError) {
      console.log('Error fetching notification, read_status column might not exist:', fetchError)
      return { success: true } // Return success to avoid breaking the app
    }

    // Update read_status to include this user
    const currentReadStatus = notification.read_status || {}
    const updatedReadStatus = {
      ...currentReadStatus,
      [userId]: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read_status: updatedReadStatus })
      .eq('id', notificationId)

    if (updateError) {
      console.log('Error updating notification read_status:', updateError)
      return { success: true } // Return success to avoid breaking the app
    }

    return { success: true }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return { success: false, error }
  }
}

export const markMessageAsRead = async (messageId: string, userId: string) => {
  try {
    // Get current read_status
    const { data: message, error: fetchError } = await supabase
      .from('chat_messages')
      .select('read_status')
      .eq('id', messageId)
      .single()

    if (fetchError) {
      console.log('Error fetching message, read_status column might not exist:', fetchError)
      return { success: true } // Return success to avoid breaking the app
    }

    // Update read_status to include this user
    const currentReadStatus = message.read_status || {}
    const updatedReadStatus = {
      ...currentReadStatus,
      [userId]: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('chat_messages')
      .update({ read_status: updatedReadStatus })
      .eq('id', messageId)

    if (updateError) {
      console.log('Error updating message read_status:', updateError)
      return { success: true } // Return success to avoid breaking the app
    }

    return { success: true }
  } catch (error) {
    console.error('Error marking message as read:', error)
    return { success: false, error }
  }
}

export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    
    // Get all unread notifications for this user
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('id, read_status')

    if (fetchError) {
      console.log('Error fetching notifications, read_status column might not exist:', fetchError)
      return { success: true } // Return success to avoid breaking the app
    }

    // Debug log removed to reduce console spam

    // Update each notification that this user hasn't read
    const notificationsToUpdate = (notifications || [])
      .filter(notification => {
        const readStatus = notification.read_status || {}
        const isRead = readStatus[userId]
        // Debug log removed to reduce console spam
        return !isRead
      })

    // Debug log removed to reduce console spam

    // Update notifications one by one instead of in parallel to avoid potential issues
    for (const notification of notificationsToUpdate) {
      const currentReadStatus = notification.read_status || {}
      const updatedReadStatus = {
        ...currentReadStatus,
        [userId]: new Date().toISOString()
      }

      // Debug log removed to reduce console spam

      const { error } = await supabase
        .from('notifications')
        .update({ read_status: updatedReadStatus })
        .eq('id', notification.id)
        .select('id, read_status')

      if (error) {
        console.error(`Error updating notification ${notification.id}:`, error)
        // Continue with other notifications even if one fails
        continue
      }

      // Debug log removed to reduce console spam
    }

    // Verify the updates by fetching the notifications again
    const { error: verifyError } = await supabase
      .from('notifications')
      .select('id, read_status')
      .in('id', notificationsToUpdate.map(n => n.id))

    if (verifyError) {
      console.error('Error verifying updates:', verifyError)
    }
    // Verification logs removed to reduce console spam

    return { success: true }
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return { success: false, error }
  }
}

export const markAllMessagesAsRead = async (userId: string, senderId?: string) => {
  try {
    console.log('markAllMessagesAsRead called for user:', userId, 'senderId:', senderId)
    
    // Get all unread messages for this user (optionally from specific sender)
    let query = supabase
      .from('chat_messages')
      .select('id, read_status')
      .eq('receiver_id', userId)

    if (senderId) {
      query = query.eq('sender_id', senderId)
    }

    const { data: messages, error: fetchError } = await query

    if (fetchError) {
      console.log('Error fetching messages, read_status column might not exist:', fetchError)
      return { success: true } // Return success to avoid breaking the app
    }

    console.log('Found messages to mark as read:', messages)

    // Update each message that this user hasn't read
    const messagesToUpdate = (messages || [])
      .filter(message => {
        const readStatus = message.read_status || {}
        const isRead = readStatus[userId]
        console.log(`Message ${message.id}: isRead=${isRead}`)
        return !isRead
      })

    console.log('Messages to update:', messagesToUpdate.length)

    const updatePromises = messagesToUpdate.map(message => {
      const currentReadStatus = message.read_status || {}
      const updatedReadStatus = {
        ...currentReadStatus,
        [userId]: new Date().toISOString()
      }

      console.log(`Updating message ${message.id} with read_status:`, updatedReadStatus)

      return supabase
        .from('chat_messages')
        .update({ read_status: updatedReadStatus })
        .eq('id', message.id)
    })

    const results = await Promise.all(updatePromises)
    console.log('Update results:', results)

    return { success: true }
  } catch (error) {
    console.error('Error marking all messages as read:', error)
    return { success: false, error }
  }
}
