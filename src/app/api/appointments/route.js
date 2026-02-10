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
    const { patient_id, doctor_id, appointment_date, notes } = body

    // Validate input
    if (!patient_id || !doctor_id || !appointment_date) {
      return Response.json(
        { error: 'Missing required fields: patient_id, doctor_id, appointment_date' },
        { status: 400 }
      )
    }

    // Parse appointment date
    const appointmentTime = new Date(appointment_date)
    if (isNaN(appointmentTime.getTime())) {
      return Response.json({ error: 'Invalid appointment_date format' }, { status: 400 })
    }

    // Check for conflicts (example: 30-minute appointment slots)
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

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert([
        {
          patient_id,
          doctor_id,
          appointment_date: appointmentTime.toISOString(),
          status: 'scheduled',
          notes: notes || null,
        },
      ])
      .select()

    if (appointmentError) {
      return Response.json({ error: appointmentError.message }, { status: 400 })
    }

    return Response.json(
      {
        success: true,
        message: 'Appointment booked successfully',
        appointment: appointment[0],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Appointment booking error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')
    const doctorId = searchParams.get('doctor_id')

    if (!patientId && !doctorId) {
      return Response.json({ error: 'Provide either patient_id or doctor_id' }, { status: 400 })
    }

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
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ appointments }, { status: 200 })
  } catch (error) {
    console.error('Fetch appointments error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
