import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, LearningPath } from "../types";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is missing. AI features will not function.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });

export interface Recommendation {
  title: string;
  url: string;
  type: 'video' | 'article' | 'practice' | 'book';
}

export const generateLearningPath = async (profile: UserProfile, goalOverride?: string): Promise<LearningPath> => {
  const goal = goalOverride || (profile as any).goal; // Fallback for old data or direct passing
  const prompt = `Generate a COMPREHENSIVE and detailed learning path for a student with the following profile:
  Goal: ${goal}
  Current Level: ${profile.skillLevel}
  Available Time: ${profile.timePerDay} hours per day
  ${profile.deadline ? `Target Deadline: ${profile.deadline}` : ""}

  STRATEGIC REQUIREMENTS:
  1. For complex or "big" goals, provide a very long and detailed roadmap (8-16 modules).
  2. Each module should have 4-7 specific tasks.
  3. recommendations MUST include:
     - Real YouTube video links (educational channels like FreeCodeCamp, Traversy Media, etc.).
     - Technical articles or documentation.
     - Specific BOOK references (titles and links) for deep theory.
     - Practical projects or exercises.

  The output MUST be a JSON object matching this structure:
  {
    "goal": "...",
    "modules": [
      {
        "id": "module-1",
        "title": "...",
        "description": "...",
        "durationWeeks": 2,
        "tasks": [
          { "id": "t1", "title": "...", "description": "...", "durationHours": 2 }
        ],
        "recommendations": [
          { "title": "...", "url": "...", "type": "video" },
          { "title": "...", "url": "...", "type": "book" },
          { "title": "...", "url": "...", "type": "article" }
        ]
      }
    ]
  }`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          goal: { type: Type.STRING },
          modules: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                durationWeeks: { type: Type.NUMBER },
                tasks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      durationHours: { type: Type.NUMBER }
                    },
                    required: ["id", "title", "description", "durationHours"]
                  }
                },
                recommendations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      url: { type: Type.STRING },
                      type: { type: Type.STRING, enum: ["video", "article", "practice", "book"] }
                    },
                    required: ["title", "url", "type"]
                  }
                }
              },
              required: ["id", "title", "description", "durationWeeks", "tasks", "recommendations"]
            }
          }
        },
        required: ["goal", "modules"]
      }
    }
  });

  const path = JSON.parse(response.text) as LearningPath;
  return { ...path, userId: profile.userId, createdAt: new Date().toISOString() };
};

export const getMentorResponse = async (query: string, context: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an expert mentor for a student following this learning path: ${context}.
    Answer the student's question: ${query}`,
    config: {
      systemInstruction: "Be encouraging, explain complex concepts simply with examples, and suggest practice tasks if relevant."
    }
  });
  return response.text;
};

export const generateQuiz = async (topic: string, level: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a 5-question multiple choice quiz for the topic: ${topic} at ${level} level. 
    Return as JSON: { "questions": [{ "question": "...", "options": ["...", "..."], "correctIndex": 0 }] }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.NUMBER }
              },
              required: ["question", "options", "correctIndex"]
            }
          }
        },
        required: ["questions"]
      }
    }
  });
  return JSON.parse(response.text);
};

export const adaptPath = async (currentPath: LearningPath, struggleArea: string): Promise<LearningPath> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `The student is struggling with: ${struggleArea}. 
    Modify the following learning path to include more remedial tasks and extra practice for this area. 
    Slow down the pace if necessary.
    Path: ${JSON.stringify(currentPath)}`,
    config: {
      responseMimeType: "application/json"
    }
  });
  return JSON.parse(response.text) as LearningPath;
};
