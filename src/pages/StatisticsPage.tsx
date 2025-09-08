import React, { useState, useEffect } from 'react'
import { supabase, type Attendance } from '../lib/supabase'
import { BarChart3, Users, Calendar, Bell, TrendingUp, TrendingDown } from 'lucide-react'

const StatisticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalChildren: 0,
    totalAttendance: 0,
    totalNotifications: 0,
    attendanceRate: 0,
    usersByRole: { parents: 0, teachers: 0, admins: 0 },
    childrenByGroup: { 'Grupa A': 0, 'Grupa B': 0, 'Grupa C': 0 },
    monthlyAttendance: [] as { month: string; present: number; absent: number }[],
    recentActivity: [] as { type: string; description: string; date: string }[]
  })

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')

      if (usersError) throw usersError

      // Fetch children
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')

      if (childrenError) throw childrenError

      // Fetch attendance
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')

      if (attendanceError) throw attendanceError

      // Fetch notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (notificationsError) throw notificationsError

      // Calculate statistics
      const usersByRole = {
        parents: usersData?.filter(u => u.role === 'parent').length || 0,
        teachers: usersData?.filter(u => u.role === 'teacher').length || 0,
        admins: usersData?.filter(u => u.role === 'admin').length || 0
      }

      const childrenByGroup = {
        'Grupa A': childrenData?.filter(c => c.group_name === 'Grupa A').length || 0,
        'Grupa B': childrenData?.filter(c => c.group_name === 'Grupa B').length || 0,
        'Grupa C': childrenData?.filter(c => c.group_name === 'Grupa C').length || 0
      }

      const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0
      const totalAttendanceCount = attendanceData?.length || 0
      const attendanceRate = totalAttendanceCount > 0 ? Math.round((presentCount / totalAttendanceCount) * 100) : 0

      // Calculate monthly attendance
      const monthlyAttendance = calculateMonthlyAttendance(attendanceData || [])

      // Recent activity
      const recentActivity = [
        ...(notificationsData || []).map(n => ({
          type: 'notification',
          description: `Nova obaveštenja: ${n.title}`,
          date: n.created_at
        })),
        ...(attendanceData || []).slice(0, 5).map(a => ({
          type: 'attendance',
          description: `Evidencija prisustva`,
          date: a.created_at
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

      setStats({
        totalUsers: usersData?.length || 0,
        totalChildren: childrenData?.length || 0,
        totalAttendance: totalAttendanceCount,
        totalNotifications: notificationsData?.length || 0,
        attendanceRate,
        usersByRole,
        childrenByGroup,
        monthlyAttendance,
        recentActivity
      })
    } catch (error) {
      console.error('Error fetching statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateMonthlyAttendance = (attendance: Attendance[]) => {
    const monthlyData: { [key: string]: { present: number; absent: number } } = {}
    
    attendance.forEach(record => {
      const month = new Date(record.date).toLocaleDateString('sr-RS', { month: 'short', year: 'numeric' })
      if (!monthlyData[month]) {
        monthlyData[month] = { present: 0, absent: 0 }
      }
      if (record.status === 'present') {
        monthlyData[month].present++
      } else {
        monthlyData[month].absent++
      }
    })

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      present: data.present,
      absent: data.absent
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Statistike</h1>
          <p className="text-gray-600">Prisustvo, aktivnost, korišćenje</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ukupno korisnika</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ukupno dece</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalChildren}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Stopa prisustva</p>
                <p className="text-2xl font-bold text-gray-900">{stats.attendanceRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Bell className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Obaveštenja</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalNotifications}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Users by Role */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Korisnici po ulogama</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Roditelji</span>
                </div>
                <span className="font-semibold">{stats.usersByRole.parents}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Vaspitači</span>
                </div>
                <span className="font-semibold">{stats.usersByRole.teachers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Administracija</span>
                </div>
                <span className="font-semibold">{stats.usersByRole.admins}</span>
              </div>
            </div>
          </div>

          {/* Children by Group */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Deca po grupama</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Grupa A</span>
                </div>
                <span className="font-semibold">{stats.childrenByGroup['Grupa A']}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Grupa B</span>
                </div>
                <span className="font-semibold">{stats.childrenByGroup['Grupa B']}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-pink-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Grupa C</span>
                </div>
                <span className="font-semibold">{stats.childrenByGroup['Grupa C']}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Attendance */}
        {stats.monthlyAttendance.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Mesečno prisustvo</h2>
            <div className="space-y-4">
              {stats.monthlyAttendance.map((month, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{month.month}</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">{month.present} prisutni</span>
                      </div>
                      <div className="flex items-center">
                        <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                        <span className="text-sm text-red-600">{month.absent} odsutni</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${month.present + month.absent > 0 ? (month.present / (month.present + month.absent)) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Nedavna aktivnost</h2>
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {activity.type === 'notification' ? (
                      <Bell className="w-4 h-4 text-blue-500 mr-2" />
                    ) : (
                      <Calendar className="w-4 h-4 text-green-500 mr-2" />
                    )}
                    <span className="text-gray-700">{activity.description}</span>
                  </div>
                  <span className="text-sm text-gray-500">{formatDate(activity.date)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema aktivnosti</h3>
              <p className="text-gray-600">Aktivnost će se prikazati kada korisnici počnu da koriste sistem.</p>
            </div>
          )}
        </div>

        {/* Demo Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center mb-2">
            <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-sm font-medium text-blue-800">Demo statistike</h3>
          </div>
          <p className="text-sm text-blue-700">
            Ovo su demo statistike. U produkciji, statistike će se ažurirati u realnom vremenu na osnovu stvarnih podataka.
          </p>
        </div>
      </div>
    </div>
  )
}

export default StatisticsPage
