
import { GoogleGenAI, Type, FunctionDeclaration, Tool, Chat } from "@google/genai";
import { SketchData } from '../types';
import { optimizeDesign } from './geometryEngine';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export type DesignStyle = 'Modern' | 'Rustic' | 'Creative';

export interface ImageAttachment {
  mimeType: string;
  data: string;
}

// --- HELPER: RETRY LOGIC ---
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, retries = 3, backoff = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Retry on network errors (xhr/fetch), timeouts, or 5xx server errors
      const msg = error.message?.toLowerCase() || '';
      const isNetworkError = msg.includes('xhr') || msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch');
      const isServerError = error.code === 500 || error.code === 503 || error.status === 500 || error.status === 503;
      
      if (isNetworkError || isServerError) {
        console.warn(`Gemini API Attempt ${i + 1} failed. Retrying in ${backoff}ms...`, error);
        await wait(backoff);
        backoff *= 2; // Exponential backoff
        continue;
      }
      throw error; // Throw immediately for other errors (e.g. 400 Bad Request)
    }
  }
  throw lastError;
}

// --- HELPER: DATA SANITIZATION ---
const sanitizeData = (data: SketchData): SketchData => {
    // 1. Ensure numeric types for geometry
    // Note: We use Number() directly without || fallback initially to detect 0
    data.floors = Math.max(1, Number(data.floors) || 1);
    
    data.rooms = data.rooms.map(r => ({
        ...r,
        x: Number(r.x),
        y: Number(r.y),
        width: Number(r.width),
        height: Number(r.height),
        floor: !isNaN(Number(r.floor)) ? Number(r.floor) : 1
    }));

    data.elements = data.elements.map(e => ({
        ...e,
        x: Number(e.x),
        y: Number(e.y),
        width: Number(e.width),
        height: Number(e.height),
        floor: !isNaN(Number(e.floor)) ? Number(e.floor) : 1
    }));

    // 2. Fix 0-based indexing (AI often likes 0 for Ground Floor)
    // If we detect any room or element on floor 0, we shift EVERYTHING up by 1.
    const hasZeroFloor = data.rooms.some(r => r.floor === 0) || data.elements.some(e => e.floor === 0);
    
    if (hasZeroFloor) {
        console.log("Detected 0-based floor indexing. Shifting all floors by +1.");
        data.floors += 1;
        data.rooms.forEach(r => r.floor += 1);
        data.elements.forEach(e => e.floor += 1);
    }

    return data;
};

// --- SCHEMA DEFINITIONS ---
const RESPONSE_SCHEMA = {
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
          floorFinish: { type: Type.STRING, enum: ['tiled', 'wood', 'carpet', 'concrete', 'grass', 'paved', 'marble'] },
          width: { type: Type.NUMBER },
          height: { type: Type.NUMBER },
          x: { type: Type.NUMBER },
          y: { type: Type.NUMBER },
          type: { type: Type.STRING }
        },
        required: ["id", "name", "width", "height", "x", "y", "type", "floor"]
      }
    },
    connections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          from: { type: Type.STRING },
          to: { type: Type.STRING },
          type: { type: Type.STRING }
        },
        required: ["from", "to", "type"]
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

// --- TOOLS ---
const PROPOSE_DESIGN_TOOL: FunctionDeclaration = {
    name: 'propose_design',
    description: 'Call this when you have gathered enough requirements from the user to generate a blueprint. Do not call this immediately. Ask questions first.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING, description: "A comprehensive architectural prompt summarizing all user requirements, style, and constraints." },
            title: { type: Type.STRING, description: "A catchy title for the project." }
        },
        required: ['summary', 'title']
    }
};

// --- ARCHITECT CHAT ---

export const createArchitectSession = (): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `
            ROLE: Senior Lead Architect & Design Consultant.
            GOAL: Interview the client (user) to understand their vision before creating a blueprint.
            
            BEHAVIOR:
            1. **DO NOT** generate a plan immediately. Start by asking about their vision.
            2. **CONSULT**: Ask 1-2 targeted questions at a time (e.g., "What is the terrain like?", "How many bedrooms?", "Do you prefer open plan?").
            3. **STYLE**: Ask about aesthetic preferences (Modern, Rustic, Industrial, etc.).
            4. **IMAGES**: If the user provides images, analyze them for style cues and acknowledge them specificially.
            5. **VERIFICATION**: Before calling 'propose_design', summarize the *exact* list of rooms and floors you are about to generate and ask the user to confirm.
            6. **CONFIRMATION**: Once confirmed, call the 'propose_design' tool.
            7. **LAYOUT STRATEGY**: Prioritize open-plan layouts (Kitchen/Living/Dining merged) unless the user explicitly asks for closed rooms.
            
            TONE: Professional, creative, encouraging, and inquisitive. Use architectural terminology but keep it accessible.
            `,
            tools: [{ functionDeclarations: [PROPOSE_DESIGN_TOOL] }]
        }
    });
};


// --- GENERATION FUNCTIONS ---

export const generateSingleSketch = async (prompt: string, style: DesignStyle, images: ImageAttachment[] = []): Promise<SketchData> => {
  return withRetry(async () => {
    try {
      const textPrompt = `
ROLE: Senior Architectural CAD Technician + Space-Planning Expert.
TASK: Generate a detailed, construction-grade, fully furnished floor plan JSON based on: "${prompt}".
CONTEXT: If images are provided, treat them as authoritative constraints for style, layout, orientation, or site edges.

========================
STRICT ADHERENCE PROTOCOL (NON-NEGOTIABLE)
========================
1) NO HALLUCINATIONS:
   - Generate ONLY rooms/floors explicitly requested.
   - If a room type is not requested, do not add it unless it is a REQUIRED SUPPORT ROOM listed below.

2) EXACT COUNT:
   - If prompt says "2 bedrooms", generate exactly 2 bedrooms, no more, no less.
   - Same for bathrooms, floors, parking spots, etc.

3) REQUIRED SUPPORT ROOMS (Allowed even if not named):
   - If prompt includes "parking/garage", you may add a mudroom/entry buffer.
   - If prompt includes "2+ floors", stairs are mandatory.
   - Otherwise: do NOT add extra rooms.

4) MAIN ENTRY PLACEMENT (CRITICAL):
   - MUST include exactly one 'entry_door' on an exterior wall.
   - Place entry logically near street/parking access.
   - Entry must lead into a Foyer OR directly into Living (but not into Bedroom/Bathroom/Kitchen).

5) OPEN PLAN PROTOCOL (CRITICAL):
   If Open Plan / Open Concept / Common Space requested:
   - Living + Kitchen + Dining must be directly adjacent (touching).
   - No doors between them.
   - Mandatory internal 'wall_opening' with Width > 300 cm on shared boundary.
   - Forbidden: wall_opening on exterior perimeter walls.

6) FLOORS & STAIRS:
   - Floors use INTEGER numbering starting at 1.
   - If floors >= 2: include 'stairs' element/room, aligned vertically between floors.

========================
ARCHITECTURAL HARD RULES (10-YEAR ARCHITECT LEVEL)
========================
1) ZONING / PRIVACY:
   - Separate PUBLIC zone (Living/Dining/Kitchen/Entry) from PRIVATE zone (Bedrooms).
   - Bedrooms must NOT open directly into Living/Kitchen/Dining.
   - Access bedrooms through a hall/transition space.

2) FUNCTIONAL ADJACENCIES:
   - Kitchen adjacent to Dining.
   - Guest/Shared Bathroom must be near public zone but not open directly into Dining/Living.
   - Laundry (if requested) near bedrooms OR mudroom/entry if designed for dirty-use logic.

3) BATHROOM VISIBILITY RULE:
   - No bathroom door may face directly into Dining or Living.
   - If a bathroom is near public zone, it must be tucked via a short hall or offset wall.

4) CIRCULATION & CLEARANCES:
   - Main circulation paths >= 90 cm clear width.
   - Space between sofa/coffee_table or bed/side furniture allows passage (>= 60 cm).
   - Avoid dead-end corridors longer than 300 cm unless explicitly required.

5) FURNITURE-FIRST SIZING (REALISM):
   - Every room must be sized to fit its mandatory furniture with clearances.
   - Example:
     * Bedrooms must fit at least queen/king bed + 2 nightstands + wardrobe with 60–90 cm side clearance.
     * Dining must allow table + chair pullout clearance (>= 90 cm behind chairs).

6) WINDOW LOGIC (IF WINDOWS ARE IN SCHEMA):
   - Place windows on exterior walls of habitable rooms (Living/Bedrooms/Kitchen/Dining).
   - At least one operable window per habitable room.
   - Do not place tall furniture (wardrobe, fridge, tv_unit) blocking windows.
   - Avoid placing bathroom windows on public-facing walls at eye level; prefer high/frosted or corner positions.

7) WET AREA GROUPING:
   - Kitchens, bathrooms, laundry should share plumbing walls when possible.
   - Prefer stacking wet rooms between floors (vertical alignment).

8) FORM SIMPLICITY:
   - Avoid unnecessary exterior indentations/zigzags unless prompt requires.
   - Compact, clean perimeter is preferred.

========================
CRITICAL DESIGN STANDARDS
========================
1) REALISM:
   - No empty boxes. Every room furnished.
   - Furniture placed plausibly (not floating, not overlapping walls).

2) STRUCTURAL LOGIC:
   - Walls align across rooms and between floors.
   - Door/window openings must be on walls and centered where logical.

3) DOOR PLACEMENT:
   - Doors must sit exactly on boundary lines between rooms.
   - Standard interior door width: 80–90 cm; entry door: 100 cm.
   - Door swings must not collide with furniture or block main circulation.

========================
DETAILED FURNITURE REQUIREMENTS (Use these exact types)
========================
- BEDROOM:
  'bed_king' or 'bed_single' + 'nightstand' x2 + 'wardrobe'
- LIVING:
  'sofa' or 'sofa_l_shape' + 'coffee_table' + 'tv_unit' + 'armchair'
- KITCHEN:
  'stove' + 'fridge' + 'kitchen_sink' (+ 'kitchen_island' if space permits with 100cm circulation around island)
- BATHROOM:
  'toilet' against wall + 'sink_single'/'sink_double' + 'shower' corner/box (+ 'bathtub' if prompt requests)
- DINING:
  'dining_table' with chair clearance
- ENTRY:
  'entry_door' mandatory
- GARAGE/PARKING:
  room type 'parking', name 'Garage' if enclosed, 'Driveway' if open.
  Must include 'car' element x1 or x2 per prompt.
- POOL:
  room type 'pool'

========================
DIMENSIONING RULES (Unit = CM)
========================
- External Walls: 25 cm thick implied.
- Internal Walls: 20 cm thick implied.
- Doors: interior 80–90 cm; entry 100 cm.
- Clear paths >= 90 cm.

OUTPUT FORMAT:
- Pure JSON matching the schema.
- No markdown, no explanations, no extra keys.
      `;

      const parts: any[] = [{ text: textPrompt }];
      images.forEach(img => {
          parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      
      let data = JSON.parse(text) as SketchData;

      // SANITIZATION: Fix potential 0-based floor index bugs from LLM
      data = sanitizeData(data);
      
      // RUN GEOMETRY ENGINE (The "Architect" Reviewer)
      const optimizedData = optimizeDesign(data);

      return optimizedData;
    } catch (error) {
      console.error(`AI Generation Error (${style}):`, error);
      throw error;
    }
  });
};

export const generateSketchFromImage = async (base64Data: string, mimeType: string): Promise<SketchData> => {
  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            },
            {
              text: `
              ACT AS: Lead BIM Modeler.
              TASK: Vectorize this raster floor plan into a CAD-ready JSON format.
              
              REQUIREMENTS:
              1. **PRECISION**: Trace walls and rooms exactly.
              2. **COMPONENT RECOGNITION**: Identify specific furniture (Toilets, Beds, Sofas) and use the correct 'type' enum.
              3. **SCALE**: Estimate scale based on standard door widths (90cm).
              4. **FLOORS**: Start numbering floors at 1.
              `
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");

      let data = JSON.parse(text) as SketchData;
      
      // SANITIZATION
      data = sanitizeData(data);
      
      const optimizedData = optimizeDesign(data);
      return optimizedData;
    } catch (error) {
      console.error("AI Vision Error:", error);
      throw error;
    }
  });
};

export const generateSketchFromDXF = async (dxfContent: string): Promise<SketchData> => {
    return withRetry(async () => {
        try {
            const contentSample = dxfContent.length > 500000 ? dxfContent.substring(0, 500000) + "...[TRUNCATED]" : dxfContent;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `
                ACT AS: Senior CAD Interoperability Engineer.
                TASK: Convert DXF entities to a semantic Architectural JSON Schema.
                INPUT: \`\`\`${contentSample}\`\`\`
                `,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: RESPONSE_SCHEMA
                }
            });

            const text = response.text;
            if (!text) throw new Error("No response from AI");
            let data = JSON.parse(text) as SketchData;
            
            // SANITIZATION
            data = sanitizeData(data);

            const optimizedData = optimizeDesign(data);
            return optimizedData;
        } catch (error) {
            console.error("AI DXF Parsing Error:", error);
            throw error;
        }
    });
}

export const generateRealisticRender = async (data: SketchData, blueprintImage: string): Promise<string> => {
    return withRetry(async () => {
        const description = `
        TASK: Architectural Visualization - Image to Image.
        INPUT: A precise 2D floor plan layout image.
        INSTRUCTION: Generate a high-fidelity, photorealistic top-down render that MATCHES THE INPUT LINE DRAWING EXACTLY (1:1).
        
        STRICT CONSTRAINTS:
        1. **GEOMETRY LOCK**: Do NOT move, add, or remove walls, doors, or windows. The layout is final.
        2. **FURNITURE MATCH**: Furnish the rooms exactly where the boxes are in the drawing. If there is a sofa box, render a photorealistic sofa there.
        3. **STYLE**: Modern Minimalist, Warm Lighting, Hardwood Floors.
        4. **PERSPECTIVE**: Strictly Top-Down (Plan View). No angled isometric views.
        
        ROOMS: ${data.rooms.map(r => r.name).join(', ')}.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/png', data: blueprintImage } },
                    { text: description }
                ]
            }
        });

        let base64Image = '';
        
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    base64Image = part.inlineData.data;
                    break;
                }
            }
        }

        if (!base64Image) {
            throw new Error("No image generated.");
        }

        return `data:image/png;base64,${base64Image}`;
    });
};
    