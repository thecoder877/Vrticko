import React, { useState, useEffect } from 'react'
import { supabase, type Note, type Child } from '../lib/supabase'
import { MessageSquare, Users, Send, Calendar } from 'lucide-react'

const TeacherNotesPage: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [newNote, setNewNote] = useState({
    child_id: '',
    message: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch all children
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .order('name')

      if (childrenError) throw childrenError
      setChildren(childrenData || [])

      // Fetch all notes
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select(`
          *,
          children!inner(name)
        `)
        .order('created_at', { ascending: false })

      if (notesError) throw notesError
      setNotes(notesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.child_id || !newNote.message.trim()) {
      alert('Molimo izaberite dete i unesite poruku')
      return
    }

    try {
      setSending(true)
      
      const { error } = await supabase
        .from('notes')
        .insert({
          child_id: newNote.child_id,
          message: newNote.message,
          teacher_id: (await supabase.auth.getUser()).data.user?.id
        })

      if (error) throw error

      setMessage('Beleška je uspešno poslata!')
      setNewNote({ child_id: '', message: '' })
      
      // Refresh notes
      await fetchData()
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error sending note:', error)
      setMessage('Greška pri slanju beleške')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSending(false)
    }
  }

  const getChildName = (childId: string) => {
    const child = children.find(c => c.id === childId)
    return child ? child.name : 'Nepoznato dete'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNotesForChild = (childId: string) => {
    return notes.filter(note => note.child_id === childId)
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Beleške roditeljima</h1>
          <p className="text-gray-600">Direktne beleške o deci za roditelje</p>
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
          {/* Send Note Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <Send className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold">Pošalji belešku</h2>
            </div>

            <form onSubmit={handleSendNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dete
                </label>
                <select
                  value={newNote.child_id}
                  onChange={(e) => setNewNote({ ...newNote, child_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Izaberite dete</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beleška
                </label>
                <textarea
                  value={newNote.message}
                  onChange={(e) => setNewNote({ ...newNote, message: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Napišite belešku o detetu..."
                  required
                />
              </div>

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
                    Pošalji belešku
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Templates */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <MessageSquare className="w-6 h-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold">Brzi šabloni</h2>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setNewNote({ ...newNote, message: 'Imao je odličan dan! Bila je vrlo aktivna u igri i pomagala je drugim decom. Posebno se istakla u crtanju.' })}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900">Pozitivna beleška</h3>
                <p className="text-sm text-gray-600">Beleška o dobrim aktivnostima</p>
              </button>

              <button
                onClick={() => setNewNote({ ...newNote, message: 'Danas je naučio novu pesmu i bio je vrlo ponosan što je mogao da je otpeva pred celom grupom. Takođe je pomogao da se pospremi igračke nakon igre.' })}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900">Dostignuće</h3>
                <p className="text-sm text-gray-600">Beleška o dostignuću</p>
              </button>

              <button
                onClick={() => setNewNote({ ...newNote, message: 'Molimo da donesete dodatnu odeću za dete, jer se često prlja tokom igre. Takođe, molimo da proverite da li ima sve potrebne školski pribor.' })}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900">Potrebe</h3>
                <p className="text-sm text-gray-600">Beleška o potrebama</p>
              </button>

              <button
                onClick={() => setNewNote({ ...newNote, message: 'Danas je bio malo umorniji od uobičajenog. Možda bi bilo dobro da se ranije spremi za spavanje. Inače je sve u redu.' })}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900">Zdravlje</h3>
                <p className="text-sm text-gray-600">Beleška o zdravlju</p>
              </button>
            </div>
          </div>
        </div>

        {/* Notes History */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <Calendar className="w-6 h-6 text-purple-600 mr-2" />
            <h2 className="text-xl font-semibold">Istorija beleški</h2>
          </div>

          {notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="border-l-4 border-blue-500 pl-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {getChildName(note.child_id)}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {formatDate(note.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700">{note.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema poslatih beleški</h3>
              <p className="text-gray-600">Kada pošaljete beleške roditeljima, pojaviće se ovde.</p>
            </div>
          )}
        </div>

        {/* Children List */}
        {children.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Users className="w-5 h-5 text-orange-600 mr-2" />
              <h2 className="text-lg font-semibold">Deca u grupi</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {children.map((child) => {
                const childNotes = getNotesForChild(child.id)
                return (
                  <div key={child.id} className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="font-medium text-gray-900">{child.name}</div>
                    <div className="text-sm text-gray-500">
                      {childNotes.length} beleška{childNotes.length !== 1 ? 'a' : ''}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherNotesPage
