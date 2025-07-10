import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_CATEGORY_API!);

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    console.log("Received Text for categorization:", text);

    const prompt = `Analyze the following failure story and categorize it into one of these three categories:
    
    1. "academic" - Failures related to education, studies, exams, grades, courses, research, thesis, assignments, academic performance, school, college, university
    2. "professional" - Failures related to work, career, job, business, startup, interviews, promotions, workplace, projects, deadlines, professional goals
    3. "general" - Failures related to personal life, relationships, health, sports, hobbies, personal goals, social situations, family issues
    
    Text to categorize: "${text}"
    
    Return ONLY one word from: academic, professional, general
    No explanations, no additional text, just the category word.`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);

    const response = await result.response.text();
    const category = response.trim().toLowerCase();
    
    // Validate the response is one of our expected categories
    const validCategories = ['academic', 'professional', 'general'];
    const finalCategory = validCategories.includes(category) ? category : 'general';
    
    console.log("Gemini categorization result:", finalCategory);

    return NextResponse.json({ category: finalCategory });
  } catch (error) {
    console.error("Error categorizing post:", error);
    // Return a default category if there's an error
    return NextResponse.json({ category: "general" });
  }
}
