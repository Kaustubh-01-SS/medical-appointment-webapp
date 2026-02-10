'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getErrorMessage, logError } from '@/lib/errorHandler';

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();

  const openAuth = () => {
    setShowAuthModal(true);
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-4 bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">♥</span>
          </div>
          <h1 className="text-2xl font-bold text-teal-600">MediBook</h1>
        </div>
        <button
          onClick={openAuth}
          className="px-6 py-2 bg-linear-to-r from-teal-600 to-blue-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
        >
          Doctor Login
        </button>
      </nav>

      {/* Hero Section */}
      <section className="flex items-center justify-between px-6 md:px-12 py-20 max-w-7xl mx-auto gap-12">
        <div className="flex-1">
          <h2 className="text-6xl font-bold mb-6 leading-tight">
            Your Health, <span className="text-teal-600">Just a<br />Click Away</span>
          </h2>
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            Book appointments with top doctors, manage your health records, and get instant AI-powered symptom analysis.
          </p>
          <div className="flex gap-4 mb-12">
            <button
              onClick={() => router.push('/book')}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition"
            >
              Book Appointment
            </button>
            <button
              onClick={openAuth}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition"
            >
              I'm a Doctor
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-teal-600 mb-2">500+</div>
              <div className="text-gray-600">Expert Doctors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-teal-600 mb-2">10k+</div>
              <div className="text-gray-600">Happy Patients</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-teal-600 mb-2">20+</div>
              <div className="text-gray-600">Specializations</div>
            </div>
          </div>
        </div>
        <div className="flex-1 hidden md:block">
          <div className="relative">
            <img 
              src="/Screenshot 2026-02-07 163117.png"
              alt="Medical Team"
              className="w-full h-96 object-cover rounded-3xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Why Choose MediBook */}
      <section className="px-6 md:px-12 py-20 bg-linear-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Why Choose MediBook?</h2>
          <p className="text-gray-600 text-center mb-16">Experience healthcare like never before</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-bold mb-3">Easy Booking</h3>
              <p className="text-gray-600">Book appointments in seconds with real-time doctor availability</p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition">
              <div className="text-4xl mb-4">✓</div>
              <h3 className="text-xl font-bold mb-3">Verified Doctors</h3>
              <p className="text-gray-600">All doctors are verified and approved by our medical board</p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-xl font-bold mb-3">24/7 Support</h3>
              <p className="text-gray-600">Round-the-clock customer support for all your queries</p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-bold mb-3">Digital Prescriptions</h3>
              <p className="text-gray-600">Get and manage all your prescriptions digitally</p>
            </div>

            {/* Card 5 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition">
              <div className="text-4xl mb-4">❤️</div>
              <h3 className="text-xl font-bold mb-3">AI Symptom Checker</h3>
              <p className="text-gray-600">Get instant preliminary diagnosis with our AI-powered tool</p>
            </div>

            {/* Card 6 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-3">Secure & Private</h3>
              <p className="text-gray-600">Your health data is encrypted and completely secure</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Specializations */}
      <section className="px-6 md:px-12 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Popular Specializations</h2>
          <p className="text-gray-600 text-center mb-16">Find the right specialist for your needs</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Cardiology', icon: '/Screenshot 2026-02-07 155312.png' },
              { name: 'Dermatology', icon: '/Screenshot 2026-02-07 155632.png' },
              { name: 'Neurology', icon: '/Screenshot 2026-02-07 160315.png' },
              { name: 'Orthopedic', icon: '/Screenshot 2026-02-07 160805.png' },
              { name: 'Pediatrics', icon: '/Screenshot 2026-02-07 161416.png' },
              { name: 'Gynecology', icon: '/Screenshot 2026-02-07 161809.png' },
              { name: 'Dentistry', icon: '/Screenshot 2026-02-07 161912.png' },
              { name: 'Ophthalmology', icon: '/Screenshot 2026-02-07 162050.png' }
            ].map((spec) => (
              <div key={spec.name} className="bg-blue-50 p-8 rounded-2xl text-center hover:bg-blue-100 transition cursor-pointer group overflow-hidden">
                <img 
                  src={spec.icon} 
                  alt={spec.name}
                  className="w-24 h-24 mx-auto mb-4 object-cover rounded-lg group-hover:scale-110 transition-transform"
                />
                <h3 className="font-bold text-gray-900">{spec.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 md:px-12 py-20 bg-linear-to-r from-teal-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Book Your Appointment?</h2>
          <p className="text-white/90 text-lg mb-8">No registration needed! Book your appointment instantly with MediBook</p>
          <button
            onClick={() => router.push('/book')}
            className="px-8 py-3 bg-white text-teal-600 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Book Your Appointment Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-linear-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">♥</span>
                </div>
                <h3 className="font-bold text-lg">MediBook</h3>
              </div>
              <p className="text-gray-600 text-sm">Your trusted healthcare partner for online doctor appointments.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">For Patients</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><a href="#" className="hover:text-teal-600">Find Doctors</a></li>
                <li><a href="#" className="hover:text-teal-600">Book Appointment</a></li>
                <li><a href="#" className="hover:text-teal-600">AI Symptom Checker</a></li>
                <li><a href="#" className="hover:text-teal-600">Prescriptions</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">For Doctors</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><a href="#" className="hover:text-teal-600">Register as Doctor</a></li>
                <li><a href="#" className="hover:text-teal-600">Manage Appointments</a></li>
                <li><a href="#" className="hover:text-teal-600">Patient Records</a></li>
                <li><a href="#" className="hover:text-teal-600">Earnings</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><a href="#" className="hover:text-teal-600">Help Center</a></li>
                <li><a href="#" className="hover:text-teal-600">Contact Us</a></li>
                <li><a href="#" className="hover:text-teal-600">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-teal-600">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-300 pt-8 text-center text-gray-600 text-sm">
            <p>© 2026 MediBook. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </main>
  );
}

function AuthModal({ onClose }) {
  const router = useRouter();
  const [role, setRole] = useState('doctor');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [degree, setDegree] = useState('');
  const [experience_years, setExperienceYears] = useState('');
  const [consultation_fee, setConsultationFee] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (role === 'doctor') {
      if (!specialization) {
        setError('Please select a specialization');
        return;
      }
      if (!degree.trim()) {
        setError('Degree is required');
        return;
      }
      if (!experience_years || experience_years < 0) {
        setError('Please enter valid experience years');
        return;
      }
      if (!consultation_fee || consultation_fee < 0) {
        setError('Please enter valid consultation fee');
        return;
      }
    }

    setLoading(true);

    try {
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/check-email`,
        },
      });

      if (authError) {
        logError('Auth signup error', authError);
        setError(getErrorMessage(authError));
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Failed to create account. Please try again.');
        setLoading(false);
        return;
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users_extended')
        .insert([
          {
            id: authData.user.id,
            full_name: fullName,
            role: role,
          },
        ]);

      if (profileError) {
        logError('Profile creation error', profileError);
        setError(`Profile creation failed: ${getErrorMessage(profileError)}`);
        setLoading(false);
        return;
      }

      // Create doctor profile if registering as doctor
      if (role === 'doctor') {
        try {
          const doctorResponse = await fetch('/api/auth/register-doctor', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              doctor_id: authData.user.id,
              specialization: specialization,
              experience_years: experience_years,
              consultation_fee: consultation_fee,
            }),
          })

          const doctorData = await doctorResponse.json()

          if (!doctorResponse.ok) {
            console.warn('Doctor profile creation failed:', doctorData.error)
          } else {
            console.log('Doctor profile created successfully')
          }
        } catch (err) {
          console.warn('Error creating doctor profile:', err)
        }
      }

      setSuccess('✓ Registration successful! Check your email for confirmation.');
      setTimeout(() => {
        router.replace(`/check-email?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err) {
      logError('Unexpected signup error', err);
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-linear-to-br from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">♥</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Doctor & Admin Portal</h2>
            <p className="text-gray-600 text-sm">Sign in or register as a doctor to continue</p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-300 text-green-800 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">I am a</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                >
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              {role === 'doctor' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Specialization</label>
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                      required
                    >
                      <option value="">Select specialization</option>
                      <option value="General Physician">General Physician</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Orthopedic">Orthopedic</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Gynecology">Gynecology</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Degree</label>
                    <input
                      type="text"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      placeholder="MBBS, MD"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Experience (years)</label>
                      <input
                        type="number"
                        value={experience_years}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        placeholder="5"
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Consultation Fee ($)</label>
                      <input
                        type="number"
                        value={consultation_fee}
                        onChange={(e) => setConsultationFee(e.target.value)}
                        placeholder="50"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-linear-to-r from-teal-600 to-blue-600 text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push('/login');
                }}
                className="w-full py-2 border border-teal-600 text-teal-600 rounded-lg font-semibold hover:bg-teal-50 transition"
              >
                Login
              </button>
            </form>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="mt-4 w-full py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
