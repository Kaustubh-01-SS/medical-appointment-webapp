# Supabase Client & Server Setup Guide

**Updated:** February 16, 2026  
**Supabase SSR Package:** @supabase/ssr v0.8+  
**Next.js App Router:** v16+  

---

## 📁 File Structure

```
src/lib/supabase/
├── client.js      # Browser client for Client Components
├── server.js      # Server client for Route Handlers & Server Actions
└── proxy.js       # Session refresh helper for middleware

proxy.js           # Root middleware (handles token refresh)
src/middleware.js  # DEPRECATED - see proxy.js instead
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 2. Set Environment Variables

Create `.env.local`:
```env
# Get these from: https://supabase.com/dashboard/project/_/settings/api-keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# For server-side admin operations only (keep SECRET)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 3. Use in Your Code

**Client Component:**
```javascript
'use client'

import { createClient } from '@/lib/supabase/client'

export default function MyComponent() {
  const supabase = createClient()
  
  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123'
    })
  }
}
```

**Server Component:**
```javascript
import { createClient } from '@/lib/supabase/server'

export default async function MyPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  return <div>User: {user?.email}</div>
}
```

**Route Handler:**
```javascript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('appointments')
    .insert([{ /* ... */ }])
  
  return NextResponse.json({ data })
}
```

**Server Action:**
```javascript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
```

---

## 🔐 Authentication Patterns

### Get Current User (SAFE)

Use `getUser()` in server code - it always revalidates with auth server:

```javascript
const supabase = await createClient()
const { data: { user }, error } = await supabase.auth.getUser()

if (error) {
  // User not authenticated or token expired
  redirect('/login')
}
```

### ⚠️ DON'T Use getSession() in Server Code

```javascript
// ❌ WRONG - Unsafe in server code
const { data: { session } } = await supabase.auth.getSession()
```

Why? `getSession()` doesn't verify the token with the auth server. Tokens can be spoofed.

### Listen to Auth Changes (Client Only)

```javascript
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthListener() {
  useEffect(() => {
    const supabase = createClient()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event)
        console.log('Session:', session)
      }
    )
    
    return () => subscription?.unsubscribe()
  }, [])
}
```

---

## 🔑 Service Role (Admin) Operations

Use `createAdminClient()` for privileged operations server-side:

```javascript
import { createAdminClient } from '@/lib/supabase/server'

export async function deleteUserByAdmin(userId) {
  const adminSupabase = await createAdminClient()
  
  // This bypasses RLS policies - use carefully!
  await adminSupabase.auth.admin.deleteUser(userId)
}
```

**CRITICAL:**
- ✅ Use only in server code (Route Handlers, Server Actions)
- ❌ NEVER pass SUPABASE_SERVICE_ROLE_KEY to client
- ❌ NEVER log the key
- ✅ Keep it in `.env.local` (never commit to git)

---

## 🔄 Session Refresh Flow

The `proxy.js` middleware automatically handles this:

```
Browser Request
    ↓
Middleware (proxy.js) runs
    ↓
Checks token with Supabase Auth
    ↓
Token valid? → Continue request
Token expired? → Try to refresh → Get new token
    ↓
Token now stored in cookies
    ↓
Passed to Server Components
    ↓
Response returns to browser with updated cookie
```

You don't need to do anything - it's automatic!

---

## 🛒 Database Operations

### Insert Data

```javascript
const supabase = await createClient()

const { data, error } = await supabase
  .from('appointments')
  .insert([
    {
      patient_id: userId,
      doctor_id: doctorId,
      appointment_date: '2026-02-20',
      status: 'pending'
    }
  ])
  .select()

if (error) console.error(error)
else console.log('Created:', data)
```

### Query Data

```javascript
const { data: appointments, error } = await supabase
  .from('appointments')
  .select('id, appointment_date, status, doctor:doctor_id(full_name)')
  .eq('patient_id', userId)
  .order('appointment_date', { ascending: false })
```

### Update Data

```javascript
const { data, error } = await supabase
  .from('appointments')
  .update({ status: 'confirmed' })
  .eq('id', appointmentId)
  .select()
```

### Delete Data

```javascript
const { error } = await supabase
  .from('appointments')
  .delete()
  .eq('id', appointmentId)
```

---

## 🔒 Row Level Security (RLS)

Always enable RLS on your tables. Example policy for appointments:

```sql
-- Only patients can READ their own appointments
CREATE POLICY "users_can_read_own_appointments" ON appointments
  FOR SELECT
  USING (patient_id = auth.uid());

-- Only patients can INSERT their own appointments
CREATE POLICY "users_can_insert_own_appointments" ON appointments
  FOR INSERT
  WITH CHECK (patient_id = auth.uid());

-- Only doctors can UPDATE appointments assigned to them
CREATE POLICY "doctors_can_update_their_appointments" ON appointments
  FOR UPDATE
  USING (doctor_id = auth.uid());
```

With RLS:
- When user queries: Only data they can access is returned automatically
- Service role bypasses RLS (use for admin operations)
- Anonymous requests fail unless you explicitly allow

---

## 🧪 Testing

### Test Client Creation

```javascript
import { createClient } from '@/lib/supabase/client'

export default function TestPage() {
  return (
    <button onClick={async () => {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getSession()
      console.log('Session:', data)
      console.log('Error:', error)
    }}>
      Test Client
    </button>
  )
}
```

### Test Server Operations

```javascript
import { createClient } from '@/lib/supabase/server'

export default async function TestPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  return (
    <div>
      {error && <p>Error: {error.message}</p>}
      {user && <p>Logged in: {user.email}</p>}
      {!error && !user && <p>Not logged in</p>}
    </div>
  )
}
```

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Using getSession() in Route Handler

```javascript
// WRONG
export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  // ← Session might be from spoofed token!
}

// CORRECT
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  // ← Token verified with auth server every time
}
```

### ❌ Mistake 2: Forgetting `await` on Server Client

```javascript
// WRONG
import { createClient } from '@/lib/supabase/server'

export async function MyAction() {
  const supabase = createClient() // Missing await!
}

// CORRECT
export async function MyAction() {
  const supabase = await createClient()
}
```

### ❌ Mistake 3: Using createClient() in Server Code

```javascript
// WRONG - browser client in server!
import { createClient } from '@/lib/supabase/client'

export async function GET() {
  const supabase = createClient() // Can't access cookies!
}

// CORRECT
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
}
```

### ❌ Mistake 4: Exposing Service Role Key

```env
# WRONG - never expose to client
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=xxx

# CORRECT - kept secret
SUPABASE_SERVICE_ROLE_KEY=xxx
```

---

## 📚 Migration from Auth Helpers

If you were using the old `@supabase/auth-helpers-nextjs`:

**Before (deprecated):**
```javascript
import { createServerClient } from '@supabase/auth-helpers-nextjs'

export default function MyComponent() {
  // Had to pass cookies manually
}
```

**After (new SSR):**
```javascript
import { createClient } from '@/lib/supabase/server'

export async function MyPage() {
  const supabase = await createClient()
  // Cookies handled automatically!
}
```

### Steps to Migrate

1. ✅ Update `package.json`: Replace `@supabase/auth-helpers-nextjs` with `@supabase/ssr`
2. ✅ Use new client files: `src/lib/supabase/client.js` and `server.js`
3. ✅ Update middleware: Use `proxy.js` system
4. ✅ Update all imports: 
   - Client Components: `from '@/lib/supabase/client'`
   - Server Components: `from '@/lib/supabase/server'`
5. ✅ Remove manual cookie handling code
6. ✅ Use `getUser()` instead of `getSession()` in server code

---

## 🔗 Resources

- [Supabase SSR Package Docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

---

## 💬 Support

- Error: `NEXT_PUBLIC_SUPABASE_URL is not set` → Check `.env.local`
- Error: `Cannot find module` → Run `npm install` again
- Session not persisting → Check if proxy.js middleware is running
- Token not refreshing → Verify proxy.js config in Next.js

---

**Last Updated:** February 16, 2026  
**Version:** 2.0 (SSR Package)
