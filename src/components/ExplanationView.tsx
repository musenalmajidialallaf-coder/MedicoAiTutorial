import { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { LectureAnalysis, MCQ, generateQuiz } from '../lib/gemini';
import { PlayCircle, History, Activity, Pill, Copy, Check, BookOpen, List, HelpCircle, ThumbsUp, ThumbsDown, FileDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { QuizView } from './QuizView';

interface ExplanationViewProps {
  analysis: LectureAnalysis;
}

export function ExplanationView({ analysis }: ExplanationViewProps) {
  const [activeTab, setActiveTab] = useState<'explanation' | 'glossary' | 'quiz'>(() => {
    try {
      const saved = localStorage.getItem(`app_activeTab_${analysis.title}`);
      return (saved as any) || 'explanation';
    } catch {
      return 'explanation';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`app_activeTab_${analysis.title}`, activeTab);
    } catch (e) {}
  }, [activeTab, analysis.title]);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [verseIndex, setVerseIndex] = useState(0);

  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');
  const [feedbackType, setFeedbackType] = useState<'up' | 'down' | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  
  const [mcqs, setMcqs] = useState<MCQ[]>(() => {
    try {
      const saved = localStorage.getItem(`app_mcqs_${analysis.title}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      if (mcqs.length > 0) {
        localStorage.setItem(`app_mcqs_${analysis.title}`, JSON.stringify(mcqs));
      } else {
        localStorage.removeItem(`app_mcqs_${analysis.title}`);
      }
    } catch (e) {
      console.warn('Failed to save MCQs to local storage');
    }
  }, [mcqs, analysis.title]);

  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  const downloadPDF = () => {
    window.print();
  };

  const submitFeedback = async () => {
    if (!feedbackType) return;
    setFeedbackStatus('submitting');
    try {
      await addDoc(collection(db, 'feedbacks'), {
        userId: auth.currentUser?.uid || 'anonymous',
        lectureTitle: analysis.title || 'بدون عنوان',
        type: feedbackType,
        comment: feedbackComment,
        createdAt: serverTimestamp()
      });
      setFeedbackStatus('submitted');
    } catch (error) {
      console.error('Error submitting feedback', error);
      setFeedbackStatus('idle');
      alert('حدث خطأ أثناء الإرسال');
    }
  };

  const adhkarAndVerses = [
    "ألا بذكر الله تطمئن القلوب",
    "سبحان الله وبحمده، سبحان الله العظيم",
    "اللهم علمنا ما ينفعنا وانفعنا بما علمتنا",
    "بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء",
    "رب اشرح لي صدري ويسر لي أمري",
    "لا إله إلا أنت سبحانك إني كنت من الظالمين",
    "اللهم إني أسألك علماً نافعاً ورزقاً طيباً وعملاً متقبلاً",
    "وقل ربي زدني علماً"
  ];

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = windowHeight > 0 ? totalScroll / windowHeight : 0;
      setScrollProgress(scroll);
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isGeneratingQuiz) {
      const interval = setInterval(() => {
        setVerseIndex((i) => (i + 1) % adhkarAndVerses.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isGeneratingQuiz]);

  const handleStartQuiz = async () => {
    if (mcqs.length > 0) {
      setActiveTab('quiz');
      return;
    }
    
    setIsGeneratingQuiz(true);
    setActiveTab('quiz'); // Switch tab immediately to show loading spinner in QuizView if we had one, but we use isGeneratingQuiz on the tab button
    try {
      const fullExplanation = (analysis.explanationBlocks || []).map(b => `${b.heading}\n${b.content}`).join('\n\n');
      const generatedQuiz = await generateQuiz(fullExplanation);
      setMcqs(generatedQuiz);
    } catch (error) {
      console.error('Failed to generate quiz', error);
      alert('حدث خطأ أثناء تحميل الاختبار. حاول مرة أخرى.');
      setActiveTab('explanation');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getBlockStyles = (type?: string) => {
    switch (type) {
      case 'clinical':
        return "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-100";
      case 'red_flag':
        return "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-100";
      case 'academic':
      default:
        return "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800/50 text-teal-900 dark:text-teal-100";
    }
  };

  const getBlockLabel = (type?: string) => {
    switch (type) {
      case 'clinical': return "ملاحظة سريرية";
      case 'red_flag': return "تنبيه هام (Red Flag)";
      case 'academic':
      default: return "معلومة أكاديمية";
    }
  };

  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-200 dark:bg-slate-800 z-50 print:hidden">
        <div 
          className="h-full bg-gradient-to-r from-teal-500 via-indigo-500 to-emerald-500 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress * 100}%` }}
        ></div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 space-x-reverse mb-8 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 sticky top-20 z-40 print:hidden">
        <button
          onClick={() => setActiveTab('explanation')}
          className={cn(
            "flex-1 flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-bold transition-all",
            activeTab === 'explanation' ? "bg-teal-600 text-white shadow-md" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          )}
        >
          <BookOpen className="w-5 h-5" />
          <span>الشرح</span>
        </button>
        <button
          onClick={() => setActiveTab('glossary')}
          className={cn(
            "flex-1 flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-bold transition-all",
            activeTab === 'glossary' ? "bg-teal-600 text-white shadow-md" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          )}
        >
          <List className="w-5 h-5" />
          <span>المصطلحات</span>
        </button>
        <button
          onClick={handleStartQuiz}
          disabled={isGeneratingQuiz}
          className={cn(
            "flex-1 flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-bold transition-all disabled:opacity-50",
            activeTab === 'quiz' ? "bg-emerald-600 text-white shadow-md" : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
          )}
        >
          <HelpCircle className={cn("w-5 h-5", isGeneratingQuiz && "animate-spin")} />
          <span>أسئلة (MCQ)</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'explanation' && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar TOC */}
            <div className="hidden lg:block w-64 shrink-0 print:hidden">
              <div className="sticky top-40 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">فهرس المحاضرة</h3>
                <ul className="space-y-3">
                  {(analysis.explanationBlocks || []).map((block, idx) => (
                    <li key={idx}>
                      <button 
                        onClick={() => scrollToHeading(`block-${idx}`)}
                        className="text-right w-full text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                      >
                        {block.heading}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Main Explanation Content */}
            <div className="flex-1 space-y-8" id="explanation-content">
              {analysis.previousReview && (
                <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-300">
                  <div className="bg-slate-600 px-8 py-4 text-white flex items-center space-x-3 space-x-reverse">
                    <History className="w-5 h-5" />
                    <h2 className="text-xl font-bold">مراجعة سريعة للمحاضرة السابقة</h2>
                  </div>
                  <div className="p-6 text-slate-900 dark:text-slate-100 leading-relaxed text-lg" dir="rtl">
                    {analysis.previousReview}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{analysis.title || 'شرح المحاضرة'}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-2xl border border-teal-100 dark:border-teal-900/50 flex items-center space-x-3 space-x-reverse">
                  <Activity className="w-6 h-6 text-teal-600" />
                  <p className="text-sm font-medium text-teal-800 dark:text-teal-200">ميزة Investigation Interpreter مفعلة</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 flex items-center space-x-3 space-x-reverse">
                  <Pill className="w-6 h-6 text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">الأسماء التجارية للأدوية مدمجة</p>
                </div>
              </div>

              <div className="space-y-6">
                {(analysis.explanationBlocks || []).map((block, idx) => (
                  <div 
                    key={idx}
                    id={`block-${idx}`}
                    className={cn(
                      "rounded-3xl shadow-sm border p-8 transition-colors duration-300 relative group",
                      getBlockStyles(block.type)
                    )}
                  >
                    <div className="absolute top-0 right-8 -translate-y-1/2 bg-white dark:bg-slate-800 px-4 py-1 rounded-full border shadow-sm text-xs font-bold">
                      {getBlockLabel(block.type)}
                    </div>
                    
                    <button 
                      onClick={() => copyToClipboard(block.content, idx)}
                      className="absolute top-6 left-6 p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                      title="نسخ الخلاصة"
                    >
                      {copiedIndex === idx ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                    </button>

                    <h3 className="text-2xl font-bold mb-4 mt-2" dir="rtl">{block.heading}</h3>
                    <div className="prose prose-lg max-w-none dark:prose-invert" dir="rtl">
                      <Markdown>
                        {block.content}
                      </Markdown>
                    </div>
                  </div>
                ))}
              </div>

              {/* Feedback Mechanism */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 mt-12 mb-8 transition-colors duration-300">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">ما رأيك بهذا الشرح؟</h3>
                {feedbackStatus === 'submitted' ? (
                  <div className="text-center text-emerald-600 dark:text-emerald-400 font-bold p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                    شكرًا لرأيك! سيساعدنا هذا في تحسين جودة الشرح مستقبلاً.
                  </div>
                ) : (
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="flex justify-center space-x-4 space-x-reverse">
                      <button
                        onClick={() => setFeedbackType('up')}
                        className={cn(
                          "flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                          feedbackType === 'up' 
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600" 
                            : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-emerald-200 hover:text-emerald-500"
                        )}
                      >
                        <ThumbsUp className="w-8 h-8" />
                        <span className="font-bold text-sm">ممتاز ويغطي المطلوب</span>
                      </button>
                      <button
                        onClick={() => setFeedbackType('down')}
                        className={cn(
                          "flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                          feedbackType === 'down' 
                            ? "border-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-600" 
                            : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-rose-200 hover:text-rose-500"
                        )}
                      >
                        <ThumbsDown className="w-8 h-8" />
                        <span className="font-bold text-sm">يحتاج إلى تحسين</span>
                      </button>
                    </div>
                    
                    {feedbackType && (
                      <div className="animate-in fade-in slide-in-from-top-2 space-y-3">
                        <textarea
                          placeholder="شاركنا بأي تفاصيل إضافية (اختياري)..."
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          className="w-full h-24 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none text-slate-800 dark:text-slate-200 text-sm resize-none"
                        />
                        <button
                          onClick={submitFeedback}
                          disabled={feedbackStatus === 'submitting'}
                          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                          {feedbackStatus === 'submitting' ? 'جاري الإرسال...' : 'إرسال التقييم'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* End Feedback */}
            </div>
          </div>
        )}

        {activeTab === 'glossary' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">قاموس المصطلحات</h2>
            {(analysis.glossary || []).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(analysis.glossary || []).map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <h4 className="font-bold text-teal-600 dark:text-teal-400 mb-2 font-mono text-left" dir="ltr">{item.term}</h4>
                    <p className="text-slate-700 dark:text-slate-300 text-sm">{item.definition}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">لا توجد مصطلحات صعبة في هذه المحاضرة.</p>
            )}
          </div>
        )}

        {activeTab === 'quiz' && (
          isGeneratingQuiz ? (
            <div className="flex flex-col items-center justify-center space-y-6 py-16 animate-in fade-in duration-500">
               <div className="text-emerald-600 dark:text-emerald-400 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
                 <HelpCircle className="w-12 h-12 animate-spin" />
               </div>
               <p className="font-bold text-xl text-emerald-700 dark:text-emerald-300">جاري تحضير الاسئلة...</p>
               <div className="bg-slate-50 dark:bg-slate-800 px-6 py-3 rounded-full border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm transition-all animate-in fade-in duration-500">
                 <span key={verseIndex} className="animate-in slide-in-from-bottom-2 fade-in block">
                   {adhkarAndVerses[verseIndex]}
                 </span>
               </div>
            </div>
          ) : (
            <QuizView questions={mcqs} />
          )
        )}
      </div>
    </div>
  );
}
