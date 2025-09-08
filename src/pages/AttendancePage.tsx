import React, { useState, useEffect } from 'react'
import { supabase, type Attendance, type Child } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'

const AttendancePage: React.FC = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const { user } = useAuth()

  useEffect(() => {
    fetchData()
  }, [selectedMonth])

  const fetchData = async () => {
    try {
      // Fetch children based on user role
      let childrenQuery = supabase
        .from('children')
        .select('*')

      // If user is parent, only fetch their children
      if (user?.role === 'parent') {
        childrenQuery = childrenQuery.eq('parent_id', user.id)
      }
      // Teachers and admins can see all children
      
      const { data: childrenData, error: childrenError } = await childrenQuery

      if (childrenError) throw childrenError
      setChildren(childrenData || [])

      // Fetch attendance for the selected month, only for children user can see
      const startDate = `${selectedMonth}-01`
      const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0)
        .toISOString().split('T')[0]

      let attendanceQuery = supabase
        .from('attendance')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)

      // If user is parent, only fetch attendance for their children
      if (user?.role === 'parent' && childrenData && childrenData.length > 0) {
        const childIds = childrenData.map(child => child.id)
        attendanceQuery = attendanceQuery.in('child_id', childIds)
      }
      // Teachers and admins can see all attendance
      
      const { data: attendanceData, error: attendanceError } = await attendanceQuery
        .order('date', { ascending: false })

      if (attendanceError) throw attendanceError
      setAttendance(attendanceData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAttendanceForChild = (childId: string) => {
    return attendance.filter(a => a.child_id === childId)
  }

  const getAttendanceStats = (childId: string) => {
    const childAttendance = getAttendanceForChild(childId)
    const present = childAttendance.filter(a => a.status === 'present').length
    const absent = childAttendance.filter(a => a.status === 'absent').length
    const total = present + absent
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0
    
    return { present, absent, total, percentage }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-RS', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const getStatusIcon = (status: string) => {
    if (status === 'present') {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  const getStatusText = (status: string) => {
    return status === 'present' ? 'Prisutan' : 'Odsutan'
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Prisustvo</h1>
          <p className="text-gray-600">Evidencija prisustva dece</p>
          
          {/* Overall Stats */}
          {children.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{children.length}</div>
                <div className="text-sm text-gray-600">Ukupno dece</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {children.reduce((sum, child) => sum + getAttendanceStats(child.id).present, 0)}
                </div>
                <div className="text-sm text-gray-600">Ukupno prisutnih</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {children.reduce((sum, child) => sum + getAttendanceStats(child.id).absent, 0)}
                </div>
                <div className="text-sm text-gray-600">Ukupno odsutnih</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {children.length > 0 ? Math.round(children.reduce((sum, child) => sum + getAttendanceStats(child.id).percentage, 0) / children.length) : 0}%
                </div>
                <div className="text-sm text-gray-600">Prosečno prisustvo</div>
              </div>
            </div>
          )}
        </div>

        {/* Month Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold">Izaberite mesec</h2>
            </div>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {children.length > 0 ? (
          <div className="space-y-6">
            {children.map((child) => {
              const stats = getAttendanceStats(child.id)
              const childAttendance = getAttendanceForChild(child.id)
              
              return (
                <div key={child.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      {child.photo_url ? (
                        <div className="w-16 h-16 rounded-full overflow-hidden">
                          <img 
                            src={child.photo_url} 
                            alt={`${child.name} fotografija`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-500 text-2xl">👶</span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{child.name}</h3>
                        <p className="text-gray-600">Prisustvo za {new Date(selectedMonth).toLocaleDateString('sr-RS', { month: 'long', year: 'numeric' })}</p>
                        {child.gender && (
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1">
                            {child.gender}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600 mb-2">{stats.percentage}%</div>
                      <div className="text-sm text-gray-600 mb-3">Prisustvo</div>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stats.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                      <div className="text-sm text-green-700 font-medium">Prisutan</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                      <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                      <div className="text-sm text-red-700 font-medium">Odsutan</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                      <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                      <div className="text-sm text-blue-700 font-medium">Ukupno</div>
                    </div>
                  </div>

                  {/* Attendance List */}
                  {childAttendance.length > 0 ? (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Detaljna evidencija</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {childAttendance.map((record) => (
                          <div key={record.id} className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                            record.status === 'present' 
                              ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                              : 'bg-red-50 border-red-200 hover:bg-red-100'
                          }`}>
                            <div className="flex items-center">
                              {getStatusIcon(record.status)}
                              <div className="ml-3">
                                <div className="text-sm font-semibold text-gray-900">
                                  {formatDate(record.date)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(record.date).toLocaleDateString('sr-RS', { weekday: 'long' })}
                                </div>
                              </div>
                            </div>
                            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                              record.status === 'present' 
                                ? 'text-green-700 bg-green-200' 
                                : 'text-red-700 bg-red-200'
                            }`}>
                              {getStatusText(record.status)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Nema evidencije</h4>
                      <p className="text-gray-600">Nema evidencije prisustva za izabrani mesec.</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema registrovanih dece</h3>
            <p className="text-gray-600">Kontaktirajte administraciju da registruje vaše dete u sistem.</p>
          </div>
        )}

        {/* Demo data notice */}
        {children.length === 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center mb-2">
              <Clock className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-sm font-medium text-blue-800">Demo podaci</h3>
            </div>
            <p className="text-sm text-blue-700">
              Ovo su demo podaci. U produkciji, vaspitači će unositi pravu evidenciju prisustva.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AttendancePage
