import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

app.post('/api/mentor/chat', async (req, res) => {
  try {
    const { messages = [], mode = 'doubt', document } = req.body ?? {};
    const ai = getAiClient();

    const modeDirectives: Record<string, string> = {
      doubt: 'Provide clear, step-by-step academic doubt resolution with concrete examples.',
      explain: 'Explain the concept from first principles using structured intuition and formal definitions.',
      weak_topics: 'Diagnose conceptual gaps, pinpoint common pitfalls, and give targeted practice drills.',
      pdf_qa: 'Answer strictly grounded in the attached study document, citing section concepts accurately.',
    };

    const systemInstruction = [
      'You are Nova, the AI Academic Mentor for CAMPUSFIX AI.',
      'Be encouraging, precise, scholarly, and concise. Avoid filler.',
      modeDirectives[mode] || modeDirectives.doubt,
      'Always respond with valid JSON matching the requested schema.',
    ].join(' ');

    const transcript = (Array.isArray(messages) ? messages : [])
      .slice(-10)
      .map((m: { role?: string; text?: string }) => `${m.role === 'user' ? 'Student' : 'Nova'}: ${String(m.text || '')}`)
      .join('\n\n');

    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    if (document?.base64Data && document?.mimeType) {
      parts.push({
        inlineData: {
          mimeType: String(document.mimeType),
          data: String(document.base64Data),
        },
      });
    } else if (document?.textContent) {
      parts.push({
        text: `Attached Document (${String(document.name || 'Study Material')}):\n${String(document.textContent).slice(0, 24000)}`,
      });
    }

    parts.push({
      text: `Conversation history:\n${transcript}\n\nProvide Nova's next response, 3 concise suggested follow-up questions, and up to 4 key concept tags.`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING, description: 'Clear markdown-formatted academic response.' },
            suggestedFollowUps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 concise follow-up questions the student can click next.',
            },
            keyConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Up to 4 key academic concepts covered.',
            },
          },
          required: ['reply', 'suggestedFollowUps', 'keyConcepts'],
        },
      },
    });

    const raw = (response.text ?? '{}').trim();
    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate AI Mentor response.';
    console.error('[/api/mentor/chat] Error:', message);
    res.status(500).json({ error: message });
  }
});

app.post('/api/mentor/study-plan', async (req, res) => {
  try {
    const { subject = '', examDate = '', hoursPerDay = 2, weakTopics = '' } = req.body ?? {};
    if (!String(subject).trim()) {
      res.status(400).json({ error: 'Subject is required to generate a study plan.' });
      return;
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Create a realistic, high-impact 5-day structured study plan for "${String(subject)}" ahead of "${String(examDate || 'upcoming exam')}". Daily study budget: ${Number(hoursPerDay) || 2} hours/day. Focus heavily on these weak topics: ${String(weakTopics || 'core fundamentals and practice problems')}.`,
      config: {
        systemInstruction: 'You are Nova, an expert university academic planner. Output actionable daily tasks with realistic durations.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            strategySummary: { type: Type.STRING },
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayLabel: { type: Type.STRING },
                  focusTopic: { type: Type.STRING },
                  durationMinutes: { type: Type.INTEGER },
                  tasks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['dayLabel', 'focusTopic', 'durationMinutes', 'tasks'],
              },
            },
          },
          required: ['title', 'strategySummary', 'schedule'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate study plan.';
    console.error('[/api/mentor/study-plan] Error:', message);
    res.status(500).json({ error: message });
  }
});

app.post('/api/mentor/quiz', async (req, res) => {
  try {
    const { topic = '', difficulty = 'intermediate', count = 5, document } = req.body ?? {};
    if (!String(topic).trim() && !document) {
      res.status(400).json({ error: 'Provide a topic or attach a study document to generate a quiz.' });
      return;
    }

    const ai = getAiClient();
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    if (document?.base64Data && document?.mimeType) {
      parts.push({
        inlineData: {
          mimeType: String(document.mimeType),
          data: String(document.base64Data),
        },
      });
    } else if (document?.textContent) {
      parts.push({
        text: `Study Document:\n${String(document.textContent).slice(0, 20000)}`,
      });
    }

    parts.push({
      text: `Generate ${Math.min(Math.max(Number(count) || 5, 3), 8)} multiple-choice practice questions at ${String(difficulty)} university difficulty on "${String(topic || 'the attached document')}". Each question must have exactly 4 distinct options, 1 correctIndex (0-3), a concise explanation, and a subtopic tag.`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: { parts },
      config: {
        systemInstruction: 'You are Nova, a rigorous university exam designer. Return clean JSON.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            topic: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  subtopic: { type: Type.STRING },
                },
                required: ['id', 'question', 'options', 'correctIndex', 'explanation', 'subtopic'],
              },
            },
          },
          required: ['title', 'topic', 'questions'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate quiz.';
    console.error('[/api/mentor/quiz] Error:', message);
    res.status(500).json({ error: message });
  }
});

app.post('/api/campus/triage', async (req, res) => {
  try {
    const { title = '', description = '', building = '' } = req.body ?? {};
    if (!String(title).trim() && !String(description).trim()) {
      res.status(400).json({ error: 'Title or description is required for triage.' });
      return;
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Triage this campus facility ticket.\nTitle: ${String(title)}\nBuilding: ${String(building)}\nDescription: ${String(description)}`,
      config: {
        systemInstruction: 'Classify the campus maintenance ticket into category (electrical, hvac, network, plumbing, safety, av_equipment), priority (low, medium, high, critical), assignedTeam, estimatedSla, and a 1-sentence actionable triageNote.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedCategory: { type: Type.STRING },
            suggestedPriority: { type: Type.STRING },
            assignedTeam: { type: Type.STRING },
            estimatedSla: { type: Type.STRING },
            triageNote: { type: Type.STRING },
          },
          required: ['suggestedCategory', 'suggestedPriority', 'assignedTeam', 'estimatedSla', 'triageNote'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to run AI triage.';
    console.error('[/api/campus/triage] Error:', message);
    res.status(500).json({ error: message });
  }
});

app.post('/api/campus/assistant', async (req, res) => {
  try {
    const { message = '', history = [], context = {} } = req.body ?? {};
    if (!String(message).trim()) {
      res.status(400).json({ error: 'Message is required for Nova Campus Assistant.' });
      return;
    }

    const ai = getAiClient();
    const historyLines = (Array.isArray(history) ? history : [])
      .slice(-6)
      .map((item: { role?: string; text?: string }) => `${item.role === 'user' ? 'User' : 'Nova'}: ${String(item.text || '')}`)
      .join('\n');

    const systemInstruction = [
      'You are Nova, the intelligent AI companion inside the CAMPUSFIX AI Smart Campus Operating System.',
      'Help students, faculty, and visitors navigate CAMPUSFIX AI modules: overview, mentor, campusfix, classroom, exchange, connect, vault, mobility, lostfound, opportunities, workspace, profile, admin.',
      'Be concise, warm, accurate, and practical. Never invent external partnerships, statistics, or private user data.',
      'Always respond with valid JSON matching the schema.',
    ].join(' ');

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Current context: ${JSON.stringify(context)}\n\nRecent conversation:\n${historyLines}\n\nLatest request: ${String(message)}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING, description: 'Helpful, concise response from Nova.' },
            suggestedModule: {
              type: Type.STRING,
              description: 'Best matching ModuleId (overview, mentor, campusfix, classroom, exchange, connect, vault, mobility, lostfound, opportunities, workspace, profile, admin) or empty string.',
            },
            suggestedModuleLabel: {
              type: Type.STRING,
              description: 'Human-readable button label for the suggested module, if applicable.',
            },
            quickPrompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Up to 3 short follow-up questions.',
            },
          },
          required: ['reply', 'suggestedModule', 'suggestedModuleLabel', 'quickPrompts'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reach Nova Campus Assistant.';
    console.error('[/api/campus/assistant] Error:', message);
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CAMPUSFIX AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
