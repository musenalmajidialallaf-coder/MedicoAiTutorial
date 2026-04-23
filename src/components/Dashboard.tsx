import { useEffect, useState } from 'react';
import { Brain, Target, TrendingUp, Globe, Trophy, History, Cpu, Key, Info, CheckCircle, ExternalLink, AlertTriangle } from "lucide-react";
import { UserStats, Dialect } from "../store/useUserStore";
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export function Dashboard({ stats, onDialectChange, onLectureSelect, onApiKeySave }: { 
  stats: UserStats, 
  onDialectChange: (d: Dialect) => void, 
  onLectureSelect?: (l: any) => void,
  onApiKeySave?: (key: string) => void
}) {
  const [realLeaderboard, setRealLeaderboard] = useState<any[]>([]);
  const [apiKey, setApiKey] = useState(stats.geminiApiKey || '');
  const [showKeyInfo, setShowKeyInfo] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, 'public_profiles'), limit(3));
        const snap = await getDocs(q);
        const top: any[] = [];
        snap.forEach(doc => top.push(doc.data()));
        setRealLeaderboard(top);
      } catch (e) {
        console.error("Error fetching leaderboard", e);
      }
    };
    fetchLeaderboard();
  }, []);

  const dialects: { id: Dialect; label: string }[] = [
    { id: 'Iraqi', label: 'العراقية' },
    { id: 'Moslawi', label: 'الموصلية' },
    { id: 'Egyptian', label: 'المصرية' },
    { id: 'Maghrebi', label: 'المغرب العربي' },
    { id: 'Syrian', label: 'السورية' },
    { id: 'Gulf', label: 'الخليجية' },
    { id: 'Palestinian', label: 'الفلسطينية' },
    { id: 'Kurdish', label: 'الكردية' },
    { id: 'Fusha', label: 'الفصحى' },
    { id: 'English', label: 'English' },
  ];

  const pastLectures = Array.isArray(stats.pastLectures) ? stats.pastLectures : [];

  const handleSaveKey = () => {
    if (onApiKeySave) {
      onApiKeySave(apiKey);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  return (
    <div className="space-y-6 mb-8">
      {/* API Key Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">مفتاح الذكاء الخاص بك (Gemini API)</h3>
          </div>
          <button 
            onClick={() => setShowKeyInfo(!showKeyInfo)}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline"
          >
            <Info className="w-3 h-3" />
            كيف أحصل على الكود؟
          </button>
        </div>

        {showKeyInfo && (
          <div className="mb-4 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 text-sm animate-in fade-in slide-in-from-top-2">
            <h4 className="font-bold text-indigo-800 dark:text-indigo-200 mb-2">خطوات الحصول على الكود مجاناً:</h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300">
              <li>افتح موقع <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline inline-flex items-center gap-1">Google AI Studio <ExternalLink className="w-3 h-3"/></a></li>
              <li>سجل دخولك بحساب جوجل العادي</li>
              <li>اضغط على Get API KEY</li>
              <li>اضغط على زر <span className="font-bold">"Create API key"</span></li>
              <li>انسخ الكود الطويل الناتج والصقه في الحقل أدناه</li>
            </ol>
            <p className="mt-3 text-[10px] text-slate-500">ملاحظة: هذا الكود ملك لك ولا يتم مشاركته مع أحد. إذا توقف التطبيق عن العمل، قد تحتاج لتكرار العملية للحصول على كود جديد.</p>
          </div>
        )}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="الصق مفتاح الـ API هنا (مثال: AIzaSy...)"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono transition-colors"
            />
            {stats.geminiApiKey && stats.geminiApiKey.length > 10 && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500">
                <CheckCircle className="w-4 h-4" />
              </div>
            )}
          </div>
          <button 
            onClick={handleSaveKey}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
              isSaved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isSaved ? 'تم الحفظ!' : 'حفظ الكود'}
          </button>
        </div>
        
        {!stats.geminiApiKey && (
          <div className="mt-3 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-medium">
            <AlertTriangle className="w-4 h-4" />
            <span>يجب إضافة كود الـ API لكي تتمكن من رفع المحاضرات</span>
          </div>
        )}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border-r-4 border-amber-500 p-4 rounded-l-xl">
        <div className="flex items-start space-x-3 space-x-reverse">
          <div className="shrink-0">
            <svg className="h-5 w-5 text-amber-600 dark:text-amber-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200 leading-relaxed">
            <strong className="font-bold">تنويه هام:</strong> يقدم هذا الموقع أدوات مساعدة ونماذج محاكاة (OSCE) تهدف إلى تبسيط وتوضيح المحاضرات الطبية. هو <span className="underline">ليس بديلاً</span> عن الحضور الأكاديمي، أو الاستذكار من المصادر الطبية المعتمدة والمحاضرات الرسمية للكلية.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Dialect Selector */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
          <div className="flex items-center space-x-3 space-x-reverse mb-3">
            <Globe className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 italic">لهجة الشرح</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {dialects.map((d) => (
              <button
                key={d.id}
                onClick={() => onDialectChange(d.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  stats.dialect === d.id
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center space-x-4 space-x-reverse transition-colors duration-300">
          <div className="p-3 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-xl">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">المستوى الحالي</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {stats.level === 'Beginner' ? 'مبتدئ' : stats.level === 'Intermediate' ? 'متوسط' : 'متقدم'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center space-x-4 space-x-reverse transition-colors duration-300">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">عدد المحاضرات المرفوعة</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.pastLectures?.length || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Leaderboard Top 3 */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">المتصدرين (Top 3)</h3>
          </div>
          <div className="space-y-3">
            {realLeaderboard.length > 0 ? (
              realLeaderboard.map((student, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{student.displayName || 'طالب متميز'}</span>
                  </div>
                  <div className="text-left flex flex-col">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {student.level === 'Advanced' ? 'متقدم' : student.level === 'Intermediate' ? 'متوسط' : 'مبتدئ'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500 text-center py-4">جاري التحميل...</div>
            )}
          </div>
        </div>

        {/* Past Lectures History */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <History className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">سجل المحاضرات</h3>
          </div>
          <div className="space-y-3 max-h-[180px] overflow-y-auto custom-scrollbar">
            {pastLectures.length > 0 ? (
              pastLectures.map((lecture) => (
                <div 
                  key={lecture.id} 
                  className="p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  onClick={() => onLectureSelect && onLectureSelect(lecture)}
                >
                  <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">{lecture.title}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(lecture.date).toLocaleDateString('ar-EG')}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 text-sm py-4">لا توجد محاضرات في السجل</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
