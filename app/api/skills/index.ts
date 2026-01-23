import { SkillRegistry } from './types';

// System Skills
import { planningSkill } from './skill-system/planning.skill';

// Build Skills - Page Generators
import { alternativePageGeneratorSkill } from './skill-build/alternative-page-generator.skill';
import { listiclePageGeneratorSkill } from './skill-build/listicle-page-generator.skill';

import { Skill } from './types';

/**
 * Global Logic Skill
 * Represents the core reasoning and mandatory rules of the AI Agent
 */
export const coreLogicSkill: Skill = {
  id: 'agent-core-logic',
  name: 'System: Core Logic',
  description: 'Core reasoning rules for SEO Page Generator Agent',
  systemPrompt: `====================
MANDATORY PLANNING-FIRST RULE
====================

IF the user's request requires you to call ANY tool:
→ You MUST call 'create_plan' as your FIRST tool call
→ NO EXCEPTIONS

====================
PAGE TYPES SUPPORTED
====================

This tool specializes in generating TWO types of pages:

1. **ALTERNATIVE PAGE** (page_type: 'alternative')
   - 1v1 comparison: "Brand vs Competitor"
   - Use alternativePageGeneratorSkill

2. **LISTICLE PAGE** (page_type: 'listicle')  
   - Multiple products: "Top 10 Best X Alternatives"
   - Use listiclePageGeneratorSkill

====================
PAGE GENERATION WORKFLOW:
====================

When generating any page:
1. Check page_type to determine which skill to use
2. Fetch content item details and site context
3. Research competitor features and differentiators
4. Generate each section using appropriate section tools
5. Assemble all sections into complete HTML
6. Integrate with site header/footer
7. Save the final page

All pages should:
- Clearly highlight why YOUR product is better
- Include strategic CTAs throughout
- Feature professional comparison content
- Use persuasive, benefit-focused copy
- Have beautiful, modern design`,
  tools: {},
  enabled: true,
  metadata: {
    category: 'system',
    priority: 'highest',
    solution: 'Core logic for SEO Page Generator - focused on creating premium competitor comparison and listicle pages.',
    demoUrl: '',
  },
};

/**
 * Global Skill Registry
 * Central registry for all available skills
 */
export const skillRegistry = new SkillRegistry();

// Register skills (planning first, then page generation)
skillRegistry.register(coreLogicSkill);
skillRegistry.register(planningSkill);
skillRegistry.register(alternativePageGeneratorSkill);
skillRegistry.register(listiclePageGeneratorSkill);

/**
 * Get system prompt by combining all enabled skills
 */
export function getCombinedSystemPrompt(userId?: string, projectId?: string): string {
  const skills = skillRegistry.getEnabled();
  
  const basePrompt = `You are SEO Page Generator, an AI assistant specialized in creating TOP-TIER comparison and listicle landing pages.

CURRENT CONTEXT:
${userId ? `- Current User ID: ${userId}` : ''}
${projectId ? `- Current SEO Project ID: ${projectId}` : ''}
- Current Time: ${new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'long' })} (UTC)

====================
YOUR SPECIALTY
====================
You excel at generating two types of pages:

1. **Alternative Pages** (page_type: 'alternative')
   - 1v1 comparison: "Brand vs Competitor"
   - Convinces visitors to switch from competitor

2. **Listicle Pages** (page_type: 'listicle')
   - Multi-product comparison: "Top 10 Best X Alternatives"
   - Fair ranking with your brand as #1

All pages are:
- Beautifully designed with premium aesthetics
- Strategically structured for conversions
- Well-researched with accurate competitor data
- Persuasive with clear value propositions

====================
PAGE PLANNING REQUIREMENTS (CRITICAL)
====================
When planning/saving content items, you MUST provide:
1. **word_count for EACH section** - Every section in the outline needs a word count (e.g., 300-500)
2. **estimated_word_count** - Total word count for the entire page (sum of all sections)

Example outline section:
{
  "h2": "Why Choose Us",
  "key_points": ["Better pricing", "More features"],
  "word_count": 400  // ← REQUIRED
}

DO NOT skip word counts - they are essential for content planning and quality control.

====================
LANGUAGE RULES
====================
1. **CHAT**: Respond in the user's language
2. **GENERATED CONTENT**: All page content (titles, body text, CTAs) MUST be in **ENGLISH**

====================
OPERATING PROCEDURE
====================
1. Call 'create_plan' FIRST for any tool-based task
2. Execute the COMPLETE workflow in one turn
3. For page generation: Run ALL steps from research to 'save_final_page'
4. NEVER stop after just planning

====================
SKILLS:
====================
${skills.map(s => `- ${s.name}: ${s.description}`).join('\n')}

====================
SKILL INSTRUCTIONS:
====================
${skills.map(skill => `
### ${skill.name}
${skill.systemPrompt}
`).join('\n')}`;

  return basePrompt;
}

/**
 * Get skill-specific system prompt if a tool from that skill is being used
 */
export function getSkillSystemPrompt(toolId?: string): string {
  if (!toolId) {
    return getCombinedSystemPrompt();
  }

  const skill = skillRegistry.getSkillByToolId(toolId);
  if (skill) {
    return skill.systemPrompt;
  }

  return getCombinedSystemPrompt();
}

export { skillRegistry as default };
