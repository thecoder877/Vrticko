import React, { useState, useEffect, useRef } from 'react'
import { supabase, type User, type ChatMessage } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useUnreadCounts } from '../hooks/useUnreadCounts'
import { markAllMessagesAsRead } from '../utils/markAsRead'
import Badge from '../components/Badge'
import { Send, MessageCircle, Users } from 'lucide-react'

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const { user } = useAuth()
  const { refreshCounts } = useUnreadCounts()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (users.length > 0 && user) {
      fetchUnreadCounts()
    }
  }, [users, user])

  useEffect(() => {
    if (!user) return

    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel('chat-messages-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          console.log('New message received, updating unread counts')
          fetchUnreadCounts()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, users])

  useEffect(() => {
    if (selectedUser) {
      fetchMessages()
    }
  }, [selectedUser])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchUsers = async () => {
    try {
      let usersQuery = supabase
        .from('users')
        .select('*')
        .neq('id', user?.id) // Exclude current user

      // Parents can see teachers and admins, teachers can see parents and admins, admins can see everyone
      if (user?.role === 'parent') {
        usersQuery = usersQuery.in('role', ['teacher', 'admin'])
      } else if (user?.role === 'teacher') {
        usersQuery = usersQuery.in('role', ['parent', 'admin'])
      }
      // Admins can see everyone

      const { data, error } = await usersQuery.order('username')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCounts = async () => {
    if (!user) return

    try {
      const counts: Record<string, number> = {}
      
      for (const person of users) {
        const { data: messages, error } = await supabase
          .from('chat_messages')
          .select('id, read_status')
          .eq('sender_id', person.id)
          .eq('receiver_id', user.id)

        if (error) {
          console.error(`Error fetching messages from ${person.id}:`, error)
          continue
        }

        const unreadCount = (messages || []).filter(message => {
          const readStatus = message.read_status || {}
          return !readStatus[user.id]
        }).length

        counts[person.id] = unreadCount
      }

      setUnreadCounts(counts)
    } catch (error) {
      console.error('Error fetching unread counts:', error)
    }
  }

  const fetchMessages = async () => {
    if (!selectedUser) return

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:users!chat_messages_sender_id_fkey(username, role)
        `)
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${selectedUser}),and(sender_id.eq.${selectedUser},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
      
      // Mark messages from selected user as read
      if (user) {
        markAllMessagesAsRead(user.id, selectedUser).then(() => {
          console.log('Messages marked as read, refreshing counts')
          refreshCounts()
          // Update local unread counts
          setUnreadCounts(prev => ({
            ...prev,
            [selectedUser]: 0
          }))
        })
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser) return

    try {
      setSending(true)
      
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: user?.id,
          receiver_id: selectedUser,
          message: newMessage.trim()
        })

      if (error) throw error

      setNewMessage('')
      await fetchMessages() // Refresh messages
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Greška pri slanju poruke')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('sr-RS', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'short'
    })
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user?.role === 'parent' 
              ? 'Chat sa vaspitačima i administratorima' 
              : user?.role === 'teacher' 
                ? 'Chat sa roditeljima i administratorima' 
                : 'Chat'
            }
          </h1>
          <p className="text-gray-600">
            {user?.role === 'parent' 
              ? 'Direktna komunikacija sa vaspitačima i administratorima' 
              : user?.role === 'teacher'
                ? 'Direktna komunikacija sa roditeljima i administratorima'
                : 'Direktna komunikacija sa svim korisnicima'
            }
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex h-[600px]">
            {/* Users List */}
            <div className="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  {user?.role === 'parent' 
                    ? 'Vaspitači i administratori' 
                    : user?.role === 'teacher' 
                      ? 'Roditelji i administratori' 
                      : 'Korisnici'
                  }
                </h2>
              </div>
              <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {users.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => setSelectedUser(person.id)}
                    className={`w-full text-left p-4 border-b border-gray-200 hover:bg-gray-100 transition-colors relative ${
                      selectedUser === person.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{person.username}</div>
                        <div className="text-sm text-gray-500">{person.email}</div>
                        <div className="text-xs text-gray-400 capitalize">{person.role}</div>
                      </div>
                      {unreadCounts[person.id] > 0 && (
                        <Badge count={unreadCounts[person.id]} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {users.find(u => u.id === selectedUser)?.username}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {users.find(u => u.id === selectedUser)?.email}
                    </p>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => {
                      const isOwnMessage = message.sender_id === user?.id
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isOwnMessage
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <p className={`text-xs mt-1 ${
                              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <form onSubmit={sendMessage} className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Unesite poruku..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Izaberite korisnika za početak razgovora</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatPage
