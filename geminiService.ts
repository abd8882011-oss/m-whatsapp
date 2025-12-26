
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, TransactionType } from "./types";

export const parseFinancialText = async (text: string): Promise<Transaction[]> => {
  // CRITICAL: Create a new GoogleGenAI instance right before making an API call 
  // to ensure it always uses the most up-to-date API key and handles environment timing issues on mobile.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `تحليل النص المالي التالي المستخرج من محادثة واتساب واستخراج الحسابات بوضوح:
      
      النص: "${text}"`,
      config: {
        systemInstruction: `أنت محاسب خبير. مهمتك هي استخراج المعاملات المالية من نصوص واتساب غير المنظمة.
        - حدد العملة (مثل: USD للدوﻻر، TRY لليرة التركية، SYP لليرة السورية).
        - إذا ذكر المستخدم "ليرة" فقط في سياق سوري، فاستخدم SYP. إذا كان في سياق تركي، فاستخدم TRY.
        - حدد المبلغ كرقم.
        - حدد النوع: 
          - INCOMING (وارد/له/أرسل لي/جاني)
          - OUTGOING (صادر/عليه/صرفت/دفعت)
          - UNKNOWN (إذا كان النص مبهماً ولا يوضح ما إذا كان المبلغ له أم عليه).
        - أضف وصفاً مختصراً للمعاملة.
        - إذا ذكر النص "لي" أو "وارد" فهي INCOMING.
        - إذا ذكر النص "علي" أو "صادر" أو "مصاريف" فهي OUTGOING.
        - في حال عدم وضوح الاتجاه، استخدم UNKNOWN ليتمكن المستخدم من تصحيحها يدوياً.
        - ارجع النتيجة كقائمة JSON حصراً.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              currency: { type: Type.STRING, description: "رمز العملة الموحد (USD, TRY, SYP)" },
              amount: { type: Type.NUMBER, description: "القيمة العددية للمبلغ" },
              type: { type: Type.STRING, description: "نوع المعاملة" },
              description: { type: Type.STRING, description: "وصف المعاملة" }
            },
            required: ["currency", "amount", "type", "description"]
          }
        }
      }
    });

    if (!response || !response.text) {
      throw new Error("لم يتم استلام استجابة من الخادم. يرجى التحقق من الاتصال.");
    }

    const parsed = JSON.parse(response.text.trim());
    return parsed.map((item: any, index: number) => ({
      ...item,
      id: `${Date.now()}-${index}`
    }));
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('fetch')) {
      throw new Error("فشل الاتصال بالخادم. يرجى التأكد من توفر الإنترنت ومحاولة الإرسال مجدداً.");
    }
    throw error;
  }
};
