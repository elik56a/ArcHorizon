
import { GoogleGenAI, Type, FunctionDeclaration, Tool, Chat } from "@google/genai";
import { SketchData } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export type DesignStyle = 'Modern' | 'Rustic' | 'Creative';

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
            
            TONE: Professional, creative, encouraging, and inquisitive. Use architectural terminology but keep it accessible.
            `,
            tools: [{ functionDeclarations: [PROPOSE_DESIGN_TOOL] }]
        }
    });
};


// --- GENERATION FUNCTIONS ---

export const generateSingleSketch = async (prompt: string, style: DesignStyle): Promise<SketchData> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
      ROLE: Senior Architectural CAD Technician.
      TASK: Generate a detailed construction-grade floor plan based on: "${prompt}".
      
      STRICT ADHERENCE PROTOCOL:
      1. **NO HALLUCINATIONS**: Generate ONLY the rooms and floors explicitly requested in the prompt. Do not add extra bedrooms, bathrooms, or floors "just in case".
      2. **EXACT COUNT**: If the prompt says "2 bedrooms", generate exactly 2.
      
      CRITICAL DESIGN STANDARDS:
      1. **REALISM**: Do not generate empty boxes. Every room must be furnished with specific CAD blocks.
      2. **STRUCTURAL LOGIC**: Walls should align. Wet areas (Kitchen/Bath) should share plumbing walls where possible.
      3. **CIRCULATION**: Ensure clear walking paths (min 90cm) between furniture.
      
      DETAILED FURNITURE REQUIREMENTS (Use these specific types):
      - **BEDROOM**: 'bed_king' or 'bed_single', plus 'nightstand' (x2), 'wardrobe' (large rect).
      - **LIVING**: 'sofa' or 'sofa_l_shape', 'coffee_table', 'tv_unit', 'armchair'.
      - **KITCHEN**: 'kitchen_island' (if space permits), 'stove', 'fridge', 'kitchen_sink' (on counter).
      - **BATHROOM**: 'toilet' (against wall), 'sink_single' or 'sink_double', 'shower' (corner or box), 'bathtub'.
      - **DINING**: 'dining_table' (include space for chairs).
      
      DIMENSIONING RULES (Unit = CM):
      - External Walls: 20-30cm thickness implied.
      - Internal Walls: 10-15cm thickness implied.
      - Doors: Standard width 80-90cm. Entry door 100cm.
      - Windows: Align with furniture layouts (e.g., not behind a tall wardrobe).
      
      OUTPUT FORMAT: Pure JSON matching the schema.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const data = JSON.parse(text) as SketchData;

    // SANITIZATION: Force numbers for critical fields to prevent UI bugs
    data.floors = Number(data.floors) || 1;
    data.rooms = data.rooms.map(r => ({
        ...r,
        floor: Number(r.floor) || 1,
        x: Number(r.x),
        y: Number(r.y),
        width: Number(r.width),
        height: Number(r.height)
    }));
    data.elements = data.elements.map(e => ({
        ...e,
        floor: Number(e.floor) || 1,
        x: Number(e.x),
        y: Number(e.y),
        width: Number(e.width),
        height: Number(e.height)
    }));
    
    return data;
  } catch (error) {
    console.error(`AI Generation Error (${style}):`, error);
    throw error;
  }
};

export const generateSketchFromImage = async (base64Data: string, mimeType: string): Promise<SketchData> => {
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

    const data = JSON.parse(text) as SketchData;
    // Sanitization for Image Gen as well
    data.floors = Number(data.floors) || 1;
    data.rooms = data.rooms.map(r => ({ ...r, floor: Number(r.floor) || 1 }));
    data.elements = data.elements.map(e => ({ ...e, floor: Number(e.floor) || 1 }));
    
    return data;
  } catch (error) {
    console.error("AI Vision Error:", error);
    throw error;
  }
};

export const generateSketchFromDXF = async (dxfContent: string): Promise<SketchData> => {
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
        const data = JSON.parse(text) as SketchData;
        
        // Sanitization for DXF Gen
        data.floors = Number(data.floors) || 1;
        data.rooms = data.rooms.map(r => ({ ...r, floor: Number(r.floor) || 1 }));
        data.elements = data.elements.map(e => ({ ...e, floor: Number(e.floor) || 1 }));

        return data;
    } catch (error) {
        console.error("AI DXF Parsing Error:", error);
        throw error;
    }
}
