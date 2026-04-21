import { useState } from 'react';
import { PastLecture } from '../store/useUserStore';
import { BookOpen, Clock, ChevronLeft, Search } from 'lucide-react';

interface HistoryViewProps {
  pastLectures: PastLecture[];
  onSelect: (lecture: PastLecture) => void;
}

export function HistoryView({ pastLectures, onSelect }: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLectures = pastLectures.filter(lecture => 
    lecture.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lecture.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-xl text-teal-600 dark:text-teal-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">سجل المحاضرات</h2>
          </div>
          
          {pastLectures.length > 0 && (
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="ابحث في السجل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              />
            </div>
          )}
        </div>

        {pastLectures.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">لم تقم برفع أي محاضرة بعد.</p>
          </div>
        ) : filteredLectures.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">لم يتم العثور على نتائج مطابقة لبحثك.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLectures.map((lecture) => (
              <button
                key={lecture.id}
                onClick={() => onSelect(lecture)}
                className="w-full text-right bg-slate-50 dark:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-900/20 border border-slate-100 dark:border-slate-700 hover:border-teal-200 dark:hover:border-teal-800 p-6 rounded-2xl transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between group"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {lecture.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 leading-relaxed">
                    {lecture.summary}
                  </p>
                </div>
                <div className="mt-4 md:mt-0 md:mr-6 flex items-center justify-between md:flex-col md:items-end space-y-0 md:space-y-2 shrink-0">
                  <div className="flex items-center text-slate-400 text-sm">
                    <Clock className="w-4 h-4 ml-1" />
                    <span dir="ltr">{new Date(lecture.date).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="flex items-center text-teal-600 dark:text-teal-400 font-bold text-sm bg-teal-100 dark:bg-teal-900/30 px-3 py-1 rounded-lg">
                    <span>مراجعة</span>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
