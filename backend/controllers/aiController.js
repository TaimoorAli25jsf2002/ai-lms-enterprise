// ==================================================
// FILE 17: backend/controllers/aiController.js (FREE Gemini API)
// ==================================================
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// AI Chat
exports.aiChat = async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const systemPrompt = `You are a friendly AI tutor teaching kids (ages 8-16) about AI and ML. 
    Keep responses simple, fun, and under 3 paragraphs.
    ${context ? `\n\nCurrent lesson: ${context}` : ''}`;

    const result = await model.generateContent(`${systemPrompt}\n\nStudent: ${message}`);
    const reply = result.response.text();

    res.json({ success: true, reply });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Explain code
exports.explainCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Explain this ${language || 'code'} to a kid learning programming:
    
    ${code}
    
    Provide: 1) What it does, 2) A fun analogy, 3) Key concepts`;

    const result = await model.generateContent(prompt);
    const explanation = result.response.text();

    res.json({ success: true, explanation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate quiz
exports.generateQuiz = async (req, res) => {
  try {
    const { topic, difficulty, numQuestions = 5 } = req.body;
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Generate ${numQuestions} multiple choice questions about ${topic} for kids.
    Difficulty: ${difficulty || 'beginner'}
    
    Return ONLY a JSON array with this structure (no markdown):
    [{"question":"text","options":["A","B","C","D"],"correctAnswer":"A","explanation":"why"}]`;

    const result = await model.generateContent(prompt);
    let content = result.response.text();
    
    // Clean response
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const questions = JSON.parse(content);

    res.json({ success: true, questions });
  } catch (error) {
    res.json({ 
      success: true, 
      questions: [
        {
          question: "What is AI?",
          options: ["Artificial Intelligence", "Animal Intelligence", "Automatic Info", "Advanced Internet"],
          correctAnswer: "Artificial Intelligence",
          explanation: "AI means Artificial Intelligence!"
        }
      ]
    });
  }
};

// Get recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const { completedCourses, interests, difficulty } = req.body;
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Recommend 3 AI/ML topics for a student:
    Completed: ${completedCourses?.join(', ') || 'None'}
    Interests: ${interests || 'General AI'}
    Level: ${difficulty || 'beginner'}
    
    Return JSON: [{"topic":"name","reason":"why","difficulty":"level"}]`;

    const result = await model.generateContent(prompt);
    let content = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const recommendations = JSON.parse(content);

    res.json({ success: true, recommendations });
  } catch (error) {
    res.json({
      success: true,
      recommendations: [
        { topic: "Neural Networks", reason: "Great next step!", difficulty: "intermediate" }
      ]
    });
  }
};
module.exports = exports;