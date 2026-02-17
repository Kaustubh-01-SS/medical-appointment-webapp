'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function DashboardPage() {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
  })

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return

      // Get user name from users_extended
      const { data: profile } = await supabase
        .from('users_extended')
        .select('full_name')
        .eq('id', auth.user.id)
        .single()

      setName(profile?.full_name || auth.user.email?.split('@')[0] || 'User')

      // Get appointments
      const { data: appts } = await supabase
        .from('appointments')
        .select('id, date, time, status')
        .eq('patient_id', auth.user.id)
        .order('date', { ascending: true })

      setAppointments(appts || [])

      setStats({
        total: appts.length,
        confirmed: appts.filter(a => a.status === 'approved').length,
        pending: appts.filter(a => a.status === 'pending').length,
      })

      setLoading(false)
    }

    loadDashboard()
  }, [])

  return (
    <>
      {/* Welcome */}
      <section className="mb-10">
        <h1 className="text-3xl font-bold mb-1">
          Welcome, {name}
        </h1>
        <p className="text-gray-300">
          Manage your medical appointments and health records
        </p>
      </section>

      {/* Actions */}
      <section className="flex flex-wrap gap-4 mb-10">
        <Link
          href="/book"
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded flex items-center gap-2 font-medium"
        >
          📅 Book New Appointment
        </Link>

        <Link
          href="/records"
          className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded flex items-center gap-2 font-medium"
        >
          📄 View Medical Records
        </Link>
      </section>

      {/* Appointments */}
      <section className="bg-white/5 rounded-xl p-6 mb-10">
        <h2 className="text-xl font-semibold mb-4">
          Your Appointments
        </h2>

        {loading && (
          <div className="text-center py-10 text-gray-400">
            Loading appointments...
          </div>
        )}

        {!loading && appointments.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            No appointments scheduled yet.
            <div className="mt-2">
              <Link href="/book" className="text-blue-400 hover:underline">
                Schedule your first appointment →
              </Link>
            </div>
          </div>
        )}

        {!loading && appointments.length > 0 && (
          <div className="space-y-3">
            {appointments.map(appt => (
              <div
                key={appt.id}
                className="flex justify-between items-center bg-white/10 p-4 rounded"
              >
                <div>
                  <p className="font-medium">
                    {appt.date} at {appt.time}
                  </p>
                  <p className="text-sm text-gray-300 capitalize">
                    Status: {appt.status}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 text-sm rounded-full ${
                    appt.status === 'approved'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-yellow-500/20 text-yellow-300'
                  }`}
                >
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Total Appointments" value={stats.total} />
        <StatCard title="Confirmed" value={stats.confirmed} />
        <StatCard title="Pending" value={stats.pending} />
      </section>
    </>
  )
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white/5 rounded-xl p-6">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  )
}
