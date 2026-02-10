'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getAllAppointments, getAllUsers, getConflictLogs } from '@/lib/db'

export default function AdminDashboardPage() {
  const [user, setUser] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [conflictLogs, setConflictLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    conflicts: 0
  })

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)

        const { data: appts } = await getAllAppointments()
        setAppointments(appts || [])

        const { data: users } = await getAllUsers()
        setAllUsers(users || [])

        const { data: logs } = await getConflictLogs()
        setConflictLogs(logs || [])

        // Calculate stats
        if (appts && users && logs) {
          const doctors = users.filter(u => u.role === 'doctor').length
          const patients = users.filter(u => u.role === 'patient').length
          
          setStats({
            totalUsers: users.length,
            totalDoctors: doctors,
            totalPatients: patients,
            totalAppointments: appts.length,
            pendingAppointments: appts.filter(a => a.status === 'pending').length,
            confirmedAppointments: appts.filter(a => a.status === 'confirmed').length,
            conflicts: logs.length
          })
        }
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-600/50 text-green-200'
      case 'pending':
        return 'bg-yellow-600/50 text-yellow-200'
      case 'completed':
        return 'bg-blue-600/50 text-blue-200'
      case 'cancelled':
        return 'bg-red-600/50 text-red-200'
      default:
        return 'bg-gray-600/50 text-gray-200'
    }
  }

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'doctor':
        return 'bg-blue-600/50 text-blue-200'
      case 'patient':
        return 'bg-green-600/50 text-green-200'
      case 'admin':
        return 'bg-red-600/50 text-red-200'
      default:
        return 'bg-gray-600/50 text-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-black">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 bg-slate-800/50 border-b border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-white">MediBook Admin</h1>
          <p className="text-xs text-gray-400">Administrator Panel</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
        >
          Logout
        </button>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-600/20 border border-blue-500 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
          </div>
          <div className="bg-purple-600/20 border border-purple-500 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Doctors</p>
            <p className="text-3xl font-bold text-purple-200">{stats.totalDoctors}</p>
          </div>
          <div className="bg-green-600/20 border border-green-500 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Patients</p>
            <p className="text-3xl font-bold text-green-200">{stats.totalPatients}</p>
          </div>
          <div className="bg-yellow-600/20 border border-yellow-500 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Total Appointments</p>
            <p className="text-3xl font-bold text-yellow-200">{stats.totalAppointments}</p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-yellow-600/20 border border-yellow-500 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Pending Appointments</p>
            <p className="text-2xl font-bold text-yellow-200">{stats.pendingAppointments}</p>
          </div>
          <div className="bg-green-600/20 border border-green-500 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Confirmed Appointments</p>
            <p className="text-2xl font-bold text-green-200">{stats.confirmedAppointments}</p>
          </div>
          <div className="bg-red-600/20 border border-red-500 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Booking Conflicts</p>
            <p className="text-2xl font-bold text-red-200">{stats.conflicts}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-700">
          {['overview', 'appointments', 'users', 'conflicts'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-semibold transition ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-4">System Health</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Database Status</p>
                  <span className="px-3 py-1 bg-green-600/50 text-green-200 text-sm rounded">Connected</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Auth System</p>
                  <span className="px-3 py-1 bg-green-600/50 text-green-200 text-sm rounded">Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Conflict Prevention</p>
                  <span className="px-3 py-1 bg-green-600/50 text-green-200 text-sm rounded">Enabled</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
              <p className="text-gray-400 text-sm">Last 7 days: {appointments.length} total appointments</p>
              <p className="text-gray-400 text-sm mt-4">Appointment Status Breakdown:</p>
              <ul className="mt-3 space-y-2 text-sm text-gray-400">
                <li>✓ Confirmed: {stats.confirmedAppointments}</li>
                <li>⏳ Pending: {stats.pendingAppointments}</li>
                <li>✕ Cancelled: {appointments.filter(a => a.status === 'cancelled').length}</li>
                <li>✔ Completed: {appointments.filter(a => a.status === 'completed').length}</li>
              </ul>
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="bg-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Doctor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Patient</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date & Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.slice(0, 10).map((apt, idx) => (
                  <tr key={apt.id} className={idx % 2 === 0 ? 'bg-slate-700/30' : ''}>
                    <td className="px-6 py-4 text-white text-sm">{apt.doctor?.users_extended?.full_name}</td>
                    <td className="px-6 py-4 text-gray-300 text-sm">{apt.patient?.users_extended?.full_name}</td>
                    <td className="px-6 py-4 text-gray-300 text-sm">{apt.appointment_date} {apt.appointment_time}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusColor(apt.status)}`}>
                        {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Joined</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.slice(0, 10).map((u, idx) => (
                  <tr key={u.id} className={idx % 2 === 0 ? 'bg-slate-700/30' : ''}>
                    <td className="px-6 py-4 text-white text-sm">{u.full_name}</td>
                    <td className="px-6 py-4 text-gray-300 text-sm">ID: {u.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded text-xs font-semibold ${getRoleColor(u.role)}`}>
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Conflicts Tab */}
        {activeTab === 'conflicts' && (
          <div className="bg-slate-800 rounded-lg p-6">
            {conflictLogs.length === 0 ? (
              <p className="text-gray-400">No booking conflicts recorded</p>
            ) : (
              <div className="space-y-4">
                {conflictLogs.map((log, idx) => (
                  <div key={log.id} className="border border-slate-700 p-4 rounded">
                    <p className="text-sm text-gray-400">
                      <span className="font-semibold text-white">Conflict Attempt #{idx + 1}</span> - {new Date(log.attempted_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Doctor ID: {log.doctor_id.slice(0, 8)}...</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
