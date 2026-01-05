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
  description: `Advanced AI-powered website content analyzer for comprehensive site context extraction.
  
Uses ONE powerful AI call to intelligently extract ALL content sections from scraped data:
- Brand & Site: Meta info, tone, languages (header/footer excluded)
- Hero Section: Headline, subheadline, CTA, media, metrics
- Business Context: Problem statement, who we serve, use cases, industries, products/services
- Trust & Company: About us, FAQ (as JSON array), leadership, contact info
- Social Proof: Extracted from page + requires external sources

Supports both single-page and multi-page (combinedFullText) analysis.`,
  parameters: z.object({
    scrapedData: z.any().describe('The scraped data from scrape_website_content tool'),
  }),
  execute: async ({ scrapedData }) => {
    try {
      console.log('[analyze_scraped_content] Analyzing content with AI...');
      
      // Support multiple data structures
      const data = scrapedData.data || scrapedData;
      
      // Get the best available text content
      const fullText = data.combinedFullText || data.homepage?.fullPageText || data.fullPageText;
      
      if (!fullText) {
        return {
          success: false,
          error: 'No text content found in scraped data'
        };
      }

      const url = scrapedData.url || data.url;
      
      // Gather all pre-extracted data
      const preExtracted = {
        metadata: data.homepage?.metadata || data.metadata || {},
        colors: data.homepage?.colors || data.colors || {},
        typography: data.homepage?.typography || data.typography || {},
        logo: data.homepage?.logo || data.logo || {},
        heroSection: data.homepage?.heroSection || data.heroSection || {},
        contact: data.homepage?.contact || data.contact || {},
        language: data.homepage?.language || data.language || {},
        keyPages: data.keyPages || [],
        landingPages: data.landingPages || [],
        blogPages: data.blogPages || [],
        navigationLinks: data.navigationLinks || [],
      };

      // ONE comprehensive AI analysis
      const analysis = await analyzeFullContent(fullText, url, preExtracted);

      // Merge pre-extracted data with AI analysis
      const results: any = {
        // Pre-extracted (regex-based)
        metadata: preExtracted.metadata,
        colors: preExtracted.colors,
        typography: preExtracted.typography,
        logo: preExtracted.logo,
        contact: preExtracted.contact,
        language: preExtracted.language,
        
        // Page classifications
        keyPages: preExtracted.keyPages,
        landingPages: preExtracted.landingPages,
        blogPages: preExtracted.blogPages,
        navigationLinks: preExtracted.navigationLinks,
        
        // AI-analyzed content
        ...analysis
      };

      return {
        success: true,
        analyzed: results,
        analyzedSections: Object.keys(results),
        stats: {
          textLength: fullText.length,
          pagesAnalyzed: data.pages?.length ? data.pages.length + 1 : 1,
        },
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

// Comprehensive AI analysis function
async function analyzeFullContent(
  fullText: string, 
  url: string, 
  preExtracted: any
): Promise<any> {
  
  const prompt = `You are an expert website content analyst. Analyze the following website content and extract comprehensive site context information.

Website URL: ${url}

Pre-extracted Data (from HTML parsing):
- Title: ${preExtracted.metadata?.title || 'Not found'}
- Description: ${preExtracted.metadata?.description || 'Not found'}
- Primary Color: ${preExtracted.colors?.primary || 'Not found'}
- Detected Fonts: ${preExtracted.typography?.googleFonts?.join(', ') || 'None detected'}
- Hero Headline: ${preExtracted.heroSection?.headline || 'Not found'}
- Contact Email: ${preExtracted.contact?.primary || 'Not found'}
- Language: ${preExtracted.language?.primary || 'en'}
- Key Pages: ${preExtracted.keyPages?.slice(0, 5).join(', ') || 'None'}

Full Page Content (${fullText.length} chars):
${fullText}

Analyze this content and return a JSON object with ALL of the following sections. Extract as much detail as possible. Use intelligent inference where direct information is missing.

IMPORTANT: Return ONLY valid JSON (no markdown, no explanation, no code blocks).

{
  "brandInfo": {
    "name": "Company/product name",
    "tagline": "Brand tagline or slogan",
    "tone": "Describe the writing tone/voice (e.g., Professional, Friendly, Technical, Casual, Authoritative)",
    "languages": "Detected languages (e.g., 'English, Spanish' or just 'English')"
  },
  
  "heroSection": {
    "headline": "Main headline (improve if pre-extracted seems incomplete)",
    "subheadline": "Value proposition or supporting text",
    "callToAction": "Primary CTA text",
    "media": "Hero image/video URL if found",
    "metrics": "Any statistics shown (e.g., '10,000+ users', '99% uptime')"
  },
  
  "businessContext": {
    "problemStatement": "What problem does this product/service solve? (200-400 words)",
    "whoWeServe": "Who is the target audience? (100-200 words)",
    "useCases": "Main use cases and applications (200-400 words)",
    "industries": "Industries or verticals served (list or description)",
    "productsServices": "Detailed description of products/services offered (300-500 words)"
  },
  
  "trustCompany": {
    "aboutUs": {
      "companyStory": "Company history/origin story (100-200 words)",
      "missionVision": "Mission and vision statements",
      "coreValues": "Core company values"
    },
    "leadershipTeam": "Team members with names, titles, brief descriptions (structured list)",
    "faq": [
      {"question": "First FAQ question?", "answer": "Answer to first question"},
      {"question": "Second FAQ question?", "answer": "Answer to second question"}
    ],
    "contactInfo": {
      "primaryContact": "Main contact email or form",
      "locationHours": "Office location and hours if mentioned",
      "supportChannels": "Available support methods (chat, email, phone, etc.)"
    }
  },
  
  "socialProof": {
    "testimonials": ["Quote 1 - Customer Name, Company", "Quote 2 - Customer Name"],
    "caseStudies": "Any case studies or success stories mentioned",
    "badges": "Trust badges, certifications, security seals",
    "awards": "Awards or recognition",
    "metrics": "Social proof numbers (customers, users, downloads, etc.)",
    "integrations": "Partner integrations or 'as seen in' mentions",
    "note": "For comprehensive social proof, also check external platforms (ProductHunt, Trustpilot, G2)"
  },
  
  "pagesInfo": {
    "keyPagesDescription": "Brief description of the main website pages based on content",
    "landingPagesDescription": "Description of any landing pages or campaign pages detected",
    "blogDescription": "Description of blog/resource section if present"
  }
}

Guidelines:
- Be comprehensive: Extract ALL available information
- Be accurate: Only include information that's clearly present or can be reasonably inferred
- Be structured: Format everything for easy consumption
- FAQ MUST be a JSON array of {question, answer} objects
- For missing sections, provide empty values rather than making up content
- Infer tone from writing style (formal, casual, technical, friendly, etc.)
- Infer target audience from content and language used`;

  const { text } = await generateText({
    model: azure(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1'),
    prompt,
    maxTokens: 3500, // Increased for comprehensive analysis
  });

  try {
    // Clean potential markdown code blocks
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }
    
    const parsed = JSON.parse(cleaned);
    
    // Flatten the structure for easier saving
    return {
      // Brand info
      brandName: parsed.brandInfo?.name,
      tagline: parsed.brandInfo?.tagline,
      tone: parsed.brandInfo?.tone,
      languages: parsed.brandInfo?.languages,
      
      // Hero section
      heroSection: parsed.heroSection,
      
      // Business context (individual fields for separate saving)
      problemStatement: parsed.businessContext?.problemStatement,
      whoWeServe: parsed.businessContext?.whoWeServe,
      useCases: parsed.businessContext?.useCases,
      industries: parsed.businessContext?.industries,
      productsServices: parsed.businessContext?.productsServices,
      
      // Trust & Company
      aboutUs: parsed.trustCompany?.aboutUs,
      leadershipTeam: parsed.trustCompany?.leadershipTeam,
      faq: parsed.trustCompany?.faq, // Already an array
      contactInformation: parsed.trustCompany?.contactInfo,
      
      // Social proof
      socialProof: parsed.socialProof,
      
      // Pages info
      pagesInfo: parsed.pagesInfo,
    };
    
  } catch (parseError) {
    console.error('[analyzeFullContent] JSON parse error:', parseError);
    console.error('[analyzeFullContent] Raw response:', text.substring(0, 500));
    
    // Return minimal structure on parse failure
    return {
      heroSection: {},
      problemStatement: '',
      whoWeServe: '',
      useCases: '',
      industries: '',
      productsServices: '',
      aboutUs: {},
      leadershipTeam: '',
      faq: [],
      contactInformation: {},
      socialProof: {},
      tone: '',
      languages: '',
    };
  }
}
