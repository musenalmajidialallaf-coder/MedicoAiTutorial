import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, Loader2, Cloud } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface UploaderProps {
  onUpload: (file: File) => void;
  isProcessing: boolean;
}

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

const loadingTexts = [
  "جاري رفع الملف...",
  "الذكاء الاصطناعي يقرأ المحاضرة...",
  "دا نحلل المصطلحات الطبية...",
  "دا نجهز الشرح بالعراقي...",
  "لحظات وتكون جاهزة..."
];

export function Uploader({ onUpload, isProcessing }: UploaderProps) {
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [verseIndex, setVerseIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isProcessing) {
      const textInterval = setInterval(() => {
        setLoadingIndex(i => (i + 1) % loadingTexts.length);
        setVerseIndex(i => (i + 1) % adhkarAndVerses.length);
      }, 3000);

      const progressInterval = setInterval(() => {
        setProgress(p => {
          if (p >= 95) return p;
          return p + Math.random() * 5;
        });
      }, 500);

      return () => {
        clearInterval(textInterval);
        clearInterval(progressInterval);
      };
    } else {
      setProgress(0);
      setLoadingIndex(0);
      setVerseIndex(0);
    }
  }, [isProcessing]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB limit
    onDropRejected: (fileRejections) => {
      if (fileRejections[0].errors[0].code === 'file-too-large') {
        alert('حجم الملف كبير جداً. الحد الأقصى هو 50 ميجابايت.');
      } else {
        alert('نوع الملف غير مدعوم أو حدث خطأ آخر.');
      }
    },
    disabled: isProcessing
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative overflow-hidden border-4 border-dashed rounded-[3rem] p-16 md:p-24 text-center cursor-pointer transition-all duration-500",
        isDragActive ? "border-teal-500 bg-teal-50/80 dark:bg-teal-900/30 scale-[1.02]" : "border-slate-300 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/50",
        isProcessing ? "opacity-100 cursor-not-allowed border-teal-500 bg-teal-50 dark:bg-teal-900/20" : "bg-white dark:bg-slate-900"
      )}
    >
      <input {...getInputProps()} />
      
      {isProcessing ? (
        <div className="flex flex-col items-center space-y-8">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 bg-teal-200 dark:bg-teal-800 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.5 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse', ease: "easeInOut" }}
              className="absolute z-20"
            >
              <FileText className="w-12 h-12 text-teal-600 dark:text-teal-400" />
            </motion.div>
            <Cloud className="w-24 h-24 text-slate-300 dark:text-slate-600 relative z-10 opacity-80" />
          </div>
          
          <div className="w-full max-w-md">
            <div className="h-3 bg-teal-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-indigo-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-2xl font-bold text-teal-900 dark:text-teal-100 animate-pulse">
              {loadingTexts[loadingIndex]}
            </p>
            <p className="text-lg font-medium text-emerald-700 dark:text-emerald-400 italic">
              {adhkarAndVerses[verseIndex]}
            </p>
            <p className="text-sm text-teal-600/80 dark:text-teal-400/80 font-medium">
              (الشغلة تحتاج دقيقتين الى ٤ دقائق اذكر الله علما تكمل)
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className={cn(
            "p-6 rounded-full transition-all duration-500",
            isDragActive ? "bg-teal-600 text-white scale-110 shadow-xl shadow-teal-500/30" : "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 group-hover:scale-110"
          )}>
            <UploadCloud className="w-12 h-12" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">
              {isDragActive ? "أفلت الملف هنا..." : "اسحب وأفلت ملف المحاضرة هنا"}
            </p>
            <p className="text-base text-slate-500 dark:text-slate-400">
              أو اضغط لاختيار ملف من جهازك (يدعم PDF و TXT)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
