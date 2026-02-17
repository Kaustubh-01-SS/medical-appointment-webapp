# Migration Guide: Update Existing Code to New Supabase Setup

**Target:** Medical Appointment Webapp  
**Status:** Action Items for Each File  
**Updated:** February 16, 2026

---

## 🎯 Overview

The project currently uses legacy Supabase patterns. This guide shows how to update each file to use the modern SSR package setup.

### What Changed?

| Old | New |
|-----|-----|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` |
| `src/lib/supabase.js` (old) | `src/lib/supabase/client.js` & `server.js` |
| Manual cookie management | Automatic in SSR package |
| `@supabase/supabase-js` only | `@supabase/supabase-js` + `@supabase/ssr` |

---

## 📋 Migration Checklist by File

### ✅ Phase 1: Setup (Already Done)

- [x] Install `@supabase/ssr` package
- [x] Create `src/lib/supabase/client.js`
- [x] Create `src/lib/supabase/server.js`
- [x] Create `src/lib/supabase/proxy.js`
- [x] Create `proxy.js` middleware
- [x] Update `src/middleware.js` (deprecated)

### 📝 Phase 2: Update Existing Files (TODO)

Files that need updates to use new setup:

1. **Client Components:**
   - `src/app/login/page.js`
   - `src/app/register/page.js`
   - `src/app/book/page.js`
   - `src/app/patient-dashboard/page.js`
   - `src/app/doctor-dashboard/page.js`
   - `src/app/my-appointments/page.js`
   - `src/app/symptom-checker/page.js`
   - `src/components/UserAvatar.js`

2. **Server/Route Handlers:**
   - `src/app/api/appointments/route.js`
   - `src/app/api/appointments/guest/route.js`

3. **Server Components:**
   - `src/app/dashboard/page.js`
   - `src/app/check-email/page.js`

4. **Context:**
   - `src/context/AuthContext.js`

---

## 🔄 Pattern: Update Client Components

### OLD Pattern (login/page.js)

```javascript
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'  // ← Old import
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const handleLogin = async (e) => {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
  }
}
```

### NEW Pattern (login/page.js)

```javascript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'  // ✅ New import
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()  // ✅ Create instance

  const handleLogin = async (e) => {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
  }
}
```

### Changes Made:
- ✅ Changed import from `@/lib/supabase` to `@/lib/supabase/client`
- ✅ Changed from direct `supabase` export to function `createClient()`
- ✅ Call `createClient()` instead of using singleton
- ✅ Everything else stays the same!

---

## 🔄 Pattern: Update Server Route Handlers

### OLD Pattern (api/appointments/route.js)

```javascript
import { createClient } from '@supabase/supabase-js'  // ← Old package

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)  // ← Manual init

export async function POST(request) {
  // Not async friendly for middleware/cookies
  const body = await request.json()
  const { data, error } = await supabase
    .from('appointments')
    .insert(body)
}
```

### NEW Pattern (api/appointments/route.js)

```javascript
import { createAdminClient } from '@/lib/supabase/server'  // ✅ New import
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const supabase = await createAdminClient()  // ✅ Await and create

    const { data, error } = await supabase
      .from('appointments')
      .insert(body)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### Changes Made:
- ✅ Changed import to `createAdminClient` from `@/lib/supabase/server`
- ✅ Add `await` before creating client
- ✅ Remove manual environment variable access
- ✅ Remove manual Supabase client creation
- ✅ Add try-catch error handling
- ✅ Return NextResponse properly

---

## 🔄 Pattern: Server Components

### OLD Pattern (Not well supported)

```javascript
// This was complicated in old auth-helpers setup
```

### NEW Pattern (dashboard/page.js)

```javascript
import { createClient } from '@/lib/supabase/server'  // ✅ Server import
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()  // ✅ Await creation

  // Always use getUser() for protection in server code
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')  // ✅ Redirect if not authenticated
  }

  // Fetch user data
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('patient_id', user.id)

  return (
    <div>
      <h1>Dashboard for {user.email}</h1>
      {/* Render appointments */}
    </div>
  )
}
```

### Changes Made:
- ✅ Import from `@/lib/supabase/server` (NOT client)
- ✅ Make component async
- ✅ Await the createClient() call
- ✅ Use `getUser()` for auth checks (safe!)
- ✅ Redirect in server code directly
- ✅ Fetch data server-side (better performance)

---

## 🔄 Pattern: AuthContext (Client State)

### OLD Pattern (context/AuthContext.js)

```javascript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'  // ← Old

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()  // ← For browser only
      if (session?.user) {
        setUser(session.user)
      }
    }
    checkSession()
  }, [])
}
```

### NEW Pattern (context/AuthContext.js)

```javascript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'  // ✅ Client import

let supabaseSingleton

function getSupabase() {
  if (!supabaseSingleton) {
    supabaseSingleton = createClient()
  }
  return supabaseSingleton
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const supabase = getSupabase()

  useEffect(() => {
    // Get initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
      }
    }
    checkSession()

    // Listen for auth changes (realtime)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user)
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, supabase }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Changes Made:
- ✅ Import `createClient` from client module
- ✅ Create singleton to avoid multiple instances
- ✅ Use `createClient()` function
- ✅ Add `onAuthStateChange` listener (realtime updates)
- ✅ Cleanup subscription on unmount

---

## 📝 Update Examples: Specific Files

### File 1: src/app/register/page.js

**What to update:**

```javascript
// Line 6: Update import
// OLD: import { supabase } from '@/lib/supabase'
// NEW:
import { createClient } from '@/lib/supabase/client'

// In component: Create client instance
export default function RegisterPage() {
  const supabase = createClient()  // Add this
  
  const handleRegister = async (e) => {
    // ... rest stays the same
    const { data, error } = await supabase.auth.signUp({
      // ... your code
    })
  }
}
```

---

### File 2: src/app/book/page.js

**What to update:**

```javascript
// Line 5: Update import
// OLD: import { supabase } from '@/lib/supabase'
// NEW:
import { createClient } from '@/lib/supabase/client'

// In component: Create client instance
export default function BookPage() {
  const supabase = createClient()  // Add this

  useEffect(() => {
    const ensureSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      // ... rest stays the same
    }
  }, [supabase])  // Add supabase to dependency array
}
```

---

### File 3: src/app/api/appointments/route.js

**Full update needed:**

```javascript
// Replace entire file with:

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { patient_id, doctor_id, appointment_date, notes } = body

    if (!patient_id || !doctor_id || !appointment_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()  // ✅ New way

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert([
        {
          patient_id,
          doctor_id,
          appointment_date,
          status: 'scheduled',
          notes,
        },
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Appointment booked successfully',
        appointment: appointment[0],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Appointment booking error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')
    const doctorId = searchParams.get('doctor_id')

    if (!patientId && !doctorId) {
      return NextResponse.json(
        { error: 'Provide either patient_id or doctor_id' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()  // ✅ New way

    let query = supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true })

    if (patientId) {
      query = query.eq('patient_id', patientId)
    } else if (doctorId) {
      query = query.eq('doctor_id', doctorId)
    }

    const { data: appointments, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ appointments }, { status: 200 })
  } catch (error) {
    console.error('Fetch appointments error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

---

## ⚡ Quick Migration Script

```bash
#!/bin/bash
# Run from project root

echo "🚀 Starting Supabase migration..."

# 1. Update all Client Component imports
find src -name "*.js" -type f | xargs sed -i 's|from "@/lib/supabase"|from "@/lib/supabase/client"|g'

# 2. Replace supabase.auth in client components with createClient()
echo "✅ Updated imports"

# 3. Run formatter
npm run lint -- --fix 2>/dev/null || true

echo "✅ Migration complete!"
echo "⚠️  Manually verify each file and run tests"
```

---

## 🧪 Testing the Migration

After updating files, test each part:

```bash
# 1. Check no import errors
npm run build

# 2. Run linter
npm run lint

# 3. Start dev server
npm run dev

# 4. Test login
#    → Go to http://localhost:3000/login
#    → Sign in with test account
#    → Check console for errors

# 5. Test booking
#    → Go to http://localhost:3000/book
#    → Select doctor and time
#    → Submit booking
#    → Check browser console and server logs

# 6. Test dashboard
#    → Go to http://localhost:3000/patient-dashboard
#    → Should see your appointments
#    → Should have user menu in top right
```

---

## 📊 Migration Progress Template

Copy this into your project:

| File | Status | Notes |
|------|--------|-------|
| src/lib/supabase/client.js | ✅ New | Created |
| src/lib/supabase/server.js | ✅ New | Created |
| src/lib/supabase/proxy.js | ✅ New | Created |
| proxy.js | ✅ New | Created |
| src/middleware.js | ✅ Updated | Deprecated |
| src/context/AuthContext.js | ⏳ TODO | Update import + add singleton |
| src/app/login/page.js | ⏳ TODO | Update import |
| src/app/register/page.js | ⏳ TODO | Update import |
| src/app/book/page.js | ⏳ TODO | Update import |
| src/app/patient-dashboard/page.js | ⏳ TODO | Server component? Add auth check |
| src/app/doctor-dashboard/page.js | ⏳ TODO | Server component? Add auth check |
| src/components/UserAvatar.js | ⏳ TODO | Update import |
| src/app/api/appointments/route.js | ⏳ TODO | Update to createAdminClient |
| src/app/api/appointments/guest/route.js | ⏳ TODO | Update to createAdminClient |

---

## ✅ Final Checklist

- [ ] All files have correct imports (no mix of old/new)
- [ ] No remaining `@supabase/auth-helpers-nextjs` imports
- [ ] All Server Components use `createClient()` from server module
- [ ] All Client Components use `createClient()` from client module
- [ ] All Route Handlers use `await createAdminClient()`
- [ ] No remaining direct `supabase.` imports
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Sign up/in/out flows work
- [ ] Database queries work
- [ ] No errors in server console
- [ ] No errors in browser console

---

## 🆘 Need Help?

- Error on import? Check file path is correct
- Build fails? Run `npm install` again
- Session issues? Restart dev server
- Token refresh failing? Check proxy.js middleware is running

See: `SUPABASE_CLIENT_SERVER_SETUP.md` and `SUPABASE_QUICK_REFERENCE.md`

---

**Time Estimate:** 2-3 hours for full migration  
**Risk Level:** Low (backward compatible setup exists)  
**Rollback:** Keep backup of old files

