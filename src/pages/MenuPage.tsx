import React, { useState, useEffect } from 'react'
import { supabase, type Menu } from '../lib/supabase'
import { Calendar, Clock, Utensils } from 'lucide-react'

const MenuPage: React.FC = () => {
  const [menu, setMenu] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

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

  const getTodayMenu = () => {
    return menu.find(m => m.date === selectedDate)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-RS', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const todayMenu = getTodayMenu()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Jelovnik</h1>
          <p className="text-gray-600">Pregled dnevnog i nedeljnog jelovnika</p>
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold">Izaberite datum</h2>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Today's Menu */}
        {todayMenu ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <Utensils className="w-6 h-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold">Jelovnik za {formatDate(selectedDate)}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-orange-500 mr-2" />
                  <h3 className="font-semibold text-gray-900">Doručak</h3>
                </div>
                <p className="text-gray-700 pl-6">{todayMenu.breakfast}</p>

                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-red-500 mr-2" />
                  <h3 className="font-semibold text-gray-900">Ručak</h3>
                </div>
                <p className="text-gray-700 pl-6">{todayMenu.lunch}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-yellow-500 mr-2" />
                  <h3 className="font-semibold text-gray-900">Užina</h3>
                </div>
                <p className="text-gray-700 pl-6">{todayMenu.snack}</p>

                {todayMenu.dinner && (
                  <>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-purple-500 mr-2" />
                      <h3 className="font-semibold text-gray-900">Večera</h3>
                    </div>
                    <p className="text-gray-700 pl-6">{todayMenu.dinner}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema jelovnika za izabrani datum</h3>
            <p className="text-gray-600">Jelovnik za {formatDate(selectedDate)} još nije unet.</p>
          </div>
        )}

        {/* Weekly Menu Preview */}
        {menu.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Nedeljni pregled</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menu.slice(0, 7).map((menuItem) => (
                <div
                  key={menuItem.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    menuItem.date === selectedDate
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedDate(menuItem.date)}
                >
                  <h4 className="font-semibold text-sm text-gray-900">
                    {new Date(menuItem.date).toLocaleDateString('sr-RS', { weekday: 'short' })}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(menuItem.date).toLocaleDateString('sr-RS', { day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 truncate">{menuItem.breakfast}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MenuPage
