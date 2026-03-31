import { GoogleGenAI, Type, Modality, ThinkingLevel } from "@google/genai";

export type QuestionType = 'multiple-choice' | 'cebraspe';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  subject: string;
  question: string;
  options?: string[]; // Only for multiple-choice
  correctAnswer: string; // For cebraspe: 'Certo' or 'Errado'. For multiple-choice: the option text.
  explanation: string;
  deepDive?: string; // Fetched on demand
  studyLinks?: { title: string; url: string }[];
}

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || localStorage.getItem('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error("Chave de API não encontrada. Por favor, selecione uma chave nas configurações ou insira uma manualmente.");
  }
  return new GoogleGenAI({ apiKey });
};

export type QuizFormat = 'multiple-choice' | 'cebraspe' | 'both';

export type ContentItem = string | { data: string; mimeType: string };

export async function generateQuiz(
  content: ContentItem | ContentItem[], 
  questionCount: number = 20,
  format: QuizFormat = 'both',
  examBoard?: string,
  isBancaMindset: boolean = false,
  availableSubjects: string[] = []
): Promise<QuizQuestion[]> {
  // If count is large, split into parallel batches for speed and reliability
  if (questionCount > 25) {
    const batchSize = 25;
    const numBatches = Math.ceil(questionCount / batchSize);
    const batchPromises = [];
    
    for (let i = 0; i < numBatches; i++) {
      const currentBatchSize = Math.min(batchSize, questionCount - i * batchSize);
      batchPromises.push(_generateQuizBatch(content, currentBatchSize, format, examBoard, isBancaMindset, availableSubjects));
    }
    
    const results = await Promise.all(batchPromises);
    return results.flat();
  }

  return _generateQuizBatch(content, questionCount, format, examBoard, isBancaMindset, availableSubjects);
}

async function _generateQuizBatch(
  content: ContentItem | ContentItem[], 
  questionCount: number,
  format: QuizFormat,
  examBoard?: string,
  isBancaMindset: boolean = false,
  availableSubjects: string[] = []
): Promise<QuizQuestion[]> {
  const ai = getAI();
  const formatInstruction = format === 'both' 
    ? 'Alterne entre questões de Múltipla Escolha (4 opções) e formato Cebraspe (Certo/Errado).'
    : format === 'multiple-choice'
      ? 'Elabore apenas questões de Múltipla Escolha (4 opções).'
      : 'Elabore apenas questões no formato Cebraspe (Certo/Errado).';

  const boardInstruction = examBoard && examBoard !== 'Geral'
    ? `SIMULE O ESTILO DA BANCA: ${examBoard}. Use a linguagem técnica, o nível de cobrança e as "pegadinhas" típicas desta banca.`
    : 'Use um estilo geral de concursos públicos de alto nível.';

  const mindsetInstruction = isBancaMindset 
    ? `MODO PRÓPRIA BANCA ATIVADO: Pense como o elaborador da prova. Crie questões que não apenas testem o conhecimento, mas que busquem identificar se o candidato realmente domina as nuances, exceções e interpretações complexas do material. Seja rigoroso, use enunciados que exijam atenção máxima e elabore alternativas que pareçam corretas mas tenham detalhes sutis que as tornem incorretas.`
    : '';

  const subjectsInstruction = availableSubjects.length > 0
    ? `CATEGORIZAÇÃO: Para cada questão, identifique a qual matéria ela pertence. Use preferencialmente uma destas: ${availableSubjects.join(', ')}. Se a questão não se encaixar em nenhuma destas, identifique a matéria correta (ex: se for sobre previdência, use 'Seguridade Social').`
    : 'CATEGORIZAÇÃO: Identifique a matéria de cada questão (ex: Português, Direito Constitucional, etc).';

  const systemInstruction = `
    Você é um especialista em educação e bancas de concurso.
    ${boardInstruction}
    ${mindsetInstruction}
    ${subjectsInstruction}
    Com base no conteúdo fornecido (texto, materiais ou links), elabore exatamente ${questionCount} questões de quiz.
    
    REGRAS:
    1. ${formatInstruction}
    2. Varie a dificuldade entre fácil, médio e difícil.
    3. Para cada questão, forneça:
       - A matéria (subject) da questão.
       - O enunciado da questão.
       - A resposta correta.
       - Uma explicação curta e direta.
       - 2 a 3 links de materiais de estudo relacionados (pode ser links para Wikipedia, YouTube, ou sites educacionais confiáveis).
    4. O formato de saída DEVE ser um JSON válido seguindo o schema fornecido.
    5. Idioma: Português (Brasil).
  `;

  let contentParts: any[] = [];
  let tools: any[] = [];

  const items = Array.isArray(content) ? content : [content];

  for (const item of items) {
    if (typeof item === 'string') {
      if (item.startsWith('http')) {
        contentParts.push({ text: `Analise o conteúdo deste link: ${item}` });
        if (!tools.some(t => t.urlContext)) tools.push({ urlContext: {} });
      } else {
        contentParts.push({ text: `CONTEÚDO:\n${item}` });
      }
    } else if (item.data && item.mimeType) {
      contentParts.push({ inlineData: { data: item.data, mimeType: item.mimeType } });
    }
  }

  // Add a final part to request the specific count in this batch
  contentParts.push({ text: `Gere exatamente ${questionCount} questões agora.` });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: contentParts },
    config: {
      systemInstruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
            subject: { type: Type.STRING, description: "A matéria específica da questão (ex: Português, Direito Constitucional)." },
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Obrigatório para multiple-choice. Para cebraspe, deixe vazio ou omita."
            },
            correctAnswer: { type: Type.STRING, description: "Para cebraspe use 'Certo' or 'Errado'. Para múltipla escolha, use o texto exato da opção correta." },
            explanation: { type: Type.STRING },
            studyLinks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING }
                },
                required: ["title", "url"]
              }
            }
          },
          required: ["id", "type", "difficulty", "subject", "question", "correctAnswer", "explanation"]
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
  content: ContentItem | ContentItem[],
  question: QuizQuestion
): Promise<string> {
  const ai = getAI();
  const prompt = `
    Você é um professor especialista. 
    Com base no conteúdo fornecido (texto, materiais ou links), elabore um "Deep Dive" (aprofundamento) detalhado para a seguinte questão de quiz.
    
    QUESTÃO: ${question.question}
    RESPOSTA CORRETA: ${question.correctAnswer}
    EXPLICAÇÃO CURTA: ${question.explanation}
    
    REGRAS PARA O DEEP DIVE:
    1. Forneça uma explicação pedagógica profunda e detalhada.
    2. Use Markdown para formatar o texto (negritos, listas, etc).
    3. Foque em ajudar o aluno a entender o conceito por trás da questão, não apenas a resposta.
    4. INCLUA OBRIGATORIAMENTE uma seção chamada "Mnemônico de Ouro" formatada como uma TABELA Markdown (com bordas e colunas claras). A tabela deve ter colunas como "Conceito", "Gatilho de Memória" e "Aplicação Prática".
    5. INCLUA uma seção chamada "Links de Estudo Recomendados" com 3-5 links relevantes.
    6. Idioma: Português (Brasil).
    7. Seja encorajador e técnico ao mesmo tempo.
  `;

  let contentParts: any[] = [{ text: prompt }];
  let tools: any[] = [];

  const items = Array.isArray(content) ? content : [content];

  for (const item of items) {
    if (typeof item === 'string') {
      if (item.startsWith('http')) {
        contentParts.push({ text: `Link de referência: ${item}` });
        if (!tools.some(t => t.urlContext)) tools.push({ urlContext: {} });
      } else {
        contentParts.push({ text: `CONTEÚDO:\n${item}` });
      }
    } else if (item.data && item.mimeType) {
      contentParts.push({ inlineData: { data: item.data, mimeType: item.mimeType } });
    }
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

export async function chatWithProfessor(
  question: QuizQuestion,
  history: { role: 'user' | 'model', text: string }[],
  userMessage: string
): Promise<string> {
  const ai = getAI();
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `
        Você é o "Professor AI Expert". Seu objetivo é ajudar o aluno a entender profundamente o conteúdo.
        Você está discutindo esta questão específica:
        QUESTÃO: ${question.question}
        RESPOSTA CORRETA: ${question.correctAnswer}
        EXPLICAÇÃO: ${question.explanation}
        
        Responda de forma clara, pedagógica e direta. Use Markdown para formatar suas respostas.
        Se o aluno perguntar algo fora do contexto da questão ou do material de estudo, tente gentilmente trazê-lo de volta ao foco.
      `,
    },
    history: history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }))
  });

  const response = await chat.sendMessage({ message: userMessage });
  return response.text || "Desculpe, não consegui processar sua pergunta agora.";
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

export async function transcribeAudio(
  audioData: string,
  mimeType: string
): Promise<string> {
  const ai = getAI();
  const systemInstruction = `
    Você é um especialista em transcrição de áudio de alta fidelidade.
    Sua tarefa é transcrever o áudio fornecido para texto de forma CONVERSACIONAL, REAL e LEGÍVEL.
    
    REGRAS CRÍTICAS:
    1. IGNORE COMPLETAMENTE qualquer ruído de fundo, gagueiras, hesitações ou preenchimentos irrelevantes (como "hmmm", "ahhh", "tipo", "né").
    2. O texto deve ser LIMPO: remova qualquer caractere especial, técnico, tags de tempo (timestamps), ou marcações de locutor (como "Speaker 1:").
    3. NÃO use Markdown (negrito, itálico, listas, etc.). O resultado deve ser apenas texto puro (plain text).
    4. Formate o texto em parágrafos fluidos e naturais, como se fosse um roteiro de fala perfeitamente limpo.
    5. Ignore qualquer caractere que não seja essencial para a compreensão da fala (como símbolos, asteriscos, hashtags).
    6. Idioma: Português (Brasil).
    
    O objetivo final é um texto que pareça uma fala real, fluida e extremamente fácil de ler.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { data: audioData, mimeType: mimeType } },
        { text: "Transcreva este áudio seguindo rigorosamente as instruções do sistema. Remova todo e qualquer caractere especial ou formatação técnica." }
      ]
    },
    config: {
      systemInstruction,
      temperature: 0.1,
    }
  });

  return response.text || "Não foi possível transcrever o áudio.";
}

export async function convertTextToConversationalAudio(
  text: string
): Promise<AudioResponse> {
  const ai = getAI();
  
  // First, use Gemini to "conversationalize" the text if it's too formal or has artifacts
  const cleanPrompt = `
    Reescreva o seguinte texto para que ele pareça uma fala natural, real e fluida em português do Brasil.
    Remova qualquer caractere especial, técnico ou formatação.
    O texto deve ser otimizado para ser lido em voz alta de forma clara e agradável.
    
    TEXTO:
    ${text}
  `;

  const cleanResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ text: cleanPrompt }],
    config: {
      temperature: 0.3,
    }
  });

  const conversationalText = cleanResponse.text || text;
  
  // Now generate the speech
  return generateSpeech(conversationalText);
}
