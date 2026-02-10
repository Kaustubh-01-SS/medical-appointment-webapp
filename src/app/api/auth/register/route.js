import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password, fullName, role } = body

    // Validate input
    if (!email || !password || !fullName) {
      return Response.json(
        { error: 'Missing required fields: email, password, fullName' },
        { status: 400 }
      )
    }

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
      // Cleanup: delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return Response.json({ error: profileError.message }, { status: 400 })
    }

    return Response.json(
      {
        success: true,
        message: 'User registered successfully. Please check your email to confirm.',
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
