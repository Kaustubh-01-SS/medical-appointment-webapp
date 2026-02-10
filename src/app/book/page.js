'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { logError, getErrorMessage } from '@/lib/errorHandler'
import { getDoctors } from '@/lib/db'

export default function BookAppointmentPage() {
  const router = useRouter()
  const [doctors, setDoctors] = useState([])
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [showTimeSlots, setShowTimeSlots] = useState(false)
  const [reason, setReason] = useState('')
  const [consultationMode, setConsultationMode] = useState('in-person')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Guest info
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')

  // Derived values
  const [minDate, setMinDate] = useState('')
  const [maxDate, setMaxDate] = useState('')

  // Initialize date constraints on component mount
  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    setMinDate(tomorrowStr)

    const sixtyDaysLater = new Date()
    sixtyDaysLater.setDate(sixtyDaysLater.getDate() + 60)
    const maxDateStr = sixtyDaysLater.toISOString().split('T')[0]
    setMaxDate(maxDateStr)
  }, [])

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        // Use the dedicated db utility which has proper RLS setup
        const { data, error: fetchError } = await getDoctors()
        
        if (fetchError) {
          logError('Failed to load doctors from database', fetchError)
          throw new Error('Unable to load doctor list')
        }
        
        if (data && data.length > 0) {
          setDoctors(data)
        } else {
          // Fallback: use mock doctors
          console.warn('No doctors found in database, using mock data')
          setDoctors([
            {
              id: 'mock-1',
              full_name: 'Dr. Sarah Johnson',
              specialization: 'Cardiology',
              experience_years: 10,
              consultation_fee: 50,
              rating: 4.8
            },
            {
              id: 'mock-2',
              full_name: 'Dr. Michael Chen',
              specialization: 'Neurology',
              experience_years: 15,
              consultation_fee: 60,
              rating: 4.9
            },
            {
              id: 'mock-3',
              full_name: 'Dr. Emily Davis',
              specialization: 'Dermatology',
              experience_years: 8,
              consultation_fee: 45,
              rating: 4.7
            }
          ])
        }
      } catch (err) {
        // Use mock doctors as fallback
        console.warn('Using fallback mock doctors:', getErrorMessage(err))
        setDoctors([
          {
            id: 'mock-1',
            full_name: 'Dr. Sarah Johnson',
            specialization: 'Cardiology',
            experience_years: 10,
            consultation_fee: 50,
            rating: 4.8
          },
          {
            id: 'mock-2',
            full_name: 'Dr. Michael Chen',
            specialization: 'Neurology',
            experience_years: 15,
            consultation_fee: 60,
            rating: 4.9
          },
          {
            id: 'mock-3',
            full_name: 'Dr. Emily Davis',
            specialization: 'Dermatology',
            experience_years: 8,
            consultation_fee: 45,
            rating: 4.7
          }
        ])
      }
    }
    loadDoctors()
  }, [])

  const handleBookAppointment = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedDoctorId || !selectedDate || !selectedTime || !reason) {
      setError('Please fill in all required appointment fields')
      return
    }

    if (!guestName || !guestEmail || !guestPhone) {
      setError('Please fill in all your contact information')
      return
    }

    setLoading(true)

    try {
      // Combine date and time: selectedDate is YYYY-MM-DD, selectedTime is HH:MM
      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}:00`)

      if (isNaN(appointmentDateTime.getTime())) {
        throw new Error('Invalid date/time combination')
      }

      const { error: bookError } = await supabase
        .from('appointments')
        .insert([
          {
            doctor_id: selectedDoctorId,
            appointment_date: appointmentDateTime.toISOString(),
            status: 'scheduled',
            notes: `Guest Booking\nName: ${guestName}\nEmail: ${guestEmail}\nPhone: ${guestPhone}\nReason: ${reason}\nMode: ${consultationMode}`,
            patient_id: null,
          },
        ])

      if (bookError) {
        throw bookError
      }

      setSuccess('✓ Appointment booked successfully! Confirmation sent to your email.')
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (err) {
      logError('Booking error', err)
      setError(getErrorMessage(err) || 'Failed to book appointment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Time slots available for booking
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30'
  ]

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId)

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-teal-50">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-4 bg-white border-b border-gray-200 sticky top-0 z-40">
        <button
          onClick={() => router.back()}
          className="text-teal-600 font-semibold hover:text-teal-700"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
        <div className="w-20"></div>
      </nav>

      <div className="max-w-5xl mx-auto p-6 py-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">Book Your Appointment</h2>
        <p className="text-gray-600 mb-8">No registration needed - fill in the form and get instant confirmation</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleBookAppointment} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Left Column: Patient & Appointment Info */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Your Information</h3>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Full Name *</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Email *</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Phone *</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Reason for Visit *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe your symptoms or reason for consultation..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 resize-none text-gray-900"
                  rows={5}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700">Consultation Mode</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="in-person"
                      checked={consultationMode === 'in-person'}
                      onChange={(e) => setConsultationMode(e.target.value)}
                      className="w-4 h-4 text-teal-600"
                    />
                    <span className="text-gray-700">In-person consultation</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="online"
                      checked={consultationMode === 'online'}
                      onChange={(e) => setConsultationMode(e.target.value)}
                      className="w-4 h-4 text-teal-600"
                    />
                    <span className="text-gray-700">Online consultation</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Doctor & Appointment Selection */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Appointment Details</h3>

              <div>
                <label htmlFor="doctor-select" className="block text-sm font-semibold mb-2 text-gray-700">Select Doctor *</label>
                <select
                  id="doctor-select"
                  value={selectedDoctorId}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value)
                    setSelectedDate('')
                    setSelectedTime('')
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-gray-900 bg-white cursor-pointer"
                  required
                >
                  <option value="">-- Select a doctor --</option>
                  {doctors.length > 0 ? (
                    doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.full_name} - {doctor.specialization}
                      </option>
                    ))
                  ) : (
                    <option disabled>Loading doctors...</option>
                  )}
                </select>
              </div>

              {/* Doctor Info Card */}
              {selectedDoctor && (
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-semibold">Doctor:</span> Dr. {selectedDoctor.full_name}
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-semibold">Experience:</span> {selectedDoctor.experience_years} years
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-semibold">Fee:</span> ${selectedDoctor.consultation_fee}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Rating:</span> {selectedDoctor.rating ? `⭐ ${selectedDoctor.rating.toFixed(1)}/5` : 'N/A'}
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="date-input" className="block text-sm font-semibold mb-2 text-gray-700">Select Date *</label>
                <input
                  id="date-input"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setSelectedTime('')
                    // Automatically open the time picker when a date is chosen
                    if (e.target.value) setShowTimeSlots(true)
                  }}
                  min={minDate}
                  max={maxDate}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-gray-900 bg-white cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {/* Show a Select Time button so user can open time slots explicitly */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowTimeSlots((s) => !s)}
                  disabled={!selectedDate}
                  className="px-4 py-2 rounded-md border-2 font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showTimeSlots ? 'Hide Time Slots' : 'Select Time'}
                </button>
              </div>

              {selectedDate && showTimeSlots && (
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-700">Select Time *</label>
                  <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 px-3 rounded-lg border-2 font-semibold text-sm transition ${
                          selectedTime === time
                            ? 'border-teal-600 bg-teal-50 text-teal-600'
                            : 'border-gray-300 hover:border-teal-500 text-gray-700 hover:bg-gray-50'
                        }`}
                        aria-pressed={selectedTime === time}
                        aria-label={`Select ${time}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                  {selectedTime && (
                    <p className="mt-3 text-sm text-teal-600 font-medium">
                      ✓ Selected: {selectedDate} at {selectedTime}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !selectedDoctorId ||
                !selectedDate ||
                !selectedTime ||
                !guestName ||
                !guestEmail ||
                !guestPhone ||
                !reason
              }
              className="flex-1 px-6 py-3 bg-linear-to-r from-teal-600 to-blue-600 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Booking Your Appointment...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
