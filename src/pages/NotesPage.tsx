import React, { useState, useEffect } from 'react'
import { supabase, type Note, type Child } from '../lib/supabase'
import { MessageSquare, User, Calendar, Heart } from 'lucide-react'

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch children for current user
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')

      if (childrenError) throw childrenError
      setChildren(childrenData || [])

      // Fetch notes for children
      if (childrenData && childrenData.length > 0) {
        const childIds = childrenData.map(child => child.id)
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select(`
            *,
            children!inner(name)
          `)
          .in('child_id', childIds)
          .order('created_at', { ascending: false })

        if (notesError) throw notesError
        setNotes(notesData || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
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

  const getChildName = (childId: string) => {
    const child = children.find(c => c.id === childId)
    return child ? child.name : 'Nepoznato dete'
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Beleške vaspitača</h1>
          <p className="text-gray-600">Direktne beleške od vaspitača o vašem detetu</p>
        </div>

        {notes.length > 0 ? (
          <div className="space-y-6">
            {notes.map((note) => (
              <div key={note.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getChildName(note.child_id)}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(note.created_at)}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 leading-relaxed">{note.message}</p>
                    </div>
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                      <User className="w-4 h-4 mr-1" />
                      Vaspitač
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema novih beleški</h3>
            <p className="text-gray-600">Kada vaspitači napišu beleške o vašem detetu, pojaviće se ovde.</p>
          </div>
        )}

        {/* Demo notes */}
        {notes.length === 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Heart className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-sm font-medium text-blue-800">Demo beleške</h3>
            </div>
            <p className="text-sm text-blue-700 mb-4">
              Ovo su demo beleške. U produkciji, vaspitači će pisati prave beleške o deci.
            </p>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Ana Petrović</h4>
                  <span className="text-sm text-gray-500">Pre 2 dana</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-700 text-sm">
                    Ana je imala odličan dan! Bila je vrlo aktivna u igri i pomagala je drugim decom. 
                    Posebno se istakla u crtanju - napravila je prelepu sliku svoje porodice.
                  </p>
                </div>
                <div className="mt-2 text-xs text-gray-500">Vaspitač Marko</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Ana Petrović</h4>
                  <span className="text-sm text-gray-500">Pre 1 nedelju</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-700 text-sm">
                    Ana je danas naučila novu pesmu i bila je vrlo ponosna što je mogla da je otpeva 
                    pred celom grupom. Takođe je pomogla da se pospremi igračke nakon igre.
                  </p>
                </div>
                <div className="mt-2 text-xs text-gray-500">Vaspitač Marko</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NotesPage
