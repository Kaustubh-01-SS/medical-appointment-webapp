# Supabase Integration Quick Reference

**For:** Medical Appointment Webapp  
**Updated:** February 16, 2026

---

## 📚 Import Cheat Sheet

### Client Components (Browser)

```javascript
'use client'

// New recommended way
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// Or singleton (prevents multiple instances)
import { getSupabaseClient } from '@/lib/supabase/client'
const supabase = getSupabaseClient()
```

### Server Components & Route Handlers

```javascript
// Route Handler
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  const supabase = await createClient()
  const { data } = await supabase.from('users').select()
  return Response.json({ data })
}

// Server Component
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return <p>{user?.email}</p>
}

// Server Action
'use server'
import { createClient } from '@/lib/supabase/server'

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
```

### Admin/Service Role Operations (Server Only!)

```javascript
import { createAdminClient } from '@/lib/supabase/server'

export async function deleteUserAdmin(userId) {
  const admin = await createAdminClient()
  await admin.auth.admin.deleteUser(userId)
}
```

---

## 🔑 Environment Variables

### Required (Get from Supabase Dashboard)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...     # Server-side only!
```

### Finding Your Keys

1. Go to: https://supabase.com/dashboard/project/_/settings/api-keys
2. Copy URL from "Project URL"
3. Copy key from "Publish key" or "Anon key" (for NEXT_PUBLIC_SUPABASE_ANON_KEY)
4. Copy "Service Role Key" (keep SECRET!)

---

## 🎯 Common Code Patterns

### Auth - Sign Up

```javascript
const supabase = createClient()

const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      role: 'patient',           // Custom metadata
      full_name: 'John Doe'
    }
  }
})

if (error) console.error('Signup failed:', error.message)
else console.log('Signup success. Check email for confirmation.')
```

### Auth - Sign In

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

if (error) console.error('Login failed:', error.message)
else {
  const userRole = data.user.user_metadata?.role
  console.log('Logged in as:', userRole)
}
```

### Auth - Get Current User

```javascript
// Server-side (SAFE)
const supabase = await createClient()
const { data: { user }, error } = await supabase.auth.getUser()

if (error || !user) {
  redirect('/login')  // Not authenticated
}

// Client-side
const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()

if (session?.user) {
  console.log('User email:', session.user.email)
}
```

### Database - Create Appointment

```javascript
const supabase = await createClient()

const { data, error } = await supabase
  .from('appointments')
  .insert({
    patient_id: userId,
    doctor_id: doctorId,
    appointment_date: '2026-02-20',
    appointment_time: '10:00',
    status: 'pending',
    reason_for_visit: 'Regular checkup'
  })
  .select()

if (error) console.error('Error:', error.message)
else console.log('Created:', data[0])
```

### Database - Read Appointments

```javascript
const supabase = await createClient()

// Get patient's appointments
const { data, error } = await supabase
  .from('appointments')
  .select(`
    id,
    appointment_date,
    appointment_time,
    status,
    doctor:doctor_id(full_name, specialization)
  `)
  .eq('patient_id', userId)
  .order('appointment_date', { ascending: false })
  .limit(10)

if (error) console.error(error)
else console.log('Appointments:', data)
```

### Database - Update Status

```javascript
const { data, error } = await supabase
  .from('appointments')
  .update({ status: 'confirmed' })
  .eq('id', appointmentId)
  .select()

if (error) console.error(error)
```

### Database - Delete

```javascript
const { error } = await supabase
  .from('appointments')
  .delete()
  .eq('id', appointmentId)

if (error) console.error(error)
else console.log('Deleted successfully')
```

---

## 🔄 Real-Time Subscriptions

Listen for live database changes:

```javascript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export default function LiveAppointments() {
  useEffect(() => {
    const supabase = createClient()

    // Subscribe to all appointment changes
    const subscription = supabase
      .channel('appointments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('Change:', payload.eventType)
          console.log('Data:', payload.new)
          // Update UI in real-time
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])
}
```

---

## ✅ Implementation Checklist

- [ ] Install: `npm install @supabase/supabase-js @supabase/ssr`
- [ ] Create `.env.local` with Supabase credentials
- [ ] Copy `src/lib/supabase/` directory files
- [ ] Copy `proxy.js` to root directory
- [ ] Update `src/middleware.js` (mark as deprecated)
- [ ] Update existing imports in your code:
  - [ ] Client Components: use `@/lib/supabase/client`
  - [ ] Server Components: use `@/lib/supabase/server`
- [ ] Test: `npm run dev` and verify no errors
- [ ] Test authentication: Sign up/in/out flows
- [ ] Test database: Query appointments table
- [ ] Test Route Handlers: Call /api/appointments endpoint
- [ ] Remove old `@supabase/auth-helpers-nextjs` if present

---

## 🧪 Test Cases

### Test 1: Create Client

```javascript
// pages/test-client.js
'use client'
import { createClient } from '@/lib/supabase/client'

export default function TestPage() {
  return (
    <button onClick={async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      console.log('Session:', data)
    }}>
      Test Client
    </button>
  )
}
```

### Test 2: Create Server Client

```javascript
// pages/test-server.js
import { createClient } from '@/lib/supabase/server'

export default async function TestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  return (
    <div>
      {user ? `Logged in: ${user.email}` : 'Not logged in'}
    </div>
  )
}
```

### Test 3: Route Handler

```javascript
// app/api/test/route.js
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  return NextResponse.json({ user })
}
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module @/lib/supabase/client"

**Solution:** Make sure files exist in `src/lib/supabase/`:
```bash
ls -la src/lib/supabase/
# Should show: client.js, server.js, proxy.js
```

### Error: "NEXT_PUBLIC_SUPABASE_URL is not set"

**Solution:** Check `.env.local` has the variables:
```bash
cat .env.local
# Should show your Supabase URL and keys
```

### Error: "Cannot read cookies() - Error: This must be used in a Server Component"

**Solution:** You're using server client in a Client Component:
```javascript
// ❌ WRONG
'use client'
import { createClient } from '@/lib/supabase/server'

// ✅ CORRECT
'use client'
import { createClient } from '@/lib/supabase/client'
```

### Error: "session is null" in Route Handler

**Solution:** Use `getUser()` not `getSession()`:
```javascript
// ❌ WRONG
const { data: { session } } = await supabase.auth.getSession()

// ✅ CORRECT
const { data: { user }, error } = await supabase.auth.getUser()
if (error) return NextResponse.json({ error: error.message }, { status: 401 })
```

### Token not refreshing / User logged out randomly

**Solution:** Make sure `proxy.js` middleware is running:
1. Check file exists: `ls proxy.js`
2. Check it exports middleware and config
3. Restart dev server: `npm run dev`

---

## 📚 Original Files

If you need to revert to the old setup:

- Old middleware: See `src/middleware.js.bak`
- Old setup: See `src/lib/supabase.js` (before changes)

---

## 🎓 Learning Resources

1. **Supabase Official Docs:**
   - https://supabase.com/docs/guides/auth/server-side/nextjs

2. **Video Tutorials:**
   - https://www.youtube.com/watch?v=...
   
3. **Code Examples:**
   - https://github.com/supabase/supabase/tree/master/examples

---

**Questions?** Check the full guide: `SUPABASE_CLIENT_SERVER_SETUP.md`

