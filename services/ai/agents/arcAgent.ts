
import { Type, Chat, FunctionDeclaration } from "@google/genai";
import { LayerAgent, ImageAttachment } from "../types";
import { generateJSON, createChatSession } from "../../geminiService";
import { SketchData } from "../../../types";
import { optimizeDesign } from "../../geometryEngine";

// --- SCHEMA ---
const ARC_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    totalAreaSqm: { type: Type.NUMBER },
    floors: { type: Type.INTEGER },
    rooms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          floor: { type: Type.INTEGER },
          floorFinish: { type: Type.STRING },
          width: { type: Type.NUMBER },
          height: { type: Type.NUMBER },
          x: { type: Type.NUMBER },
          y: { type: Type.NUMBER },
          type: { type: Type.STRING }
        },
        required: ["id", "name", "width", "height", "x", "y", "type", "floor"]
      }
    },
    elements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          roomId: { type: Type.STRING },
          floor: { type: Type.INTEGER },
          type: { type: Type.STRING },
          x: { type: Type.NUMBER },
          y: { type: Type.NUMBER },
          width: { type: Type.NUMBER },
          height: { type: Type.NUMBER },
          rotation: { type: Type.NUMBER }
        },
        required: ["id", "roomId", "type", "x", "y", "width", "height", "rotation", "floor"]
      }
    }
  },
  required: ["id", "title", "description", "totalAreaSqm", "floors", "rooms", "elements"]
};

// --- PROMPT ---
const ARC_SYSTEM_INSTRUCTION = `
ROLE: Senior Architectural CAD Technician + Space-Planning Expert.
TASK: Generate a detailed, construction-grade, fully furnished floor plan JSON.

========================
MODES OF OPERATION
========================
1. [DIGITIZE_EXACT]: 
   - The user has uploaded an image they want converted to a live blueprint.
   - **CRITICAL**: You MUST TRACE the image exactly. 
   - Map the visual geometry to a coordinate system [0,0] to [2000,2000].
   - If the user provided an AREA (e.g. 100m2), scale your coordinates so the final room sizes match that total area.
   - Do not invent rooms that are not in the image.
   - Identify every wall, door, and window in the image and recreate it.
   - If the image contains text labels (e.g. "Kitchen"), use them for the room 'name'.

2. [NEW_DESIGN_REFERENCE]:
   - The user uploaded an image as inspiration only.
   - Use the STYLE or VIBE of the image, but generate a NEW layout based on text requirements.
   - You have creative freedom to optimize the layout for flow and function.

========================
STRICT ADHERENCE PROTOCOL
========================
1) NO HALLUCINATIONS: Generate ONLY requested rooms/floors (unless in Reference mode).
2) MAIN ENTRY: Must include 'entry_door'.
3) OPEN PLAN: If requested, Living+Kitchen+Dining adjacent with large 'wall_opening'.
4) ZONING: Separate Public/Private zones.
5) FURNITURE: Every room must be fully furnished with correct 'type' enums.
6) OUTPUT: JSON matching schema.

========================
FURNITURE REQUIREMENTS
========================
- BEDROOM: 'bed_king'/'bed_single', 'nightstand' x2, 'wardrobe'
- LIVING: 'sofa', 'coffee_table', 'tv_unit'
- KITCHEN: 'stove', 'fridge', 'kitchen_sink', 'kitchen_island'
- BATHROOM: 'toilet', 'sink_single', 'shower'
`;

const PROPOSE_DESIGN_TOOL: FunctionDeclaration = {
    name: 'propose_design',
    description: 'Call this when you have gathered enough requirements to generate a blueprint.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING, description: "Comprehensive prompt detailing rooms, area, and specific layout instructions." },
            title: { type: Type.STRING, description: "Project Title." }
        },
        required: ['summary', 'title']
    }
};

export class ArcAgent implements LayerAgent {
    
    getSystemInstruction(): string {
        return `
        ROLE: Senior Lead Architect & Design Consultant.
        GOAL: Interview the client to create a blueprint.
        
        CRITICAL RULES FOR FILE UPLOADS ([MODE: DIGITIZE_EXACT]):
        1. If the user wants to "Bring to Life" (Digitize) a file, you CANNOT guess the scale.
        2. You **MUST ASK** for the **Total Area (approx sqm/sqft)** and **Number of Rooms** if the user hasn't provided it.
        3. SAY: "To scale this drawing correctly, I need to know the approximate Total Area (e.g., 150m²) and the number of bedrooms/bathrooms."
        4. **DO NOT** call 'propose_design' until you have the Area and Room Count.
        5. Once you have the info, include it EXPLICITLY in the 'summary' passed to 'propose_design' so the generator knows how to scale the coordinates.

        General Behavior:
        - Ask about terrain, style, bedrooms, open plan.
        - Analyze images if provided.
        - Call 'propose_design' only when you have sufficient data to generate a valid file.
        `;
    }

    createChat(): Chat {
        return createChatSession(this.getSystemInstruction(), [PROPOSE_DESIGN_TOOL]);
    }

    async generate(prompt: string, contextData: SketchData | null, images: ImageAttachment[]): Promise<SketchData> {
        // Prepend context about mode if present in prompt to the system instruction
        let instruction = ARC_SYSTEM_INSTRUCTION;
        
        let textPrompt = `Prompt: "${prompt}"`;
        
        // If images are provided, emphasize visual tracing in the prompt
        if (images.length > 0 && prompt.includes('DIGITIZE_EXACT')) {
            textPrompt += `\n\n[VISUAL INSTRUCTION]: An image is attached. IGNORE creative freedom. Map the lines in the image to JSON coordinates. The user has specified the scale/area in the prompt text. Use it to calculate wall lengths.`;
        }
        
        let data = await generateJSON(textPrompt, ARC_SCHEMA, instruction, 'gemini-2.5-flash', images);
        
        // Post-Processing
        data.floors = Math.max(1, Number(data.floors) || 1);
        if (data.rooms) data.rooms = data.rooms.map((r: any) => ({ ...r, floor: r.floor || 1 }));
        if (data.elements) data.elements = data.elements.map((e: any) => ({ ...e, floor: e.floor || 1 }));
        
        // Fix 0-based indexing
        if (data.rooms.some((r: any) => r.floor === 0)) {
            data.floors += 1;
            data.rooms.forEach((r: any) => r.floor += 1);
            data.elements.forEach((e: any) => e.floor += 1);
        }

        return optimizeDesign(data as SketchData);
    }
}
