import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

export async function POST(request) {
  try {
    const {
      doctor_id,
      specialization,
      experience_years,
      consultation_fee,
    } = await request.json()

    if (!doctor_id || !specialization) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create doctor profile with service role (bypasses RLS)
    const { data, error } = await supabase
      .from('doctors')
      .insert([
        {
          id: doctor_id,
          specialization,
          experience_years: parseInt(experience_years),
          consultation_fee: parseFloat(consultation_fee),
          rating: 5.0,
          is_active: true,
        },
      ])
      .select()

    if (error) {
      console.error('Doctor creation error:', error)
      return Response.json(
        { error: error.message || 'Failed to create doctor profile' },
        { status: 400 }
      )
    }

    return Response.json({ success: true, data })
  } catch (err) {
    console.error('API error:', err)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
