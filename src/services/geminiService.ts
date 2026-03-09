import { GoogleGenAI, Type, Modality } from "@google/genai";

export type QuestionType = 'multiple-choice' | 'cebraspe';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  question: string;
  options?: string[]; // Only for multiple-choice
  correctAnswer: string; // For cebraspe: 'Certo' or 'Errado'. For multiple-choice: the option text.
  explanation: string;
  deepDive?: string; // Fetched on demand
}

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Chave de API não encontrada. Por favor, selecione uma chave nas configurações.");
  }
  return new GoogleGenAI({ apiKey });
};

export type QuizFormat = 'multiple-choice' | 'cebraspe' | 'both';

export async function generateQuiz(
  content: string | { data: string; mimeType: string } | string[], 
  questionCount: number = 20,
  format: QuizFormat = 'both'
): Promise<QuizQuestion[]> {
  const ai = getAI();
  const formatInstruction = format === 'both' 
    ? 'Alterne entre questões de Múltipla Escolha (4 opções) e formato Cebraspe (Certo/Errado).'
    : format === 'multiple-choice'
      ? 'Elabore apenas questões de Múltipla Escolha (4 opções).'
      : 'Elabore apenas questões no formato Cebraspe (Certo/Errado).';

  const prompt = `
    Você é um especialista em educação e bancas de concurso (como Cebraspe).
    Com base no conteúdo fornecido abaixo (texto, arquivo ou links), elabore exatamente ${questionCount} questões de quiz.
    
    REGRAS:
    1. ${formatInstruction}
    2. Varie a dificuldade entre fácil, médio e difícil.
    3. Para cada questão, forneça:
       - O enunciado da questão.
       - A resposta correta.
       - Uma explicação curta e direta.
    4. O formato de saída DEVE ser um JSON válido seguindo o schema fornecido.
    5. Idioma: Português (Brasil).
  `;

  let contentParts: any[] = [{ text: prompt }];
  let tools: any[] = [];

  if (Array.isArray(content)) {
    // It's a list of URLs
    contentParts.push({ text: `Analise o conteúdo destes links para gerar as questões:\n${content.join('\n')}` });
    tools.push({ urlContext: {} });
  } else if (typeof content === 'string') {
    contentParts.push({ text: `CONTEÚDO:\n${content}` });
  } else {
    contentParts.push({ inlineData: { data: content.data, mimeType: content.mimeType } });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts: contentParts },
    config: {
      tools: tools.length > 0 ? tools : undefined,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['multiple-choice', 'cebraspe'] },
            difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Obrigatório para multiple-choice. Para cebraspe, deixe vazio ou omita."
            },
            correctAnswer: { type: Type.STRING, description: "Para cebraspe use 'Certo' ou 'Errado'. Para múltipla escolha, use o texto exato da opção correta." },
            explanation: { type: Type.STRING }
          },
          required: ["id", "type", "difficulty", "question", "correctAnswer", "explanation"]
        }
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Nenhuma resposta do modelo");
    return JSON.parse(text);
  } catch (error) {
    console.error("Erro ao gerar quiz:", error);
    throw new Error("Falha ao processar as questões do quiz. Tente novamente.");
  }
}

export async function generateDeepDive(
  content: string | { data: string; mimeType: string } | string[],
  question: QuizQuestion
): Promise<string> {
  const ai = getAI();
  const prompt = `
    Você é um professor especialista. 
    Com base no conteúdo fornecido (texto, arquivo ou links), elabore um "Deep Dive" (aprofundamento) detalhado para a seguinte questão de quiz.
    
    QUESTÃO: ${question.question}
    RESPOSTA CORRETA: ${question.correctAnswer}
    EXPLICAÇÃO CURTA: ${question.explanation}
    
    REGRAS PARA O DEEP DIVE:
    1. Forneça uma explicação pedagógica profunda e detalhada.
    2. Use Markdown para formatar o texto (negritos, listas, etc).
    3. Foque em ajudar o aluno a entender o conceito por trás da questão, não apenas a resposta.
    4. Idioma: Português (Brasil).
    5. Seja encorajador e técnico ao mesmo tempo.
  `;

  let contentParts: any[] = [{ text: prompt }];
  let tools: any[] = [];

  if (Array.isArray(content)) {
    contentParts.push({ text: `Links de referência:\n${content.join('\n')}` });
    tools.push({ urlContext: {} });
  } else if (typeof content === 'string') {
    contentParts.push({ text: `CONTEÚDO:\n${content}` });
  } else {
    contentParts.push({ inlineData: { data: content.data, mimeType: content.mimeType } });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: contentParts },
    config: {
      tools: tools.length > 0 ? tools : undefined
    }
  });

  return response.text || "Não foi possível gerar o aprofundamento no momento.";
}

export interface AudioResponse {
  data: string;
  mimeType: string;
}

export async function generateSpeech(text: string): Promise<AudioResponse> {
  const ai = getAI();
  // Clean text from markdown and extra spaces
  let cleanText = text.replace(/[#*`_~\[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Truncate if too long to avoid model errors (limit to ~600 chars for maximum speed)
  if (cleanText.length > 600) {
    cleanText = cleanText.substring(0, 600);
  }

  if (!cleanText) throw new Error("Texto vazio para áudio");

  // Use the most minimal prompt to avoid model "thinking" or reasoning
  const prompt = `Say: ${cleanText}`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
      temperature: 0, // Absolute minimum temperature for fastest response
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part?.inlineData) {
    return {
      data: part.inlineData.data,
      mimeType: part.inlineData.mimeType
    };
  }

  if (part?.text) {
    console.error("Model returned text instead of audio:", part.text);
  }
  
  throw new Error("O modelo não retornou áudio. Tente um texto mais curto.");
}
