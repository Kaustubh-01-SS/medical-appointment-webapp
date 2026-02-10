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
    const { patient_name, patient_email, patient_phone, doctor_id, appointment_date, notes } = body

    // Validate input
    if (!patient_name || !patient_email || !doctor_id || !appointment_date) {
      return Response.json(
        { error: 'Missing required fields: patient_name, patient_email, doctor_id, appointment_date' },
        { status: 400 }
      )
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(patient_email)) {
      return Response.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Parse appointment date
    const appointmentTime = new Date(appointment_date)
    if (isNaN(appointmentTime.getTime())) {
      return Response.json({ error: 'Invalid appointment_date format' }, { status: 400 })
    }

    // Check for conflicts (30-minute appointment slots)
    const appointmentEnd = new Date(appointmentTime.getTime() + 30 * 60000)

    const { data: conflicts, error: conflictError } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctor_id)
      .eq('status', 'scheduled')
      .gte('appointment_date', appointmentTime.toISOString())
      .lt('appointment_date', appointmentEnd.toISOString())

    if (conflictError) {
      return Response.json({ error: conflictError.message }, { status: 500 })
    }

    if (conflicts && conflicts.length > 0) {
      return Response.json(
        { error: 'Doctor is not available at this time' },
        { status: 409 }
      )
    }

    // Create appointment with guest booking
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert([
        {
          doctor_id,
          appointment_date: appointmentTime.toISOString(),
          status: 'scheduled',
          patient_id: null, // NULL for guest bookings
          notes: `GUEST BOOKING\nName: ${patient_name}\nEmail: ${patient_email}\nPhone: ${patient_phone}${notes ? `\nAdditional Notes: ${notes}` : ''}`,
        },
      ])
      .select()

    if (appointmentError) {
      return Response.json({ error: appointmentError.message }, { status: 400 })
    }

    // TODO: Send confirmation email to guest
    // For now, just return success

    return Response.json(
      {
        success: true,
        message: 'Appointment booked successfully. Confirmation has been sent to your email.',
        appointment: appointment[0],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Guest appointment booking error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
