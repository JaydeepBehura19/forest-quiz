import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { questions } from './data/questions';
import { shuffleArray } from './utils/shuffle';
import { ArrowLeft, ArrowRight, Home, CheckCircle2, XCircle } from 'lucide-react';

const WEEKS = [...new Set(questions.map(q => q.week))];

export default function App() {
  const [view, setView] = useState('dashboard'); // dashboard, quiz, result
  const [selectedWeek, setSelectedWeek] = useState(null);
  
  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionIndex: { selectedOption, isCorrect } }
  
  // Temporary state for the delayed auto-advance
  const [showFeedback, setShowFeedback] = useState(false);
  const timeoutRef = React.useRef(null);

  // Initialize quiz
  const startQuiz = (week) => {
    let weekQuestions = [];
    if (week === 'all') {
      weekQuestions = [...questions];
    } else {
      weekQuestions = questions.filter(q => q.week === week);
    }
    
    // Add shuffled options to each question at the start of the attempt
    const preparedQuestions = weekQuestions.map(q => ({
      ...q,
      shuffledOptions: shuffleArray(q.options)
    }));
    
    setQuizQuestions(preparedQuestions);
    setSelectedWeek(week);
    setCurrentIndex(0);
    setAnswers({});
    setShowFeedback(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setView('quiz');
  };

  const currentQuestion = quizQuestions[currentIndex];
  const currentOptions = currentQuestion?.shuffledOptions || [];

  const handleSelectOption = (option) => {
    // Prevent multiple clicks while showing feedback (auto-advance in progress)
    if (showFeedback) return;

    const isCorrect = option === currentQuestion.answer;
    
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: {
        selectedOption: option,
        isCorrect
      }
    }));
    
    setShowFeedback(true);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      setShowFeedback(false);
      if (currentIndex < quizQuestions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setView('result');
      }
    }, 800);
  };

  const handleNext = useCallback(() => {
    if (currentIndex < quizQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowFeedback(false);
    } else {
      setView('result');
    }
  }, [currentIndex, quizQuestions.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowFeedback(false);
    }
  }, [currentIndex]);

  const handleKeyboard = useCallback((e) => {
    if (view !== 'quiz') return;
    
    if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      handlePrev();
    } else if (['1', '2', '3', '4'].includes(e.key)) {
      const optionIndex = parseInt(e.key) - 1;
      if (currentOptions[optionIndex]) {
        handleSelectOption(currentOptions[optionIndex]);
      }
    }
  }, [view, handleNext, handlePrev, currentOptions]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);

  // Dashboard View
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Forestry Certification Exam</h1>
            <p className="text-slate-600 text-lg">Select a module to begin your assessment</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <button
              onClick={() => startQuiz('all')}
              className="col-span-full py-4 bg-slate-900 text-white rounded-xl font-semibold shadow-sm hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              Comprehensive Exam (All Weeks)
            </button>
            {WEEKS.map(w => (
              <button
                key={w}
                onClick={() => startQuiz(w)}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all font-medium text-slate-700 active:scale-[0.98]"
              >
                {typeof w === 'number' ? `Week ${w}` : (w === 'Miscellaneous' ? 'Miscellaneous' : (w.toString().includes('Week') ? w : `Week ${w}`))}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Result View
  if (view === 'result') {
    const totalQuestions = quizQuestions.length;
    const correctCount = Object.values(answers).filter(a => a.isCorrect).length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-lg w-full bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Assessment Complete</h2>
          
          <div className="mb-8">
            <div className="text-7xl font-bold text-slate-900 mb-2">{percentage}%</div>
            <p className="text-slate-500 font-medium">Score: {correctCount} out of {totalQuestions}</p>
          </div>
          
          <div className="w-full bg-slate-100 rounded-full h-3 mb-10 overflow-hidden">
            <div 
              className={`h-3 rounded-full ${percentage >= 70 ? 'bg-emerald-500' : 'bg-red-500'}`} 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>

          <button
            onClick={() => setView('dashboard')}
            className="flex items-center justify-center w-full py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            <Home className="w-5 h-5 mr-2" />
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Quiz View
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <button 
          onClick={() => setView('dashboard')}
          className="flex items-center text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          <Home className="w-4 h-4 mr-2" />
          Quit Attempt
        </button>
        <div className="text-slate-900 font-semibold">
          Question {currentIndex + 1} of {quizQuestions.length}
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-1">
        <div 
          className="bg-slate-900 h-1 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / quizQuestions.length) * 100}%` }}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center p-6 py-12">
        <div className="max-w-3xl w-full flex-1 flex flex-col">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 leading-snug">
              {currentQuestion?.question}
            </h2>
          </div>

          <div className="space-y-3 flex-1">
            {currentOptions.map((opt, index) => {
              const currentAnswer = answers[currentIndex];
              const isSelected = currentAnswer?.selectedOption === opt;
              const isCorrectTarget = currentQuestion.answer === opt;
              
              let btnStateClass = 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50';
              let Icon = null;

              if (currentAnswer) {
                if (isSelected) {
                  if (currentAnswer.isCorrect) {
                     btnStateClass = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-medium';
                     Icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 ml-auto" />;
                  } else {
                     btnStateClass = 'bg-red-50 border-red-500 text-red-800 font-medium';
                     Icon = <XCircle className="w-5 h-5 text-red-600 ml-auto" />;
                  }
                } else if (isCorrectTarget) {
                  // Show the correct answer explicitly if the user has selected a wrong answer
                  btnStateClass = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-medium';
                  Icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 ml-auto" />;
                } else {
                  btnStateClass = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full flex items-center p-5 rounded-xl border-2 text-left transition-all active:scale-[0.99] ${btnStateClass}`}
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center font-semibold text-slate-500 mr-4 border border-slate-200">
                    {index + 1}
                  </span>
                  <span className="text-lg">{opt}</span>
                  {Icon}
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-colors ${
                currentIndex === 0 
                  ? 'text-slate-400 cursor-not-allowed bg-slate-100' 
                  : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>
            <button
              onClick={handleNext}
              className="flex items-center px-6 py-3 rounded-xl font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-colors"
            >
              {currentIndex === quizQuestions.length - 1 ? 'Finish' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
