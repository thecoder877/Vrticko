import React, { useState, useEffect } from 'react'
import { supabase, type Schedule } from '../lib/supabase'
import { Calendar, Plus, Edit, Trash2, Clock } from 'lucide-react'

const SchedulePage: React.FC = () => {
  const [schedule, setSchedule] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Schedule | null>(null)
  const [newSchedule, setNewSchedule] = useState({
    date: new Date().toISOString().split('T')[0],
    activity: '',
    group_name: 'Grupa A'
  })

  useEffect(() => {
    fetchSchedule()
  }, [])

  const fetchSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('schedule')
        .select('*')
        .order('date', { ascending: true })

      if (error) throw error
      setSchedule(data || [])
    } catch (error) {
      console.error('Error fetching schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSchedule.activity.trim()) {
      alert('Molimo unesite aktivnost')
      return
    }

    try {
      setSaving(true)
      
      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('schedule')
          .update(newSchedule)
          .eq('id', editingItem.id)

        if (error) throw error
        setMessage('Raspored je uspešno ažuriran!')
      } else {
        // Create new item
        const { error } = await supabase
          .from('schedule')
          .insert(newSchedule)

        if (error) throw error
        setMessage('Aktivnost je uspešno dodana!')
      }

      setNewSchedule({ date: new Date().toISOString().split('T')[0], activity: '', group_name: 'Grupa A' })
      setShowForm(false)
      setEditingItem(null)
      await fetchSchedule()
      
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error saving schedule:', error)
      setMessage('Greška pri čuvanju rasporeda')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item: Schedule) => {
    setEditingItem(item)
    setNewSchedule({
      date: item.date,
      activity: item.activity,
      group_name: item.group_name
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovu aktivnost?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('schedule')
        .delete()
        .eq('id', id)

      if (error) throw error
      setMessage('Aktivnost je uspešno obrisana!')
      await fetchSchedule()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error deleting schedule:', error)
      setMessage('Greška pri brisanju aktivnosti')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-RS', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getScheduleForDate = (date: string) => {
    return schedule.filter(item => item.date === date)
  }

  const getUniqueDates = () => {
    return [...new Set(schedule.map(item => item.date))].sort()
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Raspored aktivnosti</h1>
              <p className="text-gray-600">Upravljanje rasporedom aktivnosti</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Dodaj aktivnost
            </button>
          </div>
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

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {editingItem ? 'Izmeni aktivnost' : 'Dodaj novu aktivnost'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingItem(null)
                  setNewSchedule({ date: new Date().toISOString().split('T')[0], activity: '', group_name: 'Grupa A' })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Datum
                  </label>
                  <input
                    type="date"
                    value={newSchedule.date}
                    onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grupa
                  </label>
                  <select
                    value={newSchedule.group_name}
                    onChange={(e) => setNewSchedule({ ...newSchedule, group_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Grupa A">Grupa A</option>
                    <option value="Grupa B">Grupa B</option>
                    <option value="Grupa C">Grupa C</option>
                    <option value="Sve grupe">Sve grupe</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aktivnost
                </label>
                <textarea
                  value={newSchedule.activity}
                  onChange={(e) => setNewSchedule({ ...newSchedule, activity: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Unesite opis aktivnosti..."
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {editingItem ? 'Ažuriraj' : 'Dodaj'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingItem(null)
                    setNewSchedule({ date: new Date().toISOString().split('T')[0], activity: '', group_name: 'Grupa A' })
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Otkaži
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Schedule Display */}
        {schedule.length > 0 ? (
          <div className="space-y-6">
            {getUniqueDates().map((date) => (
              <div key={date} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-semibold">{formatDate(date)}</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getScheduleForDate(date).map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-500 mr-1" />
                          <span className="text-sm font-medium text-gray-600">{item.group_name}</span>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-700">{item.activity}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema aktivnosti u rasporedu</h3>
            <p className="text-gray-600">Dodajte aktivnosti da kreirate raspored za grupu.</p>
          </div>
        )}

        {/* Quick Templates */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Brzi šabloni aktivnosti</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              'Crtanje i slikanje',
              'Igranje u dvorištu',
              'Čitanje priče',
              'Muzička aktivnost',
              'Ručak',
              'Spavanje',
              'Igra sa igračkama',
              'Plešni čas'
            ].map((activity) => (
              <button
                key={activity}
                onClick={() => setNewSchedule({ ...newSchedule, activity })}
                className="p-3 text-sm border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                {activity}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SchedulePage
