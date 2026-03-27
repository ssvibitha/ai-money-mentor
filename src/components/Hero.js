import React from 'react';

const Hero = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-softgreen to-white flex items-center justify-center px-4">
      <div className="text-center max-w-4xl">
        <img
          src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=400&fit=crop&crop=center"
          alt="Financial Freedom Illustration"
          className="w-full max-w-2xl mx-auto rounded-2xl shadow-soft mb-8"
        />
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Achieve Financial Independence with AI
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Plan your path to FIRE with personalized insights, risk assessments, and milestone tracking. Powered by AI for smarter financial decisions.
        </p>
        <button
          onClick={onGetStarted}
          className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-md hover:shadow-lg transition"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Hero;