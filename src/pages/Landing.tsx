import React, { useState } from 'react';
import { Sparkles, ArrowRight, PlayCircle, Gamepad2, BookOpen, Mic, Headphones, BookMarked, Trophy, Star, Medal, Heart, Users, MessageSquare } from 'lucide-react';

interface Props {
  onGoToLogin: () => void;
}

export default function Landing({ onGoToLogin }: Props) {
  return (
    <div className="min-h-screen bg-[#F7F9FC] font-sans overflow-hidden">
      {/* Top Navigation */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b-2 border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#6EC6FF] to-[#7EE787] rounded-[20px] text-white shadow-md flex items-center justify-center transform -rotate-6 hover:rotate-0 transition-transform cursor-pointer">
              <span className="font-extrabold text-3xl font-serif leading-none mt-1">G</span>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-gray-800 block leading-none">Kids Lang</span>
              <span className="text-[11px] text-[#FF8A65] font-bold tracking-tight block mt-0.5">English is fun!</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {['Home', 'Courses', 'Games', 'Stories', 'Parents'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[15px] font-bold text-gray-600 hover:text-[#6EC6FF] transition-colors">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={onGoToLogin} className="hidden sm:block px-6 py-2.5 text-[15px] font-bold text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors">
              Log in
            </button>
            <button onClick={onGoToLogin} className="px-6 py-2.5 text-[15px] font-bold text-white bg-gradient-to-r from-[#FFD93D] to-[#FF8A65] hover:from-[#FF8A65] hover:to-[#FFD93D] rounded-2xl shadow-[0_4px_0_#e65c00] hover:translate-y-1 hover:shadow-none transition-all">
              Sign Up Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 overflow-hidden">
        {/* Floating clouds/stars */}
        <div className="absolute top-20 left-10 text-[#6EC6FF] animate-float opacity-50"><Sparkles size={64} /></div>
        <div className="absolute top-40 right-20 text-[#FFD93D] animate-float-delayed opacity-50"><Star size={48} /></div>
        <div className="absolute bottom-20 left-1/4 text-[#C8B6FF] animate-cloud opacity-30"><svg width="100" height="60" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 19c-2.485 0-4.5-2.015-4.5-4.5 0-2.485 2.015-4.5 4.5-4.5.657 0 1.282.14 1.848.394A5.496 5.496 0 0 0 14 5c-3.038 0-5.5 2.462-5.5 5.5 0 .285.021.565.063.84A4.502 4.502 0 0 0 4.5 15C2.015 15 0 17.015 0 19.5S2.015 24 4.5 24h13c2.485 0 4.5-2.015 4.5-4.5S19.985 19 17.5 19z"/></svg></div>
        <div className="absolute top-1/3 right-1/4 text-[#7EE787] animate-float"><svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor" stroke="white" strokeWidth="1"><circle cx="12" cy="12" r="10"/></svg></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#1e1b4b] tracking-tight leading-tight mb-6">
            Learn English Through <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF8A65] via-[#FFD93D] to-[#7EE787]">Fun Adventures!</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto font-medium">
            Learn vocabulary, pronunciation, speaking, listening, reading, and writing through exciting games and interactive lessons.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={onGoToLogin} className="w-full sm:w-auto px-8 py-4 text-lg font-bold text-white bg-[#7EE787] rounded-3xl shadow-[0_6px_0_#2E8B57] hover:translate-y-1 hover:shadow-[0_2px_0_#2E8B57] transition-all flex items-center justify-center gap-2">
              Start Learning <ArrowRight size={20} />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 text-lg font-bold text-[#6EC6FF] bg-white border-2 border-[#6EC6FF] rounded-3xl shadow-[0_6px_0_#6EC6FF] hover:translate-y-1 hover:shadow-[0_2px_0_#6EC6FF] transition-all flex items-center justify-center gap-2">
              <PlayCircle size={20} /> Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-20 px-4 sm:px-6 bg-white" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-4">Discover the Magic of Learning</h2>
            <p className="text-gray-500 font-medium">Everything your child needs to master English.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Gamepad2, title: 'Interactive Games', color: 'bg-[#6EC6FF]' },
              { icon: BookOpen, title: 'Vocabulary Builder', color: 'bg-[#FF8A65]' },
              { icon: Mic, title: 'Speaking Practice', color: 'bg-[#7EE787]' },
              { icon: Headphones, title: 'Listening Exercises', color: 'bg-[#FFD93D]' },
              { icon: BookMarked, title: 'Story Reading', color: 'bg-[#C8B6FF]' },
              { icon: Trophy, title: 'Daily Challenges', color: 'bg-[#6EC6FF]' },
              { icon: Medal, title: 'Achievements', color: 'bg-[#FF8A65]' },
              { icon: Star, title: 'Rewards', color: 'bg-[#FFD93D]' }
            ].map((feat, idx) => (
              <div key={idx} className="bg-[#F7F9FC] border-2 border-gray-100 rounded-[32px] p-6 text-center hover:scale-105 transition-transform cursor-pointer group">
                <div className={`w-16 h-16 mx-auto ${feat.color} rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 transform group-hover:rotate-6 transition-transform`}>
                  <feat.icon size={32} />
                </div>
                <h3 className="font-bold text-gray-800 text-lg">{feat.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Categories */}
      <section className="py-20 px-4 sm:px-6" id="courses">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-4">Explore Fun Topics</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { name: 'Animals', emoji: '🐶', color: 'bg-orange-100 border-orange-200' },
              { name: 'Food', emoji: '🍎', color: 'bg-red-100 border-red-200' },
              { name: 'Family', emoji: '👨‍👩‍👧', color: 'bg-blue-100 border-blue-200' },
              { name: 'School', emoji: '🎒', color: 'bg-yellow-100 border-yellow-200' },
              { name: 'Numbers', emoji: '🔢', color: 'bg-purple-100 border-purple-200' },
              { name: 'Colors', emoji: '🎨', color: 'bg-pink-100 border-pink-200' },
              { name: 'Jobs', emoji: '👩‍⚕️', color: 'bg-teal-100 border-teal-200' },
              { name: 'Nature', emoji: '🌳', color: 'bg-green-100 border-green-200' },
              { name: 'Travel', emoji: '✈️', color: 'bg-sky-100 border-sky-200' },
              { name: 'Sports', emoji: '⚽', color: 'bg-indigo-100 border-indigo-200' }
            ].map((cat, idx) => (
              <div key={idx} className={`border-2 rounded-[24px] p-6 text-center hover:scale-105 transition-transform cursor-pointer ${cat.color}`}>
                <div className="text-4xl mb-2">{cat.emoji}</div>
                <h3 className="font-bold text-gray-800">{cat.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-6">Loved by Parents and Kids</h2>
              <div className="space-y-6">
                <div className="bg-[#F7F9FC] border-2 border-gray-100 p-6 rounded-[32px] relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center text-xl">👩</div>
                    <div>
                      <h4 className="font-bold text-gray-800">Sarah's Mom</h4>
                      <div className="flex text-[#FFD93D]"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
                    </div>
                  </div>
                  <p className="text-gray-600 font-medium italic">"My daughter loves the interactive games! She's learning new vocabulary every day without even realizing she's studying."</p>
                  <MessageSquare className="absolute top-6 right-6 text-gray-200" size={48} />
                </div>
              </div>
            </div>
            <div className="flex justify-center relative">
              {/* Decorative Mascot illustration placeholder */}
              <div className="w-72 h-72 bg-gradient-to-br from-[#6EC6FF] to-[#C8B6FF] rounded-[48px] transform rotate-3 flex items-center justify-center shadow-2xl">
                 <Heart size={100} className="text-white animate-pulse" fill="white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1e1b4b] pt-16 pb-8 px-4 sm:px-6 rounded-t-[40px] mt-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
             <h3 className="text-white font-extrabold text-xl mb-4">Kids Lang</h3>
             <p className="text-gray-400 text-sm">Making English learning magical for kids around the world.</p>
          </div>
          <div>
             <h4 className="text-white font-bold mb-4">Explore</h4>
             <ul className="space-y-2 text-gray-400 text-sm">
               <li><a href="#" className="hover:text-white">Games</a></li>
               <li><a href="#" className="hover:text-white">Stories</a></li>
               <li><a href="#" className="hover:text-white">Parents</a></li>
             </ul>
          </div>
          <div>
             <h4 className="text-white font-bold mb-4">Legal</h4>
             <ul className="space-y-2 text-gray-400 text-sm">
               <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
               <li><a href="#" className="hover:text-white">Terms of Service</a></li>
             </ul>
          </div>
          <div>
             <h4 className="text-white font-bold mb-4">Connect</h4>
             <div className="flex gap-4 text-gray-400">
               <Users className="hover:text-white cursor-pointer" />
               <Heart className="hover:text-white cursor-pointer" />
             </div>
          </div>
        </div>
        <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-700">
          © 2026 Kids Lang. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
