'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { logError } from '@/lib/errorHandler'
import { useRouter } from 'next/navigation'

export default function UserAvatar() {
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return

      // Fetch extended profile (users_extended) for full name
      const { data: profileData, error: profileError } = await supabase
        .from('users_extended')
        .select('full_name')
        .eq('id', auth.user.id)
        .single()
      if (profileError) {
        logError('UserAvatar.fetchProfile', profileError)
        setName(auth.user.email?.split('@')[0] || 'User')
      } else {
        setName(profileData?.full_name || auth.user.email?.split('@')[0] || 'User')
      }
    }

    fetchUser()
  }, [])

  const logout = async () => {
    setOpen(false)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        logError('UserAvatar.logout', error)
        return
      }
      router.replace('/login')
    } catch (err) {
      logError('UserAvatar.logout - unexpected error', err)
    }
  }
  const initial = (name && name.trim().charAt(0) && name.trim().charAt(0).toUpperCase()) || 'U'

  return (
    <div className="relative">
      {/* Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={`User menu for ${name || 'user'}`}
        className="flex items-center gap-3 bg-white/10 px-3 py-2 rounded-full hover:bg-white/20 transition"
      >
        {/* Avatar Circle */}
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold uppercase">
          {initial}
        </div>

        {/* Name */}
        <span className="text-white font-medium hidden sm:block">
          {name}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-gradient-to-br from-teal-600 to-blue-600 rounded-lg shadow-lg overflow-hidden z-50">
          <button
            onClick={() => router.push('/doctor-dashboard')}
            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition"
          >
            Dashboard
          </button>

          <button
            onClick={logout}
            className="w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-white/10 transition font-semibold"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
