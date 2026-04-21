import { GoogleGenAI, Type } from "@google/genai";
import { UserStats, PastLecture } from "../store/useUserStore";

// Reverting to the correct API pattern for @google/genai version 1.29.0
// Supporting multiple ways the key could be injected during build
const GEMINI_KEY = (
  process.env.GEMINI_API_KEY || 
  (import.meta as any).env?.VITE_GEMINI_API_KEY || 
  ''
).replace(/['"]/g, '');

if (!GEMINI_KEY || GEMINI_KEY === 'undefined') {
  console.error("CRITICAL: GEMINI_API_KEY is missing or invalid. Deployment requires this key in GitHub Secrets.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

const STABLE_MODEL = "gemini-3.1-pro-preview";

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
  // Safety guard - increasing limit to 10MB for more complex PDFs/Lectures
  const truncatedData = base64Data.length > 10000000 ? base64Data.slice(0, 10000000) : base64Data;
  
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

  const prompt = `أنت "عضيدك الطبي" (Your Medical Buddy) - طالب نابغة وخبير في تبسيط المعقد، وشرحك يُعتبر "المرجع الذهبي" لزملائك.

هذا التحدي: حول ملف المحاضرة الملحق إلى "شرح موسوعي شامل" (Encyclopedic Explanation) بلهجة (${dialectMap[stats.dialect] || 'اللهجة العراقية'}). 

المبادئ الصارمة (Strict Guidelines - إياك والتهاون):
1. **استقصاء المعلومات (Exhaustive Extraction)**: ممنوع، بل محرم عليك الاختصار. أريدك أن تمر على كل سطر، كل معلومة، وكل نقطة في ملف المحاضرة وتشرحها. إذا كان هناك جدول، اشرحه بالتفصيل. إذا كانت هناك قائمة، اشرح كل بند فيها بفقرة كاملة.
2. **لغة الصديق البسيط (Simple but Professional)**: اشرح كأنك جالس مع صديقك المفضل، بس أنت "موسوعة متحركة". استخدم الكلمات البسيطة والحكايا والتشبيهات، لكن حافظ على الدقة العلمية والمصطلحات الإنجليزية الأساسية.
3. **التفصيل الممل (The Detail Monster)**: الهدف هو ألا يحتاج الطالب للعودة لملف المحاضرة الأصلي أبداً. أريد الشرح يكون "أدسم" وأكثر تفصيلاً من المحاضرة نفسها.
4. **Physiology Base**: قبل الدخول في أي مرض، "يجب" شرح فسيولوجيا العضو المشروح في حالته الطبيعية بفقرات طويلة (Normal State) لتوضيح الفرق.
5. **العمق الروحاني**: اذكر آيات قرآنية مناسبة ترتبط بدقة الخلق لزيادة الطمأنينة.
6. **لا تنهي الشرح بسرعة**: أريد 'explanationBlocks' عديدة وحافلة بالمعلومات (Heavy Content Blocks). كل بلوك يجب أن يكون وجبة دسمة من العلم.

نظام البطاقات (استخدمها بكثافة):
- 'academic': للفسلجة الكاملة، التشريح الدقيق، والآلية الحيوية.
- 'clinical': للفحص السريري، الأعراض بالتفصيل، التحاليل وقراءتها، والعلاجات (Brand names & Generic names).
- 'red_flag': للتحذيرات والمخاطر الطبية.

مراجعة المحاضرة السابقة (للسياق):
${lastLecture ? `العنوان: ${lastLecture.title}\nالملخص: ${lastLecture.summary}` : 'لا توجد مراجعة.'}

أجب بصيغة JSON حصراً. تأكد أن استجابتك "عملاقة" من حيث المعلومات وليست مجرد كلمات عامة.`;

  const response = await ai.models.generateContent({
    model: STABLE_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { data: truncatedData, mimeType } },
          { text: prompt }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          previousReview: { type: Type.STRING },
          explanationBlocks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                heading: { type: Type.STRING },
                content: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['academic', 'clinical', 'red_flag'] }
              },
              required: ["heading", "content", "type"]
            }
          },
          glossary: { 
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                definition: { type: Type.STRING }
              },
              required: ["term", "definition"]
            }
          },
          summaryForFuture: { type: Type.STRING }
        },
        required: ["title", "previousReview", "explanationBlocks", "glossary", "summaryForFuture"]
      }
    }
  });

  if (!response.text) throw new Error("Failed to generate analysis");
  return JSON.parse(response.text);
}

export async function askQuestion(question: string, currentExplanation: string, stats: UserStats): Promise<string> {
  const pastLecturesContext = stats.pastLectures.map(l => `Title: ${l.title}\nSummary: ${l.summary}`).join('\n\n');
  
  const prompt = `أنت "Professor Novix"، خبير التعليم الطبي والمحاكي السريري للأوسكي (OSCE).

عندما يبدأ الطالب بالتحدث معك، تأكد من فهم مراده (هل يطرح سؤالاً عاماً أم يريد بدء محاكاة حالة).
- إذا طلب "محاكاة حالة" أو "AI Patient Simulator": تقمص شخصية مريض (يفضل بلهجة عراقية طبية واقعية، مثلاً: "دكتور صدري يوجعني"). 
  * لا تعطِ التشخيص أو كل المعلومات مرة واحدة. انتظر الطالب ليسألك وجاوب كعامي يعاني من أعراض. 
  * إذا سألك الطالب سؤالاً طبياً احترافياً، أجب كونه مريضاً لا يفهم المصطلحات.
  * التقييم النهائي: بعد انتهاء المقابلة أو تشخيص الطالب للحالة، اطبع Checklist كامل للتقييم، مع النقاط التي نسيها (الـ Smoking history وغيرها) وتقييم من 10.
- إذا كان سؤالاً طبياً عن المحاضرة: استخدم المصطلحات الطبية الإنجليزية وركز على بروتوكولات المستشفيات العراقية، وكن بروفيسوراً حازماً تعليمياً ومشجعاً في نفس الوقت، واشرح باللهجة (${stats.dialect || 'العراقية'}).

Current Lecture Explanation:
${currentExplanation}

Past Lectures Summaries:
${pastLecturesContext || 'None'}

Student's Question: ${question}

Instructions:
1. Respond purely in character as Professor Novix (or the patient if in simulation).
2. Answer based on the current lecture or simulation context.
3. Keep the interaction immersive.`;

  const response = await ai.models.generateContent({
    model: STABLE_MODEL,
    contents: prompt,
  });

  return response.text || "عذراً، ما كدرت اجاوب على هذا السؤال حالياً.";
}

export async function generateQuiz(explanation: string): Promise<MCQ[]> {
  const prompt = `أنت بروفيسور طبي دقيق ومتمرس في وضع أسئلة الزمالات (Board Exams).
مهمتك: إنشاء 10 أسئلة خيارات متعددة (MCQs) بنظام (كيس سيناريو - Clinical Case Scenarios) بناءً على الشرح الطبي المرفق.

مستوى الصعوبة المطلوب: متعدد الصعوبة، يبدأ من الصعب إلى شديد الصعوبة (Hard to Extremely Hard).
- يجب أن يكون العدد بالضبط 10 أسئلة.
- تجنب الأسئلة المباشرة تماماً (مثل: ما هو سبب كذا...).
- استخدم سيناريوهات سريرية معقدة تتطلب التفكير، دمج المعلومات، والتحليل السريري للوصول للتشخيص أو الخطوة التالية الأنسب (Next Best Step).
- يجب أن تكون الحلول الأخرى (Distractors) منطقية جداً ومربكة للطالب غير المتمكن.

التعليمات للغات:
1. السؤال (Clinical Case) والخيارات (Options) يجب أن تكون باللغة الإنجليزية حصراً.
2. الشرح (Explanation) والتوضيح يجب أن يكون باللغة العربية حصراً.

الشرح أو المحتوى الطبي:
${explanation}

التعليمات للصيغة (JSON):
- صغ السؤال (question) كحالة سريرية (Clinical Case). -> ENGLISH ONLY
- لكل سؤال أضف 4 خيارات (options). -> ENGLISH ONLY
- حدد الـ correctAnswerIndex (من 0 إلى 3).
- أضف explanation (شرح مفصل جداً باللغة العربية يشرح لماذا الجواب الصحيح هو الأصح، ولماذا تعتبر الخيارات الأخرى خاطئة في سياق هذه الحالة السريرية). -> ARABIC ONLY`;

  const response = await ai.models.generateContent({
    model: STABLE_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctAnswerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswerIndex", "explanation"]
        }
      }
    }
  });

  if (!response.text) throw new Error("Failed to generate quiz");
  return JSON.parse(response.text) as MCQ[];
}
