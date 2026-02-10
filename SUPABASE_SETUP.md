# Supabase Complete Setup Guide for MediBook

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Supabase Project Setup](#supabase-project-setup)
3. [Environment Variables](#environment-variables)
4. [Database Schema](#database-schema)
5. [Authentication Setup](#authentication-setup)
6. [API Integration](#api-integration)
7. [Testing & Verification](#testing--verification)

---

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (Sign up at https://supabase.com)
- Your MediBook project set up locally

---

## Step 1: Supabase Project Setup

### 1.1 Create a New Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in the details:
   - **Name**: MediBook
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Select closest to your users (e.g., us-east-1)
4. Click "Create new project" and wait for setup (2-5 minutes)

### 1.2 Get Your API Keys

Once the project is created:

1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL**: `https://[PROJECT-ID].supabase.co`
   - **anon public**: Your public API key
   - **service_role**: Your service role key (keep private!)

---

## Step 2: Environment Variables

### 2.1 Create `.env.local` file

Create a file `.env.local` in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key_here

# Service Role Key (for server-side operations only)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ Important**: 
- Never commit `.env.local` to Git
- Add `.env.local` to `.gitignore`
- The `NEXT_PUBLIC_` prefix makes variables available to the browser
- Keep `SUPABASE_SERVICE_ROLE_KEY` private (server-side only)

---

## Step 3: Database Schema Setup

### 3.1 Create Tables in Supabase

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the complete SQL schema below
4. Click "Run"

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users_extended table to store user roles and profiles
CREATE TABLE IF NOT EXISTS users_extended (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')) DEFAULT 'patient',
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doctors table for doctor-specific information
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  specialization TEXT NOT NULL,
  bio TEXT,
  experience_years INTEGER,
  license_number TEXT UNIQUE,
  consultation_fee DECIMAL(10, 2) DEFAULT 50.00,
  rating DECIMAL(3, 2) DEFAULT 5.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doctor_availability table for available time slots
CREATE TABLE IF NOT EXISTS doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER DEFAULT 30,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, day_of_week, start_time, end_time)
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users_extended(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  reason_for_visit TEXT,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')) DEFAULT 'pending',
  consultation_mode TEXT CHECK (consultation_mode IN ('in-person', 'online')) DEFAULT 'in-person',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, appointment_date, appointment_time)
);

-- Create appointment_conflicts_log to track conflicting bookings
CREATE TABLE IF NOT EXISTS appointment_conflicts_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  conflicting_appointments JSONB,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_extended_role ON users_extended(role);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor ON doctor_availability(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

-- Enable Row Level Security
ALTER TABLE users_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_conflicts_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read their own extended profile
CREATE POLICY "Users can read own profile" ON users_extended
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can create own profile" ON users_extended
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users_extended
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Allow anyone to read active doctor profiles
CREATE POLICY "Anyone can view doctor profiles" ON doctors
  FOR SELECT USING (is_active = TRUE);

-- Doctors can update their own profile
CREATE POLICY "Doctors can update own profile" ON doctors
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Doctor availability is readable by all
CREATE POLICY "Anyone can view doctor availability" ON doctor_availability
  FOR SELECT USING (TRUE);  

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments" ON appointments
  FOR SELECT USING (patient_id = auth.uid());

-- Doctors can view their own appointments
CREATE POLICY "Doctors can view own appointments" ON appointments
  FOR SELECT USING (doctor_id = auth.uid());

-- Patients can create appointments
CREATE POLICY "Patients can create appointments" ON appointments
  FOR INSERT WITH CHECK (patient_id = auth.uid());

-- Patients can update their own appointments
CREATE POLICY "Patients can update own appointments" ON appointments
  FOR UPDATE USING (patient_id = auth.uid());
```

### 3.2 Enable Real-time (Optional)

1. Go to **Database** → **Publications**
2. Enable "Realtime" for tables: `appointments`, `doctors`, `users_extended`

---

## Step 4: Authentication Setup

### 4.1 Configure Email Authentication

1. Go to **Authentication** → **Providers**
2. Find "Email" and verify it's enabled
3. Go to **URL Configuration**
4. Set **Site URL**: `http://localhost:3000`
5. Add **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/check-email
   https://yourdomain.com/auth/callback
   ```

### 4.2 Email Templates (Optional)

Go to **Authentication** → **Email Templates** to customize:
- Confirmation email
- Password reset email
- Magic Link email

---

## Step 5: Update Supabase Configuration Files

### 5.1 Update `.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Debug (remove in production)
NEXT_DEBUG=false
```

### 5.2 Verify Supabase Config

Check that `src/lib/supabase.js` contains:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## Step 6: API Routes for Server-Side Operations

### 6.1 Create User Registration Handler

Create `src/app/api/auth/register/route.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { email, password, fullName, role } = await request.json()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    })

    if (authError) {
      return Response.json({ error: authError.message }, { status: 400 })
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('users_extended')
      .insert([
        {
          id: authData.user.id,
          full_name: fullName,
          role: role || 'patient',
        },
      ])

    if (profileError) {
      return Response.json({ error: profileError.message }, { status: 400 })
    }

    return Response.json({ success: true, user: authData.user })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

### 6.2 Create Appointment Handler

Create `src/app/api/appointments/book/route.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { patientId, doctorId, appointmentDate, appointmentTime, reason } =
      await request.json()

    // Check for conflicts
    const { data: existingAppointment } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', appointmentDate)
      .eq('appointment_time', appointmentTime)

    if (existingAppointment && existingAppointment.length > 0) {
      return Response.json(
        { error: 'Time slot already booked' },
        { status: 409 }
      )
    }

    // Create appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert([
        {
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          reason_for_visit: reason,
          status: 'pending',
        },
      ])
      .select()

    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json({ success: true, appointment: data[0] })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

---

## Step 7: Context for Client-Side Auth Management

Update `src/context/AuthContext.js`:

```javascript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check current session
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        setUser(session.user)
        await fetchUserProfile(session.user.id)
      }
      setLoading(false)
    }

    checkSession()

    // Listen for auth changes
    const subscription = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user)
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.data.subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users_extended')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const signUp = async (email, password, fullName, role = 'patient') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // Create user profile
      if (data.user) {
        await supabase.from('users_extended').insert([
          {
            id: data.user.id,
            full_name: fullName,
            role,
          },
        ])
      }

      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setUserProfile(null)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

---

## Step 8: Testing & Verification

### 8.1 Test Authentication

1. Start your app: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Get Started"
4. Register a test account
5. Check Supabase dashboard → **Authentication** → Users (you should see your test user)

### 8.2 Verify Database

1. Go to Supabase **SQL Editor**
2. Run test query:

```sql
SELECT id, full_name, role FROM users_extended LIMIT 10;
```

You should see your registered user.

### 8.3 Test Database Functions

In Supabase **SQL Editor**, test common queries:

```sql
-- Get all active doctors
SELECT id, specialization, consultation_fee FROM doctors WHERE is_active = TRUE;

-- Get user appointments
SELECT * FROM appointments WHERE patient_id = 'YOUR_USER_ID';

-- Get doctor's appointments
SELECT * FROM appointments WHERE doctor_id = 'DOCTOR_ID' ORDER BY appointment_date;
```

---

## Step 9: Deployment Considerations

### 9.1 Production Environment Variables

Add to your hosting platform (Vercel, Netlify, etc.):

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 9.2 Update Redirect URLs

In Supabase **Authentication** → **URL Configuration**:

```
https://yourdomain.com/auth/callback
https://yourdomain.com/check-email
```

### 9.3 Security Checklist

- ✅ RLS policies are enabled
- ✅ Service role key not exposed in frontend
- ✅ Environment variables are secret
- ✅ Email confirmation required for signup
- ✅ Password reset enabled
- ✅ CORS policies configured

---

## Common Issues & Solutions

### Issue: "Missing Supabase environment variables"
- ✅ Check `.env.local` exists and has correct URLs/keys
- ✅ Restart dev server: `npm run dev`

### Issue: "RLS policy violation"
- ✅ Verify RLS policies are correctly set up
- ✅ Check user permissions for each table

### Issue: "Email confirmation not received"
- ✅ Check spam/promotions folder
- ✅ Verify email template in Supabase dashboard

### Issue: "CORS error in browser"
- ✅ Verify Site URL in Supabase matches your domain
- ✅ Check allowed redirect URLs

---

## Useful Supabase Queries

### Create a doctor profile after signup:

```javascript
const { error } = await supabase
  .from('doctors')
  .insert([
    {
      id: userId,
      specialization: 'Cardiology',
      experience_years: 10,
      consultation_fee: 50,
      bio: 'Experienced cardiologist',
    },
  ])
```

### Get all doctors in a specialization:

```javascript
const { data } = await supabase
  .from('doctors')
  .select('*')
  .eq('specialization', 'Cardiology')
  .eq('is_active', true)
```

### Book an appointment:

```javascript
const { data, error } = await supabase
  .from('appointments')
  .insert([
    {
      patient_id: userId,
      doctor_id: doctorId,
      appointment_date: '2026-02-15',
      appointment_time: '14:00',
      reason_for_visit: 'Checkup',
    },
  ])
  .select()
```

---

## Next Steps

1. ✅ Complete the setup above
2. ✅ Test authentication flow
3. ✅ Implement doctor profiles
4. ✅ Create appointment booking system
5. ✅ Add real-time notifications
6. ✅ Deploy to production

For more help: https://supabase.com/docs
