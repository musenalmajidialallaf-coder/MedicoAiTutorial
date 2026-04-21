import { useState, useEffect } from 'react';
import { HelpCircle, ChevronRight, CheckCircle2, XCircle, Trophy, Timer } from 'lucide-react';
import { cn } from '../lib/utils';
import { MCQ } from '../lib/gemini';
import Markdown from 'react-markdown';

interface QuizViewProps {
  questions?: MCQ[];
}

export function QuizView({ questions = [] }: QuizViewProps) {
  const quizId = questions.length > 0 ? questions[0].question.substring(0, 50) : 'default';

  const loadState = (key: string, defaultValue: any) => {
    try {
      const saved = localStorage.getItem(`app_quiz_${quizId}_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => loadState('index', 0));
  const [selectedOption, setSelectedOption] = useState<number | null>(() => loadState('option', null));
  const [isAnswered, setIsAnswered] = useState(() => loadState('answered', false));
  const [score, setScore] = useState(() => loadState('score', 0));
  const [isFinished, setIsFinished] = useState(() => loadState('finished', false));
  const [timeLeft, setTimeLeft] = useState(() => loadState('timeLeft', 180));

  useEffect(() => {
    try {
      localStorage.setItem(`app_quiz_${quizId}_index`, JSON.stringify(currentQuestionIndex));
      localStorage.setItem(`app_quiz_${quizId}_option`, JSON.stringify(selectedOption));
      localStorage.setItem(`app_quiz_${quizId}_answered`, JSON.stringify(isAnswered));
      localStorage.setItem(`app_quiz_${quizId}_score`, JSON.stringify(score));
      localStorage.setItem(`app_quiz_${quizId}_finished`, JSON.stringify(isFinished));
      localStorage.setItem(`app_quiz_${quizId}_timeLeft`, JSON.stringify(timeLeft));
    } catch (e) {
      console.warn('Failed to save quiz state', e);
    }
  }, [currentQuestionIndex, selectedOption, isAnswered, score, isFinished, timeLeft, quizId]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(180);
    } else {
      setIsFinished(true);
    }
  };

  useEffect(() => {
    if (isAnswered || isFinished || questions.length === 0) return;

    if (timeLeft <= 0) {
      // Time is up -> consider it wrong by moving to next question skipping current one
      handleNextQuestion();
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, isAnswered, isFinished, questions.length]);

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 py-16 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
        <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">لا توجد أسئلة متاحة</h3>
        <p className="text-slate-500 mt-2">عذراً، حدث خطأ أثناء تحميل الأسئلة. يرجى المحاولة مرة أخرى.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    
    setSelectedOption(index);
    setIsAnswered(true);
    
    if (index === currentQuestion.correctAnswerIndex) {
      setScore(s => s + 1);
    }
  };

  if (isFinished) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400 mb-6">
          <Trophy className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">اكتمل الاختبار!</h2>
        <div className="text-6xl font-black text-slate-800 dark:text-slate-100 mb-6">
          {score} <span className="text-2xl text-slate-500 font-bold">/ {questions.length}</span>
        </div>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-md leading-relaxed">
          {score >= 8 ? 'ممتاز! فهمك للمحاضرة عميق جداً.' : 
           score >= 5 ? 'أداء جيد، لكن يمكنك مراجعة بعض المفاهيم لتصبح أفضل.' : 
           'يجب عليك مراجعة المحاضرة مرة أخرى للتركيز على التفاصيل الأساسية.'}
        </p>
        <button
          onClick={() => {
            setIsFinished(false);
            setCurrentQuestionIndex(0);
            setSelectedOption(null);
            setIsAnswered(false);
            setScore(0);
            setTimeLeft(180);
          }}
          className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md"
        >
          إعادة الاختبار
        </button>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-xl text-teal-600 dark:text-teal-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">أسئلة (MCQ)</h2>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          {!isFinished && (
            <div className={cn("flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-xl font-bold font-mono text-lg", timeLeft <= 30 ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300")}>
              <Timer className="w-5 h-5" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
          <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-lg font-mono">
            {currentQuestionIndex + 1} / {questions.length}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
           <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed font-sans" dir="ltr">
            {currentQuestion.question}
          </h3>
        </div>

        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQuestion.correctAnswerIndex;
            
            let btnClass = "w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between font-sans text-lg";
            
            if (!isAnswered) {
              btnClass = cn(btnClass, "border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/10 bg-white dark:bg-slate-900 cursor-pointer text-slate-700 dark:text-slate-200");
            } else {
              if (isCorrect) {
                 btnClass = cn(btnClass, "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300");
              } else if (isSelected && !isCorrect) {
                 btnClass = cn(btnClass, "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300");
              } else {
                 btnClass = cn(btnClass, "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-400 opacity-50");
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                disabled={isAnswered}
                className={btnClass}
                dir="ltr"
              >
                <div className="flex items-center space-x-4">
                  <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="font-medium">{option}</span>
                </div>
                {isAnswered && isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 ml-4" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-rose-500 shrink-0 ml-4" />}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8 space-y-6">
            <div className={cn(
              "p-6 rounded-2xl border",
              selectedOption === currentQuestion.correctAnswerIndex 
                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
                : "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100"
            )}>
              <div className="flex items-center space-x-2 space-x-reverse mb-4">
                {selectedOption === currentQuestion.correctAnswerIndex ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600" />
                )}
                <h4 className="font-bold text-xl">
                  {selectedOption === currentQuestion.correctAnswerIndex ? 'إجابة صحيحة!' : (selectedOption === -1 ? 'انتهى الوقت!' : 'إجابة خاطئة')}
                </h4>
              </div>
              <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed" dir="rtl">
                <Markdown>{currentQuestion.explanation}</Markdown>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNextQuestion}
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-xl font-bold flex items-center space-x-2 space-x-reverse transition-colors shadow-md"
              >
                <span>{currentQuestionIndex < questions.length - 1 ? 'السؤال التالي' : 'إنهاء الاختبار'}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
