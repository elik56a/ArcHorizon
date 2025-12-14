
import { Type, Chat, FunctionDeclaration } from "@google/genai";
import { LayerAgent, ImageAttachment } from "../types";
import { generateJSON, createChatSession } from "../../geminiService";
import { SketchData } from "../../../types";

// --- PLUMBING SCHEMA ---
// We only need to generate elements, but we return a partial SketchData structure
const PLUMBING_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    elements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, enum: [
              'water_supply_line', 'waste_line', 'vent_stack', 'shaft', 
              'floor_drain', 'slope_arrow', 'toilet', 'sink_single', 
              'sink_double', 'shower', 'bathtub', 'kitchen_sink', 'washer'
          ]},
          x: { type: Type.NUMBER },
          y: { type: Type.NUMBER },
          width: { type: Type.NUMBER },
          height: { type: Type.NUMBER },
          rotation: { type: Type.NUMBER },
          floor: { type: Type.INTEGER }
        },
        required: ["id", "type", "x", "y", "width", "height", "rotation", "floor"]
      }
    }
  },
  required: ["elements"]
};

// --- SYSTEM INSTRUCTION ---
const PLUMBING_SYSTEM_INSTRUCTION = `
ROLE: Senior MEP Engineer (Plumbing Specialist).
TASK: Generate a plumbing layout overlay based on an existing architectural floor plan.

INPUT CONTEXT: You will receive a list of Rooms (names, types, coordinates) and existing Fixtures.
GOAL: 
1. Place 'water_supply_line' (blue/thin) connecting water sources to fixtures.
2. Place 'waste_line' (green/thick) connecting fixtures to a main stack.
3. Place 'vent_stack' or 'shaft' in logical vertical chases (usually near bathrooms/kitchens).
4. Add 'floor_drain' in showers and utility rooms.
5. Ensure wet areas (Kitchen/Bath) have necessary piping.

RULES:
- Pipes should run inside walls (or parallel to them) where possible.
- Main stacks should be vertical.
- Use 'water_supply_line' width=100, height=5.
- Use 'waste_line' width=100, height=10.
- Do NOT regenerate the architectural walls. Only generate the PLUMBING elements.
`;

const PROPOSE_DESIGN_TOOL: FunctionDeclaration = {
    name: 'propose_design',
    description: 'Call this when you have gathered enough plumbing requirements.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING, description: "Technical summary of plumbing system (e.g. materials, pressure)." },
            title: { type: Type.STRING, description: "System Title (e.g. 'PEX Manifold Layout')." }
        },
        required: ['summary', 'title']
    }
};

export class PlumbingAgent implements LayerAgent {

    getSystemInstruction(): string {
        return `
        ROLE: Senior Plumbing Engineer.
        GOAL: Consult on water supply, sewage, and drainage systems.
        
        BEHAVIOR:
        1. Ask technical questions: "PEX or Copper?", "Gravity or Pressurized?", "City water or Well?".
        2. Suggest efficiency: "Should we add a greywater recycling loop?".
        3. Identify wet walls: Group plumbing to shared walls.
        4. Call 'propose_design' when specs are clear.
        `;
    }

    createChat(): Chat {
        return createChatSession(this.getSystemInstruction(), [PROPOSE_DESIGN_TOOL]);
    }

    async generate(prompt: string, contextData: SketchData | null, images: ImageAttachment[]): Promise<SketchData> {
        if (!contextData) throw new Error("Plumbing requires an architectural base layer.");

        // 1. Contextualize the prompt with the existing architecture
        // We abstract the architecture into a simplified text description to save tokens and give semantic meaning
        const roomContext = contextData.rooms.map(r => 
            `Room ${r.name} (${r.type}) at [${r.x}, ${r.y}, w:${r.width}, h:${r.height}] Floor ${r.floor}`
        ).join('\n');

        const fixtureContext = contextData.elements
            .filter(e => ['toilet', 'sink', 'shower', 'bath', 'kitchen', 'washer'].some(k => e.type.includes(k)))
            .map(e => `Fixture ${e.type} at [${e.x}, ${e.y}]`)
            .join('\n');

        const fullPrompt = `
        CONTEXT ARCHITECTURE:
        ${roomContext}
        
        EXISTING FIXTURES:
        ${fixtureContext}
        
        USER REQUEST:
        ${prompt}
        
        INSTRUCTION:
        Generate the pipe network (supply and waste) connecting these fixtures.
        Connect waste lines to a main stack/shaft.
        `;

        // 2. Call AI
        const result = await generateJSON(fullPrompt, PLUMBING_SCHEMA, PLUMBING_SYSTEM_INSTRUCTION, 'gemini-2.5-flash', images);

        // 3. Merge/Format
        // The result only contains 'elements'. We wrap it in a partial SketchData.
        return {
            ...contextData, // Return structure, but mainly we just want the elements array from the result
            elements: result.elements.map((e: any) => ({
                ...e,
                id: `plumb-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
                layerId: 'generated-plumbing' // Will be reassigned by the store
            }))
        };
    }
}
