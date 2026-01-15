"use server";

import { GoogleGenAI } from "@google/genai";

// Validate API key
if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

type GenerateBlogContentResult =
  | { success: true; content: string }
  | { success: false; error: string };

type ImproveContentResult =
  | { success: true; content: string }
  | { success: false; error: string };

type ImprovementType = "expand" | "simplify" | "enhance";

// Helper function to clean and structure HTML content
function cleanAndStructureHTML(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  let cleaned = html.trim();

  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/```html?\n?/g, "").replace(/```\n?/g, "");

  // Remove common prefixes that AI might add
  cleaned = cleaned.replace(/^Here['']?s?\s*(the|a)?\s*/i, "");
  cleaned = cleaned.replace(/^The\s+(blog|content|post)\s+(is|follows|below):?\s*/i, "");

  // Fix common HTML issues
  // Ensure paragraphs are properly wrapped
  cleaned = cleaned.replace(/(?<!<p>)\s*<p>/g, "<p>");
  cleaned = cleaned.replace(/<\/p>\s*(?!<)/g, "</p>\n");
  
  // Remove empty paragraphs
  cleaned = cleaned.replace(/<p>\s*<\/p>/g, "");
  cleaned = cleaned.replace(/<p><\/p>/g, "");

  // Ensure headings have proper spacing
  cleaned = cleaned.replace(/<\/h2>\s*(?!<[ph])/g, "</h2>\n");
  cleaned = cleaned.replace(/<\/h3>\s*(?!<[ph])/g, "</h3>\n");

  // Remove multiple consecutive newlines/whitespace
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  cleaned = cleaned.replace(/\s{3,}/g, " ");

  // Ensure lists are properly formatted
  cleaned = cleaned.replace(/<ul>\s*<li>/g, "<ul><li>");
  cleaned = cleaned.replace(/<\/li>\s*<\/ul>/g, "</li></ul>");

  // Remove any remaining markdown artifacts
  cleaned = cleaned.replace(/^\*\s+/gm, "");
  cleaned = cleaned.replace(/^#+\s+/gm, "");

  // Ensure content starts with a paragraph if it doesn't start with a heading
  if (!cleaned.trim().startsWith("<h2") && !cleaned.trim().startsWith("<p")) {
    cleaned = "<p>" + cleaned.trim() + "</p>";
  }

  return cleaned.trim();
}

export async function generateBlogContent(
  title: string,
  category: string = "",
  tags: string[] = []
): Promise<GenerateBlogContentResult> {
  try {
    if (!title || title.trim().length === 0) {
      throw new Error("Title is required to generate content");
    }

    const prompt = `
Write a comprehensive, well-structured blog post with the title: "${title}"

${category ? `Category: ${category}` : ""}
${tags.length > 0 ? `Tags: ${tags.join(", ")}` : ""}

CRITICAL HTML STRUCTURE REQUIREMENTS:
- Start with an opening <p> tag for the introduction - DO NOT include the title
- Use <h2> tags ONLY for main section headings (3-5 sections total)
- Use <h3> tags ONLY for subsection headings within main sections
- Wrap ALL paragraphs in <p> tags - every paragraph must have opening and closing tags
- Use <ul> and <li> tags for unordered lists
- Use <ol> and <li> tags for ordered lists when appropriate
- Use <strong> for bold emphasis and <em> for italic emphasis
- Use <blockquote> for quotes or important callouts
- DO NOT use inline styles, classes, or attributes
- DO NOT include empty tags like <p></p> or <h2></h2>
- Ensure proper nesting: paragraphs inside sections, lists properly formatted
- Make sections flow logically with smooth transitions

CONTENT REQUIREMENTS:
- Write engaging, informative content that thoroughly explores the title topic
- Include 3-5 main sections with clear, descriptive headings
- Each section should have 2-4 paragraphs of substantial content
- Include practical insights, real-world examples, and actionable advice
- Write in a conversational yet professional tone
- Target 800-1200 words total
- Ensure the content is original, valuable, and well-researched
- Use varied sentence structure and engaging language
- End with a strong conclusion that summarizes key points

FORMATTING RULES:
- Start directly with the introduction paragraph: <p>Your introduction text here...</p>
- Each section should follow this structure:
  <h2>Section Title</h2>
  <p>First paragraph of section...</p>
  <p>Second paragraph if needed...</p>
  [Optional: <h3>Subsection</h3> if needed]
- Ensure proper spacing between elements (the HTML will be rendered as-is)
- No markdown formatting - ONLY valid HTML tags

Return ONLY the HTML content without any markdown, code blocks, or explanations.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    // Handle different possible response structures
    let content: string;
    const responseAny = response as any;
    
    if (responseAny.text) {
      // response.text is a getter property
      content = String(responseAny.text);
    } else if (responseAny.candidates?.[0]?.content?.parts?.[0]?.text) {
      content = String(responseAny.candidates[0].content.parts[0].text);
    } else {
      // Log response structure for debugging
      console.error("Unexpected response structure:", JSON.stringify(response, null, 2));
      throw new Error("Unexpected response format from AI service");
    }

    // Check if content was generated
    if (!content || typeof content !== "string" || content.trim().length < 100) {
      throw new Error("Generated content is too short or empty");
    }

    // Clean and structure the HTML content
    const cleanedContent = cleanAndStructureHTML(content);

    if (!cleanedContent || cleanedContent.trim().length < 100) {
      throw new Error("Generated content is too short or empty after processing");
    }

    return {
      success: true,
      content: cleanedContent,
    };
  } catch (error) {
    console.error("Gemini AI Error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("API key")) {
      return {
        success: false,
        error: "AI service configuration error. Please try again later.",
      };
    }

    if (errorMessage.includes("quota") || errorMessage.includes("limit")) {
      return {
        success: false,
        error: "AI service is temporarily unavailable. Please try again later.",
      };
    }

    return {
      success: false,
      error: errorMessage || "Failed to generate content. Please try again.",
    };
  }
}

export async function improveContent(
  currentContent: string,
  improvementType: ImprovementType = "enhance"
): Promise<ImproveContentResult> {
  try {
    if (!currentContent || currentContent.trim().length === 0) {
      throw new Error("Content is required for improvement");
    }

    let prompt = "";

    switch (improvementType) {
      case "expand":
        prompt = `
Expand this blog content with more details, examples, and insights:

${currentContent}

CRITICAL HTML STRUCTURE REQUIREMENTS:
- Maintain the existing HTML structure (h2, h3, p, ul, li tags)
- Ensure all paragraphs are properly wrapped in <p> tags
- Keep proper nesting and formatting
- DO NOT add inline styles or classes
- Preserve existing emphasis tags (<strong>, <em>)

CONTENT EXPANSION REQUIREMENTS:
- Keep the existing structure and main points intact
- Add more depth and detail to each section (add 2-3 more paragraphs per section)
- Include practical examples, case studies, or real-world scenarios
- Add more insights, statistics, or supporting evidence
- Expand explanations where concepts need more clarity
- Include actionable advice or step-by-step guidance
- Maintain the original tone and style
- Keep the same HTML formatting structure

Return ONLY the expanded HTML content without any markdown, code blocks, or explanations.
`;
        break;

      case "simplify":
        prompt = `
Simplify this blog content to make it more concise and easier to read:

${currentContent}

CRITICAL HTML STRUCTURE REQUIREMENTS:
- Maintain clean HTML structure (h2, h3, p, ul, li tags)
- Ensure all paragraphs are properly wrapped in <p> tags
- Keep proper nesting and formatting
- DO NOT add inline styles or classes
- Preserve emphasis tags (<strong>, <em>) where important

CONTENT SIMPLIFICATION REQUIREMENTS:
- Keep all main points and essential information
- Remove unnecessary complexity and verbose language
- Use simpler, more direct language where possible
- Break down complex sentences into shorter, clearer ones
- Consolidate redundant sections or paragraphs
- Make concepts more accessible without losing meaning
- Remove filler words and phrases
- Maintain the HTML formatting structure

Return ONLY the simplified HTML content without any markdown, code blocks, or explanations.
`;
        break;

      default: // enhance
        prompt = `
Improve this blog content by making it more engaging and well-structured:

${currentContent}

CRITICAL HTML STRUCTURE REQUIREMENTS:
- Ensure all paragraphs are wrapped in <p> tags (opening and closing)
- Use <h2> for main section headings only
- Use <h3> for subsection headings within main sections
- Maintain proper HTML nesting and structure
- Remove any empty tags like <p></p>
- Clean up any malformed HTML
- Ensure lists use proper <ul>/<ol> and <li> tags
- Use <strong> for bold and <em> for italic emphasis
- DO NOT add inline styles, classes, or attributes

CONTENT IMPROVEMENT REQUIREMENTS:
- Improve flow and readability between sections
- Add engaging transition sentences between paragraphs
- Enhance with better examples, anecdotes, or explanations
- Strengthen weak arguments or shallow sections
- Improve sentence variety and structure
- Make the content more compelling and engaging
- Maintain the original length approximately
- Ensure each section has sufficient depth and detail
- Add smooth transitions that connect ideas naturally

Return ONLY the improved HTML content without any markdown, code blocks, or explanations.
`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    // Handle different possible response structures
    let improvedContent: string;
    const responseAny = response as any;
    
    if (responseAny.text) {
      // response.text is a getter property
      improvedContent = String(responseAny.text);
    } else if (responseAny.candidates?.[0]?.content?.parts?.[0]?.text) {
      improvedContent = String(responseAny.candidates[0].content.parts[0].text);
    } else {
      // Log response structure for debugging
      console.error("Unexpected response structure:", JSON.stringify(response, null, 2));
      throw new Error("Unexpected response format from AI service");
    }

    // Check if content was generated
    if (!improvedContent || typeof improvedContent !== "string" || improvedContent.trim().length === 0) {
      throw new Error("No content was generated");
    }

    // Clean and structure the HTML content
    const cleanedContent = cleanAndStructureHTML(improvedContent);

    if (!cleanedContent || cleanedContent.trim().length === 0) {
      throw new Error("No content was generated after processing");
    }

    return {
      success: true,
      content: cleanedContent,
    };
  } catch (error) {
    console.error("Content improvement error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: errorMessage || "Failed to improve content. Please try again.",
    };
  }
}