import { NextRequest, NextResponse } from "next/server";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    // Check if API key is available
    if (!MISTRAL_API_KEY) {
      console.error("MISTRAL_API_KEY environment variable is not set");
      return NextResponse.json({ category: "personal" });
    }

    const { text } = await req.json();
    console.log("Received Text for categorization:", text);

    const prompt = `You are a strict classifier that categorizes social media posts into one of seven specific categories based on the context and theme.

Categories:
1. academic — education, studies, exams, grades, thesis, college/university life, assignments, academic pressure or performance
2. jobhunt — job search, interviews, applications, resume, career transitions, recruitment process
3. workplace — current job issues, office politics, work performance, team dynamics, promotions, workplace culture
4. startup — entrepreneurship, building companies, funding, product development, business ideas, startup life
5. personal — relationships, family, friendships, dating, life transitions, personal decisions, emotional struggles
6. health — physical health, mental health, fitness, medical issues, wellness, self-care, lifestyle
7. hobby — creative pursuits, sports, gaming, art, music, personal interests, recreational activities

Examples:
- "Failed my thesis defense today." → academic
- "Got rejected from my 5th job interview this month." → jobhunt
- "Promotion denied. Feedback said I'm not 'visible' enough. Frustrating." → workplace
- "Startup pitch got torn apart in demo day. Back to drawing board." → startup
- "Missed my best friend's wedding due to family drama." → personal
- "Slept 3 hours again. My brain's not cooperating anymore." → health
- "I've not created any art in months. Feeling blocked." → hobby
- "Couldn't crack the GATE exam for the third time." → academic
- "I was dropped from the research paper co-authorship. Hurts." → academic
- "Startup failed. We didn't reach product-market fit." → startup
- "Cried after messing up my violin recital again." → hobby
- "Didn't get shortlisted for Google internship. Again." → jobhunt
- "Getting negative feedback from team despite pulling 14-hour days." → workplace
- "Family doesn't support my decision to study abroad." → personal
- "Every workout feels harder now. Progress is stalling." → health

Classify the following text:

"${text}"
      
      Return ONLY one word from: academic, jobhunt, workplace, startup, personal, health, hobby
      No explanations, no additional text, just the category word.`;

    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-small-latest', // Using smaller, faster model with potentially higher limits
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`Mistral API responded with status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const category = data.choices[0].message.content.trim().toLowerCase();
    
    // Validate the response is one of our expected categories
    const validCategories = ['academic', 'jobhunt', 'workplace', 'startup', 'personal', 'health', 'hobby'];
    const finalCategory = validCategories.includes(category) ? category : 'personal';
    
    console.log("Mistral categorization result:", finalCategory);

    return NextResponse.json({ category: finalCategory });
  } catch (error) {
    console.error("Error categorizing post:", error);
    // Return a default category if there's an error
    return NextResponse.json({ category: "personal" });
  }
}
