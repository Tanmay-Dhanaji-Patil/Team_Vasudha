import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { message, conversationHistory, user } = body;

    // Validate input
    if (!message || message.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        success: true,
        response: getFallbackResponse(message)
      });
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      // Build conversation context
      const conversationContext = conversationHistory
        ?.slice(-5) // Last 5 messages for context
        ?.map(msg => `${msg.type}: ${msg.message}`)
        ?.join('\n') || '';

      // Create a comprehensive prompt for general assistance with agricultural expertise
      const prompt = `
You are a helpful and knowledgeable AI assistant with specialized expertise in agriculture and farming. You can answer questions on a wide variety of topics, but you have particular strength in agricultural advice, especially for Indian farming conditions.

**User Information:**
- Name: ${user?.username || 'User'}
- Location: ${user?.location || 'India'}
- Context: ${user?.crops ? `Grows: ${user.crops}` : 'General user'}

**Current Date:** ${new Date().toLocaleDateString('en-IN')}

**Recent Conversation:**
${conversationContext}

**Current User Message:** ${message}

**Instructions:**
1. Answer any question the user asks - you're not limited to agricultural topics
2. Be conversational, friendly, and helpful
3. Use clear, easy-to-understand language
4. Provide accurate and practical information
5. If the question is agriculture-related, leverage your specialized knowledge:
   - Consider Indian farming conditions and practices
   - Provide specific, actionable recommendations
   - Include seasonal considerations when relevant
   - Mention weather dashboard for weather-specific advice
6. For non-agricultural questions, provide general helpful responses
7. Break down complex topics into easy steps
8. Use relevant emoji to make responses engaging
9. Keep responses concise but informative (max 400 words)
10. If unsure about something, be honest and suggest reliable sources

**You can help with:**
- Any general questions (science, technology, history, etc.)
- Agricultural topics: crops, soil, pests, fertilizers, irrigation
- Weather and farming decisions
- Market trends and economics
- Government schemes and policies
- Modern farming technologies
- Personal advice and problem-solving
- Educational topics
- Current events and news

Please provide a helpful, accurate response to the user's question.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return NextResponse.json({
        success: true,
        response: text
      });

    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Return fallback response when Gemini fails
      return NextResponse.json({
        success: true,
        response: getFallbackResponse(message)
      });
    }

  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Fallback response when Gemini API is not available
 */
function getFallbackResponse(message) {
  const messageLower = message.toLowerCase();
  
  // Greeting responses
  if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower.includes('hey')) {
    return "👋 Hello! I'm your AI assistant. I can help you with any questions you have - from agriculture and farming to general topics like science, technology, current events, and more. What would you like to know?";
  }
  
  // General help
  if (messageLower.includes('help') || messageLower.includes('what can you do')) {
    return "🤖 I'm here to assist you with any questions! I can help with agriculture & farming, general knowledge & science, technology questions, current events & news, problem-solving & guidance, and educational topics. Just ask me anything you're curious about!";
  }
  
  // Weather queries
  if (messageLower.includes('weather') || messageLower.includes('rain') || messageLower.includes('temperature')) {
    return "🌤️ I can provide general weather guidance, but for detailed local weather information and farming recommendations, check the Weather Card on your dashboard. Is there something specific about weather patterns or seasonal planning you'd like to discuss?";
  }
  
  // Agricultural topics
  if (messageLower.includes('crop') || messageLower.includes('farm') || messageLower.includes('agriculture') || messageLower.includes('plant')) {
    return "🌱 Great agricultural question! I'd love to help with farming advice. For October in India, it's an excellent time for Rabi crop preparation. I can discuss crop selection, soil management, seasonal planning, or any other farming topics you're interested in.";
  }
  
  // Technology questions
  if (messageLower.includes('technology') || messageLower.includes('computer') || messageLower.includes('software') || messageLower.includes('app')) {
    return "💻 I can help with technology questions! Whether it's about farming technology, software, computers, or digital tools, I'm here to assist. What specific technology topic interests you?";
  }
  
  // Science questions
  if (messageLower.includes('science') || messageLower.includes('how does') || messageLower.includes('why does') || messageLower.includes('what is')) {
    return "🧪 I love science questions! I can explain concepts in biology, chemistry, physics, environmental science, and more. What scientific topic would you like to explore?";
  }
  
  // Education related
  if (messageLower.includes('learn') || messageLower.includes('study') || messageLower.includes('education') || messageLower.includes('school')) {
    return "📚 Learning is wonderful! I can help explain concepts, provide study tips, or discuss educational topics. What subject or skill are you interested in learning about?";
  }
  
  // Current events/news
  if (messageLower.includes('news') || messageLower.includes('current') || messageLower.includes('today') || messageLower.includes('recent')) {
    return "📰 I can discuss current events and trends, though my information has a cutoff date. What topic or recent development are you curious about?";
  }
  
  // Personal advice
  if (messageLower.includes('advice') || messageLower.includes('should i') || messageLower.includes('recommend')) {
    return "💡 I'm happy to help with advice and recommendations! Whether it's about farming decisions, career choices, or general life questions, I'll do my best to provide helpful guidance. What situation would you like advice on?";
  }
  
  // Default response for any other question
  return "🤖 That's an interesting question! While my AI capabilities are temporarily limited right now, I'm still here to help. I can assist with agriculture & farming, science & technology, general knowledge, problem-solving, and educational topics. Please feel free to rephrase your question or ask about any of these topics. I'm here to help in any way I can!";
}

export async function GET() {
  return NextResponse.json(
    { message: 'Chatbot API is working. Use POST method to send messages.' },
    { status: 200 }
  );
}
