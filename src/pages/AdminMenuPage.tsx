import React, { useState, useEffect } from 'react'
import { supabase, type Menu } from '../lib/supabase'
import { Utensils, Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react'

const AdminMenuPage: React.FC = () => {
  const [menu, setMenu] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Menu | null>(null)
  const [newMenu, setNewMenu] = useState({
    date: new Date().toISOString().split('T')[0],
    breakfast: '',
    lunch: '',
    snack: '',
    dinner: ''
  })

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    try {
      const { data, error } = await supabase
        .from('menu')
        .select('*')
        .order('date', { ascending: true })

      if (error) throw error
      setMenu(data || [])
    } catch (error) {
      console.error('Error fetching menu:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMenu.breakfast.trim() || !newMenu.lunch.trim() || !newMenu.snack.trim()) {
      alert('Molimo unesite doručak, ručak i užinu')
      return
    }

    try {
      setSaving(true)
      
      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('menu')
          .update(newMenu)
          .eq('id', editingItem.id)

        if (error) throw error
        setMessage('Jelovnik je uspešno ažuriran!')
      } else {
        // Create new item
        const { error } = await supabase
          .from('menu')
          .insert(newMenu)

        if (error) throw error
        setMessage('Jelovnik je uspešno dodat!')
      }

      setNewMenu({ date: new Date().toISOString().split('T')[0], breakfast: '', lunch: '', snack: '', dinner: '' })
      setShowForm(false)
      setEditingItem(null)
      await fetchMenu()
      
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      console.error('Error saving menu:', error)
      setMessage(`Greška pri čuvanju jelovnika: ${error.message}`)
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item: Menu) => {
    setEditingItem(item)
    setNewMenu({
      date: item.date,
      breakfast: item.breakfast,
      lunch: item.lunch,
      snack: item.snack,
      dinner: item.dinner || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovaj jelovnik?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('menu')
        .delete()
        .eq('id', id)

      if (error) throw error
      setMessage('Jelovnik je uspešno obrisan!')
      await fetchMenu()
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      console.error('Error deleting menu:', error)
      setMessage(`Greška pri brisanju jelovnika: ${error.message}`)
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

  const getMenuForDate = (date: string) => {
    return menu.find(item => item.date === date)
  }

  const getUniqueDates = () => {
    return [...new Set(menu.map(item => item.date))].sort()
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Upravljanje jelovnikom</h1>
              <p className="text-gray-600">Unos i izmena jelovnika</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Dodaj jelovnik
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
                {editingItem ? 'Izmeni jelovnik' : 'Dodaj novi jelovnik'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingItem(null)
                  setNewMenu({ date: new Date().toISOString().split('T')[0], breakfast: '', lunch: '', snack: '', dinner: '' })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datum
                </label>
                <input
                  type="date"
                  value={newMenu.date}
                  onChange={(e) => setNewMenu({ ...newMenu, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1 text-orange-500" />
                    Doručak
                  </label>
                  <textarea
                    value={newMenu.breakfast}
                    onChange={(e) => setNewMenu({ ...newMenu, breakfast: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Unesite doručak..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1 text-red-500" />
                    Ručak
                  </label>
                  <textarea
                    value={newMenu.lunch}
                    onChange={(e) => setNewMenu({ ...newMenu, lunch: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Unesite ručak..."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1 text-yellow-500" />
                    Užina
                  </label>
                  <textarea
                    value={newMenu.snack}
                    onChange={(e) => setNewMenu({ ...newMenu, snack: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Unesite užinu..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1 text-purple-500" />
                    Večera (opciono)
                  </label>
                  <textarea
                    value={newMenu.dinner}
                    onChange={(e) => setNewMenu({ ...newMenu, dinner: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Unesite večeru (opciono)..."
                  />
                </div>
              </div>

              {/* Quick Templates */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Brzi šabloni</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setNewMenu({
                      ...newMenu,
                      breakfast: 'Mleko, hleb sa maslacem, džem',
                      lunch: 'Čorba, pečenje sa krompirom, salata',
                      snack: 'Voće, keks'
                    })}
                    className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <h4 className="font-semibold text-gray-900">Standardni jelovnik</h4>
                    <p className="text-sm text-gray-600">Osnovni jelovnik za dane</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMenu({
                      ...newMenu,
                      breakfast: 'Jogurt sa voćem, müsli',
                      lunch: 'Riblja čorba, riba sa pirinčem, povrće',
                      snack: 'Smoothie, kolačići'
                    })}
                    className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <h4 className="font-semibold text-gray-900">Zdrav jelovnik</h4>
                    <p className="text-sm text-gray-600">Jelovnik sa fokusom na zdravlje</p>
                  </button>
                </div>
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
                    setNewMenu({ date: new Date().toISOString().split('T')[0], breakfast: '', lunch: '', snack: '', dinner: '' })
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Otkaži
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Menu Display */}
        {menu.length > 0 ? (
          <div className="space-y-6">
            {getUniqueDates().map((date) => {
              const menuItem = getMenuForDate(date)
              if (!menuItem) return null
              
              return (
                <div key={date} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                      <h2 className="text-lg font-semibold">{formatDate(date)}</h2>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(menuItem)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(menuItem.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h3 className="font-semibold text-orange-800 mb-2">Doručak</h3>
                      <p className="text-orange-700 text-sm">{menuItem.breakfast}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <h3 className="font-semibold text-red-800 mb-2">Ručak</h3>
                      <p className="text-red-700 text-sm">{menuItem.lunch}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h3 className="font-semibold text-yellow-800 mb-2">Užina</h3>
                      <p className="text-yellow-700 text-sm">{menuItem.snack}</p>
                    </div>
                    {menuItem.dinner && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h3 className="font-semibold text-purple-800 mb-2">Večera</h3>
                        <p className="text-purple-700 text-sm">{menuItem.dinner}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Utensils className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema jelovnika</h3>
            <p className="text-gray-600">Dodajte jelovnik da počnete sa upravljanjem.</p>
          </div>
        )}

      </div>
    </div>
  )
}

export default AdminMenuPage
