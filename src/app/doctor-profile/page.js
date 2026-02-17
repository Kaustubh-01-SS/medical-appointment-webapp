'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logError, getErrorMessage } from '@/lib/errorHandler'

export default function DoctorProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)
  const [doctor, setDoctor] = useState(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (!session?.user) {
          router.replace('/login')
          return
        }

        const userId = session.user.id

        // Fetch extended user profile to confirm role
        const { data: userExt, error: userExtError } = await supabase
          .from('users_extended')
          .select('*')
          .eq('id', userId)
          .single()

        if (userExtError) {
          throw userExtError
        }

        if (userExt.role !== 'doctor') {
          // Only doctors can access this page
          router.replace('/')
          return
        }

        setProfile(userExt)

        // Fetch doctor table row
        const { data: doctorRow, error: doctorError } = await supabase
          .from('doctors')
          .select('*')
          .eq('id', userId)
          .single()

        if (doctorError) {
          // Log but do not block page completely
          logError('DoctorProfile.fetchDoctor', doctorError)
        } else {
          setDoctor(doctorRow)
        }
      } catch (err) {
        logError('DoctorProfile.loadProfile', err)
        setError(getErrorMessage(err) || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md text-center">
          {error}
        </div>
      </main>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Navbar (match home theme) */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-4 bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">♥</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-teal-600">MediBook Doctor</h1>
            <p className="text-xs text-gray-500">Doctor Profile</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/doctor-dashboard')}
          className="px-4 py-2 bg-linear-to-r from-teal-600 to-blue-600 text-white rounded-lg font-semibold hover:opacity-90 transition text-sm"
        >
          Back to Dashboard
        </button>
      </nav>

      {/* Content */}
      <section className="px-6 md:px-12 py-12 max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold mb-2">Your Profile</h2>
        <p className="text-gray-600 mb-8">
          View your professional details as seen by patients when booking appointments.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Basic info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Basic Information</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Full Name</dt>
                <dd className="font-semibold text-gray-900 text-right">{profile.full_name || 'Not set'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Role</dt>
                <dd className="font-semibold text-gray-900 text-right">Doctor</dd>
              </div>
              {profile.phone && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Phone</dt>
                  <dd className="font-semibold text-gray-900 text-right">{profile.phone}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Joined</dt>
                <dd className="font-semibold text-gray-900 text-right">
                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Right: Doctor details */}
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Doctor Details</h3>

            {doctor ? (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Specialization</dt>
                  <dd className="font-semibold text-gray-900 text-right">
                    {doctor.specialization || 'Not set'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Experience</dt>
                  <dd className="font-semibold text-gray-900 text-right">
                    {doctor.experience_years != null ? `${doctor.experience_years} years` : 'Not set'}
                  </dd>
                </div>
                {doctor.license_number && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">License Number</dt>
                    <dd className="font-semibold text-gray-900 text-right">
                      {doctor.license_number}
                    </dd>
                  </div>
                )}
                {doctor.bio && (
                  <div className="pt-2 border-t border-blue-100 mt-2">
                    <dt className="text-gray-600 mb-1">Bio</dt>
                    <dd className="text-gray-800 text-sm leading-relaxed">
                      {doctor.bio}
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-gray-600 text-sm">
                Your doctor profile record has not been created yet. Please contact the administrator
                if this persists after registration.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

