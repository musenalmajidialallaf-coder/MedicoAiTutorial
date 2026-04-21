import { Gift } from 'lucide-react';

interface WelcomeViewProps {
  onStartFree: () => void;
}

export function WelcomeView({ onStartFree }: WelcomeViewProps) {
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in zoom-in duration-500 mt-8">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        
        {/* Greeting Banner */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-8 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold leading-relaxed mb-4">
            السلام عليكم ضلعي 👋
          </h2>
          <p className="text-lg md:text-xl font-medium opacity-90 leading-relaxed max-w-2xl mx-auto">
            الموقع مجاني بالكامل ليكون صدقة جارية لأرواح اموات المسلمين جميعاً
          </p>
        </div>

        {/* Options */}
        <div className="p-8 flex justify-center">
          <div 
            className="w-full max-w-md rounded-2xl border-2 border-teal-200 hover:border-teal-500 bg-teal-50/50 dark:bg-teal-900/20 dark:border-teal-800 cursor-pointer p-8 text-center transition-all transform hover:scale-105" 
            onClick={() => onStartFree()}
          >
            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-800 text-teal-600 dark:text-teal-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Gift className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">ابدأ الآن</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8">رفع غير محدود للمحاضرات مجاناً</p>
            
            <button 
              className="w-full py-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg transition-colors"
            >
              الدخول للتطبيق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
