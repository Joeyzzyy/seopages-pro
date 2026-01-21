import { SkillRegistry } from './types';

// System Skills
import { planningSkill } from './skill-system/planning.skill';

// Build Skills - Alternative Page Generator (V1 & V2)
import { alternativePageGeneratorSkill } from './skill-build/alternative-page-generator.skill';
import { alternativePageGeneratorV2Skill } from './skill-build/alternative-page-generator-v2.skill';

import { Skill } from './types';

/**
 * Global Logic Skill
 * Represents the core reasoning and mandatory rules of the AI Agent
 */
export const coreLogicSkill: Skill = {
  id: 'agent-core-logic',
  name: 'System: Core Logic',
  description: 'Core reasoning rules for the Alternative Page Generator Agent',
  systemPrompt: `====================
MANDATORY PLANNING-FIRST RULE
====================

IF the user's request requires you to call ANY tool:
→ You MUST call 'create_plan' as your FIRST tool call
→ NO EXCEPTIONS

====================
ALTERNATIVE PAGE GENERATION WORKFLOW:
====================

This tool specializes in generating TOP-TIER Alternative Pages (competitor comparison landing pages).

When generating an Alternative Page:

**V2 (Recommended for complex pages):**
1. Fetch content item details and site context (including competitor logos)
2. Research competitor features and differentiators
3. Generate each section independently using section tools
4. Assemble all sections into complete HTML
5. Integrate with site header/footer
6. Save the final page

**V1 (Simple pages):**
1. Fetch content item details and site context
2. Research competitor features and differentiators
3. Generate all content as markdown
4. Assemble HTML in one step
5. Save the final page

An Alternative Page should:
- Clearly highlight why YOUR product is better
- Include strategic CTAs throughout
- Feature professional comparison tables
- Use persuasive, benefit-focused copy
- Have beautiful, modern design`,
  tools: {},
  enabled: true,
  metadata: {
    category: 'system',
    priority: 'highest',
    solution: 'Core logic for Alternative Page Generator - focused on creating premium competitor comparison pages.',
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
skillRegistry.register(alternativePageGeneratorV2Skill);

/**
 * Get system prompt by combining all enabled skills
 */
export function getCombinedSystemPrompt(userId?: string, conversationId?: string): string {
  const skills = skillRegistry.getEnabled();
  
  const basePrompt = `You are Alternative Page Generator, an AI assistant specialized in creating TOP-TIER Alternative/Comparison landing pages.

CURRENT CONTEXT:
${userId ? `- Current User ID: ${userId}` : ''}
${conversationId ? `- Current Conversation ID: ${conversationId}` : ''}
- Current Time: ${new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'long' })} (UTC)

====================
YOUR SPECIALTY
====================
You excel at generating professional Alternative Pages - landing pages that compare your product against competitors and convince visitors to switch. These pages are:
- Beautifully designed with premium aesthetics
- Strategically structured for conversions
- Well-researched with accurate competitor data
- Persuasive with clear value propositions

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
