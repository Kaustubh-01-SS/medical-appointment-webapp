'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getDoctorAppointments, updateAppointmentStatus } from '@/lib/db'
import UserAvatar from '@/components/UserAvatar'

export default function DoctorDashboardPage() {
  const [user, setUser] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0 })

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)

        const { data: appts } = await getDoctorAppointments(session.user.id)
        setAppointments(appts || [])

        // Calculate stats
        if (appts) {
          setStats({
            total: appts.length,
            pending: appts.filter(a => a.status === 'pending').length,
            confirmed: appts.filter(a => a.status === 'confirmed').length,
            completed: appts.filter(a => a.status === 'completed').length
          })
        }
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  const handleApprove = async (appointmentId) => {
    const { error: updateError } = await updateAppointmentStatus(appointmentId, 'confirmed')
    
    if (!updateError) {
      setAppointments(appointments.map(apt => 
        apt.id === appointmentId ? { ...apt, status: 'confirmed' } : apt
      ))
      setStats({
        ...stats,
        pending: stats.pending - 1,
        confirmed: stats.confirmed + 1
      })
    }
  }

  const handleReject = async (appointmentId) => {
    if (confirm('Reject this appointment?')) {
      const { error: updateError } = await updateAppointmentStatus(appointmentId, 'cancelled')
      
      if (!updateError) {
        setAppointments(appointments.map(apt => 
          apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt
        ))
        setStats({
          ...stats,
          pending: stats.pending - 1,
        })
      }
    }
  }

  const handleComplete = async (appointmentId) => {
    const { error: updateError } = await updateAppointmentStatus(appointmentId, 'completed')
    
    if (!updateError) {
      setAppointments(appointments.map(apt => 
        apt.id === appointmentId ? { ...apt, status: 'completed' } : apt
      ))
      setStats({
        ...stats,
        confirmed: stats.confirmed - 1,
        completed: stats.completed + 1
      })
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
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

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-teal-50">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-4 bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">♥</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-teal-600">MediBook Doctor</h1>
            <p className="text-xs text-gray-500">Dr. {user?.email?.split('@')[0]}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <UserAvatar />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Dashboard</h1>
          <p className="text-gray-600">Manage your appointments and patient appointments</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total Appointments</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Confirmed</p>
            <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
          </div>
        </div>

        {/* Appointments */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Appointments</h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No appointments yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-600 border-b">
                    <th className="px-6 py-3">Patient</th>
                    <th className="px-6 py-3">Date & Time</th>
                    <th className="px-6 py-3">Reason</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt, idx) => (
                    <tr key={apt.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 text-gray-900">
                        <div>
                          <p className="font-semibold">{apt.patient?.users_extended?.full_name}</p>
                          <p className="text-xs text-gray-500">{apt.patient?.users_extended?.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 text-sm">
                        {new Date(apt.appointment_date).toLocaleDateString()} {apt.appointment_time}
                      </td>
                      <td className="px-6 py-4 text-gray-700 text-sm">{apt.reason_for_visit}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusColor(apt.status)}`}>
                          {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2 flex">
                        {apt.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(apt.id)}
                              className="px-3 py-1 bg-linear-to-r from-teal-600 to-blue-600 text-white text-xs rounded transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(apt.id)}
                              className="px-3 py-1 border border-red-300 text-red-600 text-xs rounded transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {apt.status === 'confirmed' && (
                          <button
                            onClick={() => handleComplete(apt.id)}
                            className="px-3 py-1 bg-linear-to-r from-teal-600 to-blue-600 text-white text-xs rounded transition"
                          >
                            Mark Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Doctor Availability Management */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Availability Management</h2>
          <p className="text-gray-600">
            To manage your availability schedule, please contact the admin or use the doctor profile settings.
          </p>
        </div>
      </div>
    </div>
  )
}
