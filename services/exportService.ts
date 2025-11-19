
import { SketchData } from '../types';

export const downloadSVG = (svgElement: SVGSVGElement, filename: string) => {
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svgElement);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadPDF = (svgElement: SVGSVGElement, filename: string) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const img = new Image();
  
  const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    const scale = 3; 
    canvas.width = svgElement.clientWidth * scale;
    canvas.height = svgElement.clientHeight * scale;
    if (ctx) {
      ctx.scale(scale, scale);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      try {
        import('jspdf').then((module) => {
             const jsPDF = module.default;
             const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width / scale, canvas.height / scale]
             });
             
             const imgData = canvas.toDataURL('image/png');
             pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / scale, canvas.height / scale);
             pdf.save(`${filename}.pdf`);
             URL.revokeObjectURL(url);
        });
      } catch (e) {
        console.error("PDF Generation failed", e);
      }
    }
  };
  img.src = url;
};

/**
 * PROFESSIONAL DXF GENERATOR (AC1009 / R12)
 * Includes STYLE table for professional fonts and DIMS layer.
 */
export const downloadDXF = (data: SketchData, filename: string) => {
  const lines: string[] = [];
  
  const add = (code: number, value: string | number) => {
    lines.push(code.toString());
    lines.push(value.toString());
  };

  // --- HEADER ---
  add(0, "SECTION");
  add(2, "HEADER");
  add(9, "$ACADVER");
  add(1, "AC1009"); 
  add(9, "$INSUNITS");
  add(70, 4); // Millimeters
  add(9, "$DIMASZ"); // Arrow size
  add(40, 10.0);
  add(9, "$DIMTXT"); // Text height
  add(40, 14.0);
  add(0, "ENDSEC");

  // --- TABLES ---
  add(0, "SECTION");
  add(2, "TABLES");
  
  // 1. Linetypes (Minimal)
  add(0, "TABLE");
  add(2, "LTYPE");
  add(0, "LTYPE");
  add(2, "CONTINUOUS");
  add(70, 0);
  add(3, "Solid line");
  add(72, 65);
  add(73, 0);
  add(40, 0.0);
  add(0, "ENDTAB");

  // 2. Layers
  add(0, "TABLE");
  add(2, "LAYER");
  const defineLayer = (name: string, color: number) => {
    add(0, "LAYER");
    add(2, name);
    add(70, 0);
    add(62, color);
    add(6, "CONTINUOUS");
  };
  defineLayer("0", 7);        // White
  defineLayer("WALLS", 7);    // White/Black
  defineLayer("FURNITURE", 8); // Gray
  defineLayer("DOORS", 1);    // Red
  defineLayer("TEXT", 2);     // Yellow
  defineLayer("DIMS", 3);     // Green
  add(0, "ENDTAB");

  // 3. Styles (Fixes "Kid Draw" font issue)
  add(0, "TABLE");
  add(2, "STYLE");
  add(0, "STYLE");
  add(2, "STANDARD");
  add(70, 0);
  add(40, 0.0); // Fixed height 0 (allows override)
  add(41, 1.0); // Width factor
  add(50, 0.0); // Oblique
  add(71, 0);   // Generation flags
  add(42, 10.0); // Last height used
  add(3, "arial.ttf"); // Professional Font
  add(4, "");   // Bigfont file
  add(0, "ENDTAB");

  add(0, "ENDSEC");

  // --- ENTITIES ---
  add(0, "SECTION");
  add(2, "ENTITIES");

  // Helper to invert Y (Canvas +Y is down, CAD +Y is up)
  const invertY = (y: number) => -y;

  // 1. DRAW ROOMS (WALLS)
  data.rooms.forEach(room => {
    const x = room.x;
    const y = invertY(room.y);
    
    // Wall Polyline
    drawPolylineR12(add, "WALLS", [
      [x, y],
      [x + room.width, y],
      [x + room.width, y - room.height],
      [x, y - room.height]
    ], true);

    // Room Label
    add(0, "TEXT");
    add(8, "TEXT");
    add(7, "STANDARD"); // Use the professional style
    add(10, x + room.width / 2); 
    add(20, y - room.height / 2); 
    add(40, 14); // Height
    add(1, room.name.toUpperCase());
    add(72, 4); // Middle Alignment
    add(11, x + room.width / 2);
    add(21, y - room.height / 2);

    // Area Label
    add(0, "TEXT");
    add(8, "TEXT");
    add(7, "STANDARD");
    add(10, x + room.width / 2); 
    add(20, y - room.height / 2 - 20); 
    add(40, 8); 
    add(1, `${Math.round((room.width * room.height) / 10000)} SQM`);
    add(72, 4); 
    add(11, x + room.width / 2);
    add(21, y - room.height / 2 - 20);
  });

  // 2. DRAW ELEMENTS (Windows, Furniture, Doors)
  data.elements.forEach(el => {
    const layer = ['door', 'window', 'entry_door'].includes(el.type) ? "DOORS" : "FURNITURE";
    const cx = el.x + el.width / 2;
    const cy = invertY(el.y + el.height / 2);
    const w = el.width;
    const h = el.height;
    // Simple rotation handling for rects (if 90/270 swap w/h)
    const effectiveW = (el.rotation === 90 || el.rotation === 270) ? h : w;
    const effectiveH = (el.rotation === 90 || el.rotation === 270) ? w : h;
    const x = el.x; // Simplified positioning for R12, assumes 0 rotation visual logic
    const y = invertY(el.y);

    if (el.type === 'window') {
       // Draw Frame
       drawPolylineR12(add, "DOORS", [[x,y], [x+w,y], [x+w,y-h], [x,y-h]], true);
       // Draw Glass (Line in middle)
       add(0, "LINE"); add(8, "DOORS");
       add(10, x); add(20, y - h/2);
       add(11, x + w); add(21, y - h/2);
    } 
    else if (el.type.includes('door')) {
       // Door opening
       drawPolylineR12(add, "DOORS", [[x,y], [x+w,y], [x+w,y-h], [x,y-h]], true);
       // Swing arc (approximated as line for R12 simplicity or circle)
       add(0, "LINE"); add(8, "DOORS");
       add(10, x); add(20, y);
       add(11, x + w); add(21, y - h); // Diagonal indicating swing
    }
    else if (el.type === 'toilet') {
       // Tank
       drawPolylineR12(add, layer, [[x,y], [x+w,y], [x+w,y-15], [x,y-15]], true);
       // Bowl
       drawPolylineR12(add, layer, [[x+w/4, y-15], [x+w*0.75, y-15], [x+w*0.75, y-h], [x+w/4, y-h]], true);
    }
    else {
       // Generic Furniture Box
       drawPolylineR12(add, layer, [[x,y], [x+w,y], [x+w,y-h], [x,y-h]], true);
    }
  });

  // 3. GENERATE DIMENSIONS (Auto-Dimensioning)
  if (data.rooms.length > 0) {
      const minX = Math.min(...data.rooms.map(r => r.x));
      const maxX = Math.max(...data.rooms.map(r => r.x + r.width));
      const minY = Math.min(...data.rooms.map(r => r.y));
      const maxY = Math.max(...data.rooms.map(r => r.y + r.height));

      // Top Overall Dimension
      drawDimLine(add, minX, invertY(minY - 50), maxX, invertY(minY - 50), (maxX - minX).toString());
      
      // Left Overall Dimension
      drawDimLine(add, minX - 50, invertY(minY), minX - 50, invertY(maxY), (maxY - minY).toString());
  }

  add(0, "ENDSEC");
  add(0, "EOF");

  const dxfString = lines.join("\n");
  const blob = new Blob([dxfString], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.dxf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- R12 HELPERS ---

const drawPolylineR12 = (add: any, layer: string, pts: number[][], closed: boolean) => {
    add(0, "POLYLINE");
    add(8, layer);
    add(66, 1); // Vertices follow
    add(70, closed ? 1 : 0);
    add(40, 0); // Start width
    add(41, 0); // End width
    
    pts.forEach(p => {
        add(0, "VERTEX");
        add(8, layer);
        add(10, p[0]);
        add(20, p[1]);
        add(30, 0.0);
    });
    add(0, "SEQEND");
};

// Draws a dimension line with ticks and text
const drawDimLine = (add: any, x1: number, y1: number, x2: number, y2: number, text: string) => {
    // Main Line
    add(0, "LINE"); add(8, "DIMS"); add(10, x1); add(20, y1); add(11, x2); add(21, y2);

    // Ticks (45 degree small lines)
    const tickSize = 5;
    add(0, "LINE"); add(8, "DIMS"); add(10, x1-tickSize); add(20, y1-tickSize); add(11, x1+tickSize); add(21, y1+tickSize);
    add(0, "LINE"); add(8, "DIMS"); add(10, x2-tickSize); add(20, y2-tickSize); add(11, x2+tickSize); add(21, y2+tickSize);

    // Text
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const isVertical = Math.abs(x1 - x2) < 1;
    const rotation = isVertical ? 90 : 0;

    add(0, "TEXT");
    add(8, "DIMS");
    add(7, "STANDARD");
    add(10, mx); 
    add(20, my + 5); // Offset text slightly
    add(40, 10); // Height
    add(1, text);
    add(50, rotation);
    add(72, 4); // Middle
    add(11, mx);
    add(21, my + 5);
};
