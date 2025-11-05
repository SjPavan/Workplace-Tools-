import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Chat endpoint with streaming support
app.post('/ai/chat', async (req, res) => {
  const { message, sessionId, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Set headers for Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // Apply basic safety filter
    if (!passesSafetyFilter(message)) {
      res.write(`data: ${JSON.stringify({ content: 'Request blocked by safety filter.', done: true })}\n\n`);
      res.end();
      return;
    }

    // Mock AI response for MVP - simulates streaming
    // In production, this would call the AI orchestration backend
    const mockResponse = generateMockResponse(message);
    
    // Simulate streaming by sending response in chunks
    const words = mockResponse.split(' ');
    for (let i = 0; i < words.length; i++) {
      const content = (i === 0 ? '' : ' ') + words[i];
      const isDone = i === words.length - 1;
      
      res.write(`data: ${JSON.stringify({ content, done: isDone })}\n\n`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    res.end();

  } catch (error) {
    console.error('Error in /ai/chat:', error);
    res.write(`data: ${JSON.stringify({ 
      content: 'An error occurred. Please try again.', 
      done: true,
      error: error.message 
    })}\n\n`);
    res.end();
  }
});

// Basic safety filter
function passesSafetyFilter(text) {
  const bannedPatterns = [
    /\b(hack|exploit|attack|malware|virus)\b/i,
    /\b(password|credit card|ssn)\b.*\d{3,}/i,
    /\b(kill|murder|suicide|bomb)\b/i
  ];

  return !bannedPatterns.some(pattern => pattern.test(text));
}

// Generate mock AI response
function generateMockResponse(message) {
  const responses = [
    `I understand you're asking about "${message.substring(0, 50)}". Let me help you with that. Based on your question, I can provide some insights and guidance. This is a development preview response demonstrating the streaming capability.`,
    `That's an interesting question about "${message.substring(0, 50)}". Here's what I can tell you: The system is currently in development mode, and I'm demonstrating the streaming response feature. In production, this would connect to the full AI orchestration backend.`,
    `Thank you for your question regarding "${message.substring(0, 50)}". I'm processing your request and providing a streamed response. This MVP demonstrates the core functionality of the AI workspace assistant with real-time streaming capabilities.`
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

// Serve the workspace HTML
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'workspace.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 AI Workspace Assistant server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Workspace UI: http://localhost:${PORT}/`);
});
