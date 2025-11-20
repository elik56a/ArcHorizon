
import { GoogleGenAI, Type } from "@google/genai";
import { SketchData } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export type DesignStyle = 'Modern' | 'Rustic' | 'Creative';

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

export const generateSingleSketch = async (prompt: string, style: DesignStyle): Promise<SketchData> => {
  try {
    const stylePrompt = getStyleInstruction(style);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
      ROLE: Senior Architectural CAD Technician.
      TASK: Generate a detailed construction-grade floor plan based on: "${prompt}".
      
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
      
      LAYOUT GUIDANCE:
      - Create distinct 'zones' but allow flow.
      - Use 'corridor' rooms to connect private areas.
      - Ensure balconies ('balcony') are accessible via 'sliding_door' or 'door'.
      
      OUTPUT FORMAT: Pure JSON matching the schema.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as SketchData;
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
            2. **COMPONENT RECOGNITION**: Identify specific furniture (Toilets, Beds, Sofas) and use the correct 'type' enum (e.g., 'toilet', 'bed_queen').
            3. **SCALE**: Estimate scale based on standard door widths (90cm).
            4. **DETAILS**: Include 'nightstand', 'wardrobe', 'kitchen_sink' if visible.
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

    return JSON.parse(text) as SketchData;
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
            
            INPUT:
            \`\`\`
            ${contentSample}
            \`\`\`
            
            INSTRUCTION: Extract Rooms and Furniture blocks. Map DXF blocks to specific types like 'toilet', 'bed_king', 'sofa'.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: RESPONSE_SCHEMA
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");

        return JSON.parse(text) as SketchData;

    } catch (error) {
        console.error("AI DXF Parsing Error:", error);
        throw error;
    }
}

const getStyleInstruction = (style: DesignStyle): string => {
  switch(style) {
    case 'Modern': return "Style: CONTEMPORARY. Clean lines, open plan, large glazing, kitchen islands, master suites with walk-in wardrobes.";
    case 'Rustic': return "Style: TRADITIONAL/COUNTRY. Distinct rooms, thick walls, cozy layout, large dining areas, fireplaces.";
    case 'Creative': return "Style: ARCHITECTURAL AVANT-GARDE. Courtyards, L-shapes, U-shapes, indoor-outdoor flow, specific furniture detailing.";
    default: return "Standard professional layout.";
  }
};
