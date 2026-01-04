import { tool } from 'ai';
import { z } from 'zod';
import { generateText } from 'ai';
import { createAzure } from '@ai-sdk/azure';

// Initialize Azure OpenAI
const azure = createAzure({
  apiKey: process.env.AZURE_OPENAI_API_KEY || '',
  resourceName: process.env.AZURE_OPENAI_ENDPOINT?.replace('https://', '').replace('.openai.azure.com', '') || '',
});

export const analyze_scraped_content = tool({
  description: `Use AI to intelligently analyze scraped website content (full page text) and structure it into comprehensive site context.
  
This tool takes the full page text and uses ONE powerful AI call to extract ALL content sections:
- Hero Section (headline, subheadline, CTA, metrics)
- Products & Services descriptions
- About Us (company story, mission, vision, values)
- Use Cases and target industries
- Problem Statement / Value Proposition
- Social Proof (testimonials, case studies, awards, badges)
- FAQ content
- Team/Leadership information
- Who We Serve (target audience)
- Industries served

The AI analyzes the entire page context intelligently, understanding semantic meaning beyond simple pattern matching.`,
  parameters: z.object({
    scrapedData: z.any().describe('The scraped data from scrape_website_content tool (must contain fullPageText)'),
  }),
  execute: async ({ scrapedData }) => {
    try {
      console.log('[analyze_scraped_content] Analyzing full page content with AI...');
      
      // Support both data structures: scrapedData.data.fullPageText or scrapedData.fullPageText
      const data = scrapedData.data || scrapedData;
      
      if (!data.fullPageText) {
        return {
          success: false,
          error: 'No fullPageText found in scraped data'
        };
      }

      const fullText = data.fullPageText;
      const url = scrapedData.url || data.url;

      // ONE comprehensive AI analysis
      const analysis = await analyzeFullPage(fullText, url);

      // Merge with regex-extracted data (metadata, colors, logo, contact)
      const results: any = {
        // From regex
        metadata: data.metadata || {},
        colors: data.colors || {},
        logo: data.logo || {},
        contact: data.contact || {},
        
        // From AI analysis
        ...analysis
      };

      return {
        success: true,
        analyzed: results,
        analyzedSections: Object.keys(results),
        message: `Successfully analyzed all content sections using AI`
      };

    } catch (error: any) {
      console.error('[analyze_scraped_content] Error:', error);
      return {
        success: false,
        error: `Analysis error: ${error.message}`
      };
    }
  }
});

// ONE comprehensive AI analysis function
async function analyzeFullPage(fullText: string, url: string): Promise<any> {
  const prompt = `You are analyzing a website's full page content to extract comprehensive site context information.

Website URL: ${url}

Full Page Content:
${fullText}

Analyze this content and extract ALL of the following sections as a single JSON object. For each section, extract as much relevant information as possible. If a section is not clearly present, provide a reasonable inference or leave it empty.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):

{
  "heroSection": {
    "headline": "Main headline text",
    "subheadline": "Supporting text/value proposition",
    "callToAction": "Primary CTA text",
    "media": "Image/video URL if mentioned",
    "metrics": "Any statistics or social proof numbers (e.g., '10,000+ customers')"
  },
  "productsServices": "Clear, structured description of products/services offered (200-400 words). Focus on: what's offered, key features, benefits, target use cases.",
  "aboutUs": {
    "companyStory": "Brief company history/story (100-200 words)",
    "missionVision": "Mission and vision statements",
    "coreValues": "Core company values (if mentioned)"
  },
  "useCases": "Description of main use cases and scenarios (200-400 words). Focus on: key use cases, target industries, specific problems solved.",
  "problemStatement": "The core problem being solved or value proposition (100-300 words). Focus on: what problem is solved, why it matters, the solution approach.",
  "whoWeServe": "Description of target audience/customers (100-200 words)",
  "industries": "List or description of industries served",
  "socialProof": {
    "testimonials": "Customer testimonials/reviews (if present)",
    "caseStudies": "Case studies or success stories (if present)",
    "badges": "Certifications, security badges, trust signals",
    "awards": "Awards or recognition",
    "guarantees": "Money-back guarantees, warranties",
    "integrations": "Partner logos, integrations mentioned"
  },
  "contactInformation": {
    "primaryContact": "Main contact method (already extracted, but add details if more context)",
    "locationHours": "Office location and hours",
    "supportChannels": "Available support channels",
    "additional": "Any other contact-related information"
  },
  "faq": "Parsed FAQ content as Q&A pairs (clear, organized format)",
  "leadershipTeam": "Structured list of team members with names, titles, brief descriptions"
}

Guidelines:
- Be comprehensive: Extract as much detail as possible from the full text
- Be intelligent: Understand context and semantic meaning, not just keywords
- Be structured: Format information clearly and usefully
- Fill in what you can: If a section exists but is brief, extract what's there
- Skip only if truly absent: Only leave sections empty if there's genuinely no relevant content
- Infer intelligently: Make reasonable inferences from context`;

  const { text } = await generateText({
    model: azure(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1'),
    prompt,
    maxTokens: 2500, // Larger token budget for comprehensive analysis
  });

  try {
    const cleaned = text.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(cleaned);
  } catch (parseError) {
    console.error('[analyzeFullPage] JSON parse error:', parseError);
    console.error('[analyzeFullPage] Raw response:', text);
    
    // Return minimal structure on parse failure
    return {
      heroSection: {},
      productsServices: '',
      aboutUs: {},
      useCases: '',
      problemStatement: '',
      whoWeServe: '',
      industries: '',
      socialProof: {},
      contactInformation: {},
      faq: '',
      leadershipTeam: ''
    };
  }
}

