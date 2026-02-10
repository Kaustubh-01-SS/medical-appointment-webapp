'use client'

import { useState } from 'react'
import Link from 'next/link'
import { analyzeSymptoms, commonSymptoms } from '@/lib/symptomChecker'

export default function SymptomCheckerPage() {
  const [symptoms, setSymptoms] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleAnalyze = async (e) => {
    e.preventDefault()
    
    if (!symptoms.trim()) {
      return
    }

    setLoading(true)
    setShowSuggestions(false)

    try {
      const analysisResult = await analyzeSymptoms(symptoms)
      setResult(analysisResult)
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to analyze symptoms. Please try again.'
      })
    }

    setLoading(false)
  }

  const addSymptom = (symptom) => {
    if (!symptoms.toLowerCase().includes(symptom.toLowerCase())) {
      setSymptoms(prev => prev ? `${prev}, ${symptom}` : symptom)
    }
  }

  const removeSymptom = (index) => {
    const symptomsArray = symptoms.split(',').map(s => s.trim())
    symptomsArray.splice(index, 1)
    setSymptoms(symptomsArray.join(', '))
  }

  const filteredSuggestions = showSuggestions && symptoms.length > 0
    ? commonSymptoms.filter(s => 
        s.toLowerCase().includes(symptoms.split(',').pop().trim().toLowerCase()) &&
        !symptoms.toLowerCase().includes(s.toLowerCase())
      ).slice(0, 5)
    : []

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-black">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 bg-slate-800/50 border-b border-slate-700">
        <Link href="/dashboard" className="text-xl font-bold text-blue-400">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-bold text-white">AI Symptom Checker</h1>
        <div className="w-20"></div>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        {/* Info Banner */}
        <div className="bg-blue-500/20 border border-blue-500 text-blue-300 p-4 rounded-lg mb-6">
          <p className="font-semibold mb-2">⚠️ Medical Disclaimer</p>
          <p className="text-sm">This tool is for informational purposes only and is not a substitute for professional medical advice. Always consult with a healthcare provider for accurate diagnosis and treatment.</p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAnalyze} className="bg-slate-800 p-6 rounded-lg mb-6">
          <label className="block text-white font-semibold mb-3">
            Describe Your Symptoms
          </label>
          
          <div className="relative mb-4">
            <textarea
              value={symptoms}
              onChange={(e) => {
                setSymptoms(e.target.value)
                setShowSuggestions(true)
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="e.g., headache, fever, cough, sore throat"
              className="w-full p-3 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 min-h-24"
            />

            {/* Suggestions Dropdown */}
            {filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-slate-700 border border-slate-600 rounded-lg mt-1 z-10">
                {filteredSuggestions.map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addSymptom(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-600 text-gray-200 text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Symptoms Tags */}
          {symptoms && (
            <div className="flex flex-wrap gap-2 mb-4">
              {symptoms.split(',').map((symptom, idx) => {
                const trimmed = symptom.trim()
                return trimmed ? (
                  <div
                    key={idx}
                    className="bg-blue-600/50 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    <span>{trimmed}</span>
                    <button
                      type="button"
                      onClick={() => removeSymptom(idx)}
                      className="text-lg leading-none hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                ) : null
              })}
            </div>
          )}

          {/* Quick Add Common Symptoms */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2">Quick add common symptoms:</p>
            <div className="flex flex-wrap gap-2">
              {['fever', 'cough', 'headache', 'sore throat', 'fatigue', 'nausea'].map(symptom => (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => addSymptom(symptom)}
                  className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-gray-300 text-sm rounded transition"
                >
                  + {symptom}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !symptoms.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
          >
            {loading ? 'Analyzing...' : 'Analyze Symptoms'}
          </button>
        </form>

        {/* Results */}
        {result && (
          <div className="bg-slate-800 p-6 rounded-lg">
            {result.success ? (
              <>
                {/* Severity Badge */}
                <div className="mb-6">
                  <p className="text-gray-400 text-sm mb-2">Severity Level</p>
                  <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-lg font-semibold text-white ${
                      result.analysis.severity === 'high' ? 'bg-red-600' :
                      result.analysis.severity === 'medium' ? 'bg-yellow-600' :
                      'bg-green-600'
                    }`}>
                      {result.analysis.severity.toUpperCase()}
                    </div>
                    {result.analysis.urgency && (
                      <div className="bg-red-500/20 border border-red-500 text-red-300 px-3 py-1 rounded text-sm">
                        🚨 Seek urgent care
                      </div>
                    )}
                  </div>
                </div>

                {/* Possible Conditions */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-3">Possible Conditions</h3>
                  <div className="space-y-3">
                    {result.analysis.possibleConditions.map((condition, idx) => (
                      <div key={idx} className="bg-slate-700/50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-white font-semibold capitalize">{condition.condition}</h4>
                          <span className="bg-blue-600/50 px-2 py-1 rounded text-xs text-blue-200">
                            {condition.confidence}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">Recommended specialists:</p>
                        <div className="flex flex-wrap gap-2">
                          {condition.specialists.map((specialist, sidx) => (
                            <span
                              key={sidx}
                              className="bg-emerald-600/20 text-emerald-300 px-3 py-1 rounded text-xs"
                            >
                              {specialist}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advice */}
                <div className="bg-amber-500/20 border border-amber-500 text-amber-100 p-4 rounded-lg mb-6">
                  <p className="font-semibold mb-2">💡 Recommendation</p>
                  <p className="text-sm">{result.analysis.advice}</p>
                </div>

                {/* Book Appointment Button */}
                {!result.analysis.urgency && (
                  <Link
                    href="/book"
                    className="block w-full text-center py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition"
                  >
                    Book an Appointment
                  </Link>
                )}
              </>
            ) : (
              <div className="text-red-300">
                <p>{result.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
