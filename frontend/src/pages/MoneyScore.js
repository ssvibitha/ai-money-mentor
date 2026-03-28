import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MoneyScore.css';

const questions = [
  {
    id: 'emergency_fund',
    title: 'Emergency Fund',
    question: 'How many months of expenses have you saved?',
    maxPoints: 20,
    options: [
      { text: '0 months', points: 0 },
      { text: '1–2 months', points: 5 },
      { text: '3–6 months', points: 15 },
      { text: '6+ months', points: 20 },
    ],
  },
  {
    id: 'insurance',
    title: 'Insurance',
    question: 'Do you have health + term insurance?',
    maxPoints: 15,
    options: [
      { text: 'None', points: 0 },
      { text: 'Only health', points: 8 },
      { text: 'Both', points: 15 },
    ],
  },
  {
    id: 'investments',
    title: 'Investments',
    question: 'Do you invest regularly?',
    maxPoints: 20,
    options: [
      { text: 'Never', points: 0 },
      { text: 'Sometimes', points: 8 },
      { text: 'Every month', points: 20 },
    ],
  },
  {
    id: 'debt',
    title: 'Debt',
    question: 'What is your current debt situation?',
    maxPoints: 15,
    options: [
      { text: 'High debt', points: 0 },
      { text: 'Manageable', points: 8 },
      { text: 'Debt-free', points: 15 },
    ],
  },
  {
    id: 'tax_efficiency',
    title: 'Tax Efficiency',
    question: 'Do you actively save tax?',
    maxPoints: 15,
    options: [
      { text: 'No', points: 0 },
      { text: 'Not sure', points: 5 },
      { text: 'Yes', points: 15 },
    ],
  },
  {
    id: 'retirement',
    title: 'Retirement Planning',
    question: 'Do you have a retirement goal?',
    maxPoints: 15,
    options: [
      { text: 'No', points: 0 },
      { text: 'Thinking about it', points: 5 },
      { text: 'Yes with a plan', points: 15 },
    ],
  },
];

const MoneyScore = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleOptionSelect = (questionId, option) => {
    setAnswers({
      ...answers,
      [questionId]: option,
    });
    
    // Auto-advance after a short delay
    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 400);
    }
  };

  const calculateScore = () => {
    let total = 0;
    const dimensions = {};
    
    questions.forEach(q => {
      const selectedOption = answers[q.id];
      const points = selectedOption ? selectedOption.points : 0;
      total += points;
      dimensions[q.id] = {
        answer: selectedOption ? selectedOption.text : 'Unanswered',
        points: points,
        maxPoints: q.maxPoints
      };
    });
    
    return { score: total, dimensions };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const { score, dimensions } = calculateScore();
    
    try {
      const res = await axios.post('http://localhost:5001/api/ai/analyze-score', {
        score,
        dimensions
      });
      
      setResult({
        score,
        dimensions,
        aiAnalysis: res.data
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      // Fallback result in case API fails
      setResult({
        score,
        dimensions,
        aiAnalysis: {
          overall_rating: "Error generating rating.",
          recommendations: {},
          top_priority: "Please try again later.",
          encouragement: "We couldn't analyze your results right now, but calculating your score is the first step!"
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreBand = (score) => {
    if (score <= 40) return { color: 'text-red-500', bg: 'bg-red-500', text: 'Needs urgent attention', ring: '#ef4444' };
    if (score <= 70) return { color: 'text-amber-500', bg: 'bg-amber-500', text: 'On the right track', ring: '#f59e0b' };
    return { color: 'text-green-500', bg: 'bg-green-500', text: 'Financially healthy', ring: '#10b981' };
  };

  // Render Quiz
  if (!result) {
    const q = questions[currentStep];
    const isLastStep = currentStep === questions.length - 1;
    const allAnswered = Object.keys(answers).length === questions.length;

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden fade-in">
          
          <div className="bg-indigo-600 px-6 py-8 text-center text-white">
            <h1 className="text-3xl font-extrabold tracking-tight">Money Health Score</h1>
            <p className="mt-2 text-indigo-200">Take this 60-second quiz to discover your financial wellness.</p>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
                <span>Step {currentStep + 1} of {questions.length}</span>
                <span>{Math.round(((currentStep + 1) / questions.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div key={q.id} className="slide-up">
              <h2 className="text-sm font-semibold text-indigo-600 tracking-wide uppercase">{q.title}</h2>
              <h3 className="mt-2 text-2xl font-bold text-gray-900 mb-6">{q.question}</h3>
              
              <div className="space-y-3">
                {q.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(q.id, opt)}
                    className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 option-card ${
                      answers[q.id]?.text === opt.text
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                    }`}
                  >
                    <span className="font-medium">{opt.text}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 flex justify-between items-center">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                ← Back
              </button>
              
              {isLastStep ? (
                <button
                  onClick={handleSubmit}
                  disabled={!allAnswered || isSubmitting}
                  className="flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? (
                    <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Analyzing...</>
                  ) : "Calculate My Score"}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!answers[q.id]}
                  className="px-6 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Results
  const band = getScoreBand(result.score);
  const size = 200;
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (result.score / 100) * circumference;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 fade-in">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Your Money Health Report</h1>
          <p className="text-lg text-gray-600">A detailed analysis of your financial foundation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Score Card */}
          <div className="col-span-1 bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center transform transition duration-500 hover:scale-[1.02]">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Overall Score</h2>
            <div className="relative flex items-center justify-center w-full mb-6">
              <svg width={size} height={size} className="score-ring transform -rotate-90">
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#e5e7eb"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={band.ring}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 2s ease-out' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-5xl font-black text-gray-900">{result.score}</span>
                <span className="text-sm font-medium text-gray-500 mt-1">/ 100</span>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full font-bold text-sm bg-opacity-10 ${band.color} bg-current`}>
              {band.text}
            </div>
          </div>

          {/* AI Insights & Dimensions */}
          <div className="col-span-1 md:col-span-2 space-y-8">
            {/* Top Priority */}
            {result.aiAnalysis?.top_priority && (
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 shadow-lg text-white slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">⭐</span>
                  <h3 className="text-xl font-bold">Top Priority</h3>
                </div>
                <p className="text-indigo-100 text-lg">{result.aiAnalysis.top_priority}</p>
                {result.aiAnalysis.encouragement && (
                  <p className="mt-4 pt-4 border-t border-white border-opacity-20 italic font-medium">
                    "{result.aiAnalysis.encouragement}"
                  </p>
                )}
              </div>
            )}

            {/* Dimension Breakdown */}
            <div className="bg-white rounded-3xl shadow-xl p-8 slide-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-xl font-bold text-gray-900 mb-6">Dimension Breakdown</h3>
              <div className="space-y-6">
                {questions.map((q) => {
                  const dim = result.dimensions[q.id];
                  const percentage = (dim.points / dim.maxPoints) * 100;
                  const isWeak = percentage < 70;
                  const recommendation = result.aiAnalysis?.recommendations?.[q.id];
                  
                  return (
                    <div key={q.id} className="relative">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <span className="font-semibold text-gray-800 block">{q.title}</span>
                          <span className="text-sm text-gray-500">{dim.answer}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{dim.points}/{dim.maxPoints} pts</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full progress-bar-fill ${isWeak ? 'bg-amber-400' : 'bg-green-500'}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      {isWeak && recommendation && recommendation !== "null" && (
                        <div className="mt-3 bg-amber-50 text-amber-800 text-sm p-3 rounded-lg flex items-start">
                          <span className="mr-2">💡</span>
                          <p>{typeof recommendation === 'string' ? recommendation : JSON.stringify(recommendation)}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 pb-12">
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            Retake Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoneyScore;
