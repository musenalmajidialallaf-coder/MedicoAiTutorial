import Groq from "groq-sdk";
import { GoogleGenAI, Type } from "@google/genai";
import { UserStats } from "../store/useUserStore";

const GROQ_KEY = (
  process.env.GROQ_API_KEY || 
  (import.meta as any).env?.VITE_GROQ_API_KEY || 
  ''
).replace(/['"]/g, '');

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

export const groq = GROQ_KEY ? new Groq({ apiKey: GROQ_KEY, dangerouslyAllowBrowser: true }) : null;
const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

const CHAT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "llama-3.2-90b-vision-preview";

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

  const prompt = `أنت "عضيدك الطبي" (Your Medical Buddy) - طالب نابغة وخبير في تبسيط المعقد، وشرحك يُعتبر "المرجع الذهبي" لزملائك. تعمل الآن بمحرك متطور.

هذا التحدي: حول ملف المحاضرة الملحق إلى "شرح موسوعي شامل" (Encyclopedic Explanation) بلهجة (${dialectMap[stats.dialect] || 'اللهجة العراقية'}). 

المبادئ الصارمة (Strict Guidelines):
1. **استقصاء المعلومات (Exhaustive Extraction)**: أريدك أن تمر على كل سطر، كل معلومة، وكل نقطة في ملف المحاضرة وتشرحها بالتفصيل الممل.
2. **لغة الصديق البسيط (Simple but Professional)**: اشرح كأنك جالس مع صديقك المفضل، بس أنت "موسوعة متحركة". استخدم الكلمات البسيطة والحكايا والتشبيهات.
3. **التفصيل الممل (The Detail Monster)**: الهدف هو ألا يحتاج الطالب للعودة لملف المحاضرة الأصلي أبداً.
4. **Physiology Base**: قبل الدخول في أي مرض، "يجب" شرح فسيولوجيا العضو المشروح في حالته الطبيعية بفقرات طويلة.

نظام البطاقات (Type):
- 'academic': للفسلجة الكاملة، التشريح الدقيق، والآلية الحيوية.
- 'clinical': للفحص السريري، الأعراض بالتفصيل، التحاليل وقراءتها، والعلاجات.
- 'red_flag': للتحذيرات والمخاطر الطبية.

مراجعة المحاضرة السابقة:
${lastLecture ? `العنوان: ${lastLecture.title}\nالملخص: ${lastLecture.summary}` : 'لا توجد مراجعة.'}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType } }
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
                required: ['heading', 'content', 'type']
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
                required: ['term', 'definition']
              }
            },
            summaryForFuture: { type: Type.STRING }
          },
          required: ['title', 'previousReview', 'explanationBlocks', 'glossary', 'summaryForFuture']
        },
        temperature: 0.3
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    throw new Error(`تعذر تحليل المحاضرة: ${error.message}`);
  }
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

  if (!groq) return "عذراً، محرك Groq غير متوفر حالياً.";

  try {
    const response = await groq.chat.completions.create({
      model: CHAT_MODEL,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.choices[0]?.message?.content || "عذراً، محرك Groq واجه مشكلة.";
  } catch (error) {
    console.error(`Ask Question error:`, error);
    return `عذراً، حدث خطأ تقني في الاتصال بمحرك الذكاء.`;
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

  if (!groq) throw new Error("Groq not initialized");

  try {
    const response = await groq.chat.completions.create({
      model: CHAT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    const parsed = JSON.parse(content || "{}");
    const finalArray = Array.isArray(parsed) ? parsed : (parsed.quizzes || parsed.mcqs || parsed.questions || Object.values(parsed)[0]);
    return finalArray as MCQ[];
  } catch (error) {
    console.error("Quiz Generation error:", error);
    throw new Error("فشل إنشاء الاختبار.");
  }
}
