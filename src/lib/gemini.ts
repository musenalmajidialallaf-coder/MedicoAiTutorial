import { UserStats } from "../store/useUserStore";

// Vision and Chat models are now managed on the server side

export interface ExplanationBlock {
  heading: string;
  content: string;
  type: 'academic' | 'clinical' | 'red_flag';
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface MCQ {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface LectureAnalysis {
  title: string;
  previousReview: string;
  explanationBlocks: ExplanationBlock[];
  glossary: GlossaryTerm[];
  summaryForFuture: string;
}

export async function analyzeLecture(base64Data: string, mimeType: string, stats: UserStats): Promise<LectureAnalysis> {
  const lastLecture = stats.pastLectures.length > 0 ? stats.pastLectures[0] : null;
  
  const dialectMap: Record<string, string> = {
    'Iraqi': 'اللهجة العراقية العامية البسيطة',
    'Moslawi': 'اللهجة الموصلية',
    'Egyptian': 'اللهجة المصرية',
    'Maghrebi': 'لهجات المغرب العربي',
    'Syrian': 'اللهجة السورية',
    'Gulf': 'لهجات دول الخليج',
    'Palestinian': 'اللهجة الفلسطينية',
    'Kurdish': 'اللغة الكردية',
    'Fusha': 'اللغة العربية الفصحى'
  };

  const prompt = `أنت "عضيدك الطبي" (Your Medical Buddy) - طالب نابغة وخبير في تبسيط المعقد، وشرحك يُعتبر "المرجع الذهبي" لزملائك. تعمل الآن بمحرك Groq الفائق السرعة.

هذا التحدي: حول ملف المحاضرة الملحق إلى "شرح موسوعي شامل" (Encyclopedic Explanation) بلهجة (${dialectMap[stats.dialect] || 'اللهجة العراقية'}). 

المبادئ الصارمة (Strict Guidelines):
1. **استقصاء المعلومات (Exhaustive Extraction)**: أريدك أن تمر على كل سطر، كل معلومة، وكل نقطة في ملف المحاضرة وتشرحها بالتفصيل الممل.
2. **لغة الصديق البسيط (Simple but Professional)**: اشرح كأنك جالس مع صديقك المفضل، بس أنت "موسوعة متحركة". استخدم الكلمات البسيطة والحكايا والتشبيهات.
3. **التفصيل الممل (The Detail Monster)**: الهدف هو ألا يحتاج الطالب للعودة لملف المحاضرة الأصلي أبداً.
4. **Physiology Base**: قبل الدخول في أي مرض، "يجب" شرح فسيولوجيا العضو المشروح في حالته الطبيعية بفقرات طويلة.

نظام البطاقات:
- 'academic': للفسلجة الكاملة، التشريح الدقيق، والآلية الحيوية.
- 'clinical': للفحص السريري، الأعراض بالتفصيل، التحاليل وقراءتها، والعلاجات.
- 'red_flag': للتحذيرات والمخاطر الطبية.

مراجعة المحاضرة السابقة:
${lastLecture ? `العنوان: ${lastLecture.title}\nالملخص: ${lastLecture.summary}` : 'لا توجد مراجعة.'}

أجب بصيغة JSON حصراً، ويجب أن يحتوي الـ JSON على الخصائص التالية:
- title: عنوان المحاضرة
- previousReview: مراجعة للمحاضرة السابقة (5 أسطر)
- explanationBlocks: قائمة بالعناوين والشرح والنوع
- glossary: قاموس مصطلحات
- summaryForFuture: ملخص للمستقبل (5 أسطر)`;

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, base64Data, mimeType })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "فشل تحليل المحاضرة");
  }

  return response.json();
}

export async function askQuestion(question: string, currentExplanation: string, stats: UserStats): Promise<string> {
  const pastLecturesContext = stats.pastLectures.map(l => `Title: ${l.title}\nSummary: ${l.summary}`).join('\n\n');
  
  const prompt = `أنت "Professor Novix"، خبير التعليم الطبي والمحاكي السريري للأوسكي (OSCE).

عندما يبدأ الطالب بالتحدث معك، تأكد من فهم مراده (هل يطرح سؤالاً عاماً أم يريد بدء محاكاة حالة).
- إذا طلب "محاكاة حالة" أو "AI Patient Simulator": تقمص شخصية مريض (يفضل بلهجة عراقية طبية واقعية). 
- إذا كان سؤالاً طبياً عن المحاضرة: استخدم المصطلحات الطبية الإنجليزية واشرح باللهجة (${stats.dialect || 'العراقية'}).

Current Lecture Explanation:
${currentExplanation}

Past Lectures Summaries:
${pastLecturesContext || 'None'}

Student's Question: ${question}`;

  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "فشل الحصول على إجابة");
    }

    const data = await response.json();
    return data.content || "عذراً، محرك الذكاء واجه مشكلة.";
  } catch (error) {
    console.error(`Ask Question error:`, error);
    return `عذراً، حدث خطأ تقني في الاتصال بالخادم.`;
  }
}

export async function generateQuiz(explanation: string): Promise<MCQ[]> {
  const prompt = `أنت بروفيسور طبي دقيق ومتمرس في وضع أسئلة الزمالات (Board Exams).
إنشاء 10 أسئلة خيارات متعددة (MCQs) بنظام Clinical Case Scenarios بناءً على الشرح الطبي المرفق.

التعليمات للصيغة (JSON):
أجب بصيغة JSON حصراً، وتحتوي على قائمة من الكائنات بخصائص:
- question: (English Case)
- options: (4 options in English)
- correctAnswerIndex: (0-3)
- explanation: (Arabic Detail)

المحتوى الطبي:
${explanation}`;

  try {
    const response = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "فشل إنشاء الاختبار");
    }

    const parsed = await response.json();
    const finalArray = Array.isArray(parsed) ? parsed : (parsed.quizzes || parsed.mcqs || parsed.questions || Object.values(parsed)[0]);
    return finalArray as MCQ[];
  } catch (error) {
    console.error("Quiz Generation error:", error);
    throw new Error("فشل إنشاء الاختبار.");
  }
}
