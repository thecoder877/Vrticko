import React, { useState, useEffect } from 'react'
import { supabase, type Attendance, type Child } from '../lib/supabase'
import { Calendar, CheckCircle, XCircle, Users } from 'lucide-react'

const TeacherAttendancePage: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
    try {
      // Fetch all children
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .order('name')

      if (childrenError) throw childrenError
      setChildren(childrenData || [])

      // Fetch attendance for selected date
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', selectedDate)

      if (attendanceError) throw attendanceError
      setAttendance(attendanceData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAttendanceForChild = (childId: string) => {
    return attendance.find(a => a.child_id === childId)
  }

  const updateAttendance = async (childId: string, status: 'present' | 'absent') => {
    try {
      setSaving(true)
      
      const existingAttendance = getAttendanceForChild(childId)
      
      if (existingAttendance && !existingAttendance.id.startsWith('temp-')) {
        // Update existing record (only if it has a real UUID, not temp ID)
        const { error } = await supabase
          .from('attendance')
          .update({ status })
          .eq('id', existingAttendance.id)
        
        if (error) throw error
        
        // Update local state with existing record
        const updatedAttendance = attendance.map(a => 
          a.id === existingAttendance.id 
            ? { ...a, status }
            : a
        )
        setAttendance(updatedAttendance)
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('attendance')
          .insert({
            child_id: childId,
            date: selectedDate,
            status
          })
          .select()
          .single()
        
        if (error) throw error
        
        // Update local state with new record from database
        const updatedAttendance = attendance.filter(a => a.child_id !== childId)
        setAttendance([...updatedAttendance, data])
      }
    } catch (error) {
      console.error('Error updating attendance:', error)
      alert('Greška pri čuvanju prisustva')
    } finally {
      setSaving(false)
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

  const getAttendanceStats = () => {
    const present = attendance.filter(a => a.status === 'present').length
    const absent = attendance.filter(a => a.status === 'absent').length
    const total = children.length
    const notMarked = total - present - absent
    
    return { present, absent, total, notMarked }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const stats = getAttendanceStats()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Evidencija prisustva</h1>
          <p className="text-gray-600">Check-in/out dece u grupi</p>
          
          {/* Overall Stats */}
          {children.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{children.length}</div>
                <div className="text-sm text-gray-600">Ukupno dece</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                <div className="text-sm text-gray-600">Prisutnih</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                <div className="text-sm text-gray-600">Odsutnih</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.notMarked}</div>
                <div className="text-sm text-gray-600">Nije označeno</div>
              </div>
            </div>
          )}
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold">Datum: {formatDate(selectedDate)}</h2>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>


        {/* Children List */}
        {children.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <Users className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold">Lista dece</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => {
                const childAttendance = getAttendanceForChild(child.id)
                const status = childAttendance?.status
                
                return (
                  <div key={child.id} className={`rounded-lg p-4 hover:shadow-md transition-all border-2 ${
                    status === 'present' 
                      ? 'border-green-300 bg-green-50' 
                      : status === 'absent' 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-yellow-300 bg-yellow-50'
                  }`}>
                    <div className="flex items-center space-x-3 mb-3">
                      {child.photo_url ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden">
                          <img 
                            src={child.photo_url} 
                            alt={`${child.name} fotografija`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-500 text-lg">👶</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{child.name}</h3>
                        {child.gender && (
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {child.gender}
                          </span>
                        )}
                      </div>
                      {status && (
                        <div className={`flex items-center ${
                          status === 'present' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {status === 'present' ? (
                            <CheckCircle className="w-5 h-5 mr-1" />
                          ) : (
                            <XCircle className="w-5 h-5 mr-1" />
                          )}
                          <span className="text-sm font-medium">
                            {status === 'present' ? 'Prisutan' : 'Odsutan'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateAttendance(child.id, 'present')}
                        disabled={saving}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                          status === 'present'
                            ? 'bg-green-600 text-white'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Prisutan
                      </button>
                      <button
                        onClick={() => updateAttendance(child.id, 'absent')}
                        disabled={saving}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                          status === 'absent'
                            ? 'bg-red-600 text-white'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <XCircle className="w-4 h-4 inline mr-1" />
                        Odsutan
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema registrovanih dece</h3>
            <p className="text-gray-600">Kontaktirajte administraciju da registruje decu u sistem.</p>
          </div>
        )}

        {/* Demo notice */}
        {children.length === 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center mb-2">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-sm font-medium text-blue-800">Demo podaci</h3>
            </div>
            <p className="text-sm text-blue-700">
              Ovo su demo podaci. U produkciji, administracija će registrovati decu u sistem.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherAttendancePage
