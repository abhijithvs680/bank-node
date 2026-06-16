import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ============ TYPE DEFINITIONS ============

export interface FlexItemContent {
  text: string;
  fontSize: number;
  fontStyle: 'normal' | 'bold';
  color: [number, number, number];
  lineHeight?: number;
  marginTop?: number;
}

export interface FlexItem {
  content: FlexItemContent[];
  textAlign: 'left' | 'center' | 'right';
  marginTop?: number;
  image?: { src: string; height: number; width?: number };
}

export interface FlexContainer {
  justifyContent: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  alignItems: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  items: FlexItem[];
  borderBottom?: { width: number; color: [number, number, number] };
  borderTop?: { width: number; color: [number, number, number] };
  gap?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
}

export interface ContainerStyles {
  backgroundColor?: [number, number, number];
  borderBottomColor?: [number, number, number];
  borderBottomWidth?: number;
  borderTopColor?: [number, number, number];
  borderTopWidth?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  borderRadius?: number;
  opacity?: number;
  boxShadow?: { 
    offsetX: number; 
    offsetY: number; 
    blur: number; 
    color: [number, number, number];
    opacity: number;
  };
}

export interface TableCell {
  widthPercent: number;
  content: string[];
  styles: { fontSize: number; fontStyle: 'normal' | 'bold'; color: [number, number, number] }[];
  image?: { src: string; height: number };
  nestedTable?: ParsedTableRow[];
  bgColor?: [number, number, number];
  borderColor?: [number, number, number];
  borderWidth?: number;
  verticalAlign?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface ParsedTableRow {
  cells: TableCell[];
  bgColor?: [number, number, number];
}

export interface ImageData {
  dataUrl: string;
  width: number;
  height: number;
}

export interface RenderArea {
  y: number;
  height: number;
  margin: number;
  pageWidth: number;
  pageHeight: number;
}

// ============ COLOR UTILITIES ============

export const parseColor = (colorStr: string): [number, number, number] => {
  if (!colorStr) return [44, 62, 80];
  
  colorStr = colorStr.trim().toLowerCase();
  
  if (colorStr.startsWith('rgb')) {
    const match = colorStr.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (match) return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }
  
  if (colorStr.startsWith('#')) {
    const hex = colorStr.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16)
      ];
    }
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16)
      ];
    }
  }
  
  const namedColors: Record<string, [number, number, number]> = {
    'red': [255, 0, 0], 'pink': [219, 112, 147], 'deeppink': [255, 20, 147],
    'hotpink': [255, 105, 180], 'lightpink': [255, 182, 193], 'palevioletred': [219, 112, 147],
    'magenta': [255, 0, 255], 'fuchsia': [255, 0, 255], 'purple': [128, 0, 128],
    'violet': [238, 130, 238], 'orchid': [218, 112, 214], 'mediumvioletred': [199, 21, 133],
    'black': [0, 0, 0], 'white': [255, 255, 255], 'gray': [128, 128, 128],
    'grey': [128, 128, 128], 'darkgray': [169, 169, 169], 'darkgrey': [169, 169, 169],
    'lightgray': [211, 211, 211], 'lightgrey': [211, 211, 211], 'maroon': [128, 0, 0],
    'brown': [139, 69, 19], 'blue': [0, 0, 255], 'navy': [0, 0, 128],
    'teal': [0, 128, 128], 'cyan': [0, 255, 255], 'green': [0, 128, 0],
    'lime': [0, 255, 0], 'olive': [128, 128, 0], 'yellow': [255, 255, 0],
    'gold': [255, 215, 0], 'orange': [255, 165, 0], 'darkorange': [255, 140, 0],
    'coral': [255, 127, 80], 'tomato': [255, 99, 71], 'crimson': [220, 20, 60],
    'indianred': [205, 92, 92], 'firebrick': [178, 34, 34], 'darkred': [139, 0, 0],
  };
  
  return namedColors[colorStr] || [44, 62, 80];
};

// ============ CSS PARSING UTILITIES ============

export const parseContainerStyles = (html: string): ContainerStyles => {
  if (typeof window === 'undefined' || !html) return {};
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const container = doc.querySelector('div');
  
  if (!container) return {};
  
  const style = container.getAttribute('style') || '';
  return parseInlineStyles(style);
};

export const parseInlineStyles = (style: string): ContainerStyles => {
  const result: ContainerStyles = {};
  
  // Background
  const bgMatch = style.match(/background(?:-color)?\s*:\s*(#?[\w]+)(?:\s*!important)?/i);
  if (bgMatch) result.backgroundColor = parseColor(bgMatch[1]);
  
  // Borders
  const borderBottomMatch = style.match(/border-bottom\s*:\s*(\d+)px\s+\w+\s+(#?[\w]+)(?:\s*!important)?/i);
  if (borderBottomMatch) {
    result.borderBottomWidth = parseInt(borderBottomMatch[1]);
    result.borderBottomColor = parseColor(borderBottomMatch[2]);
  }
  
  const borderTopMatch = style.match(/border-top\s*:\s*(\d+)px\s+\w+\s+(#?[\w]+)(?:\s*!important)?/i);
  if (borderTopMatch) {
    result.borderTopWidth = parseInt(borderTopMatch[1]);
    result.borderTopColor = parseColor(borderTopMatch[2]);
  }
  
  // Padding
  const paddingMatch = style.match(/padding\s*:\s*(\d+)px\s*(\d+)?px?/i);
  if (paddingMatch) {
    const v = parseInt(paddingMatch[1]);
    const h = paddingMatch[2] ? parseInt(paddingMatch[2]) : v;
    result.padding = { top: v, right: h, bottom: v, left: h };
  }
  
  // Border radius
  const radiusMatch = style.match(/border-radius\s*:\s*(\d+)px/i);
  if (radiusMatch) result.borderRadius = parseInt(radiusMatch[1]) * 0.5;
  
  // Opacity
  const opacityMatch = style.match(/opacity\s*:\s*([\d.]+)/i);
  if (opacityMatch) result.opacity = parseFloat(opacityMatch[1]);
  
  // Box shadow
  const boxShadowMatch = style.match(/box-shadow\s*:\s*(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+(?:(\d+)px\s+)?(?:rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)|(#?[\w]+))/i);
  if (boxShadowMatch) {
    let color: [number, number, number] = [0, 0, 0];
    let shadowOpacity = 0.3;
    
    if (boxShadowMatch[5]) {
      color = [parseInt(boxShadowMatch[5]), parseInt(boxShadowMatch[6]), parseInt(boxShadowMatch[7])];
      shadowOpacity = boxShadowMatch[8] ? parseFloat(boxShadowMatch[8]) : 1;
    } else if (boxShadowMatch[9]) {
      color = parseColor(boxShadowMatch[9]);
    }
    
    result.boxShadow = {
      offsetX: parseInt(boxShadowMatch[1]),
      offsetY: parseInt(boxShadowMatch[2]),
      blur: parseInt(boxShadowMatch[3]),
      color,
      opacity: shadowOpacity
    };
  }
  
  return result;
};

// ============ DRAWING UTILITIES ============

export const drawBoxShadow = (
  doc: jsPDF,
  rect: { x: number; y: number; width: number; height: number },
  shadow: ContainerStyles['boxShadow'],
  radius: number = 0
) => {
  if (!shadow) return;
  
  doc.setFillColor(...shadow.color);
  const shadowX = rect.x + shadow.offsetX * 0.5;
  const shadowY = rect.y + shadow.offsetY * 0.5;
  
  if (radius > 0) {
    doc.roundedRect(shadowX, shadowY, rect.width, rect.height, radius, radius, 'F');
  } else {
    doc.rect(shadowX, shadowY, rect.width, rect.height, 'F');
  }
};

export const drawBackground = (
  doc: jsPDF,
  rect: { x: number; y: number; width: number; height: number },
  styles: ContainerStyles
) => {
  const radius = styles.borderRadius || 0;
  
  if (styles.backgroundColor || radius) {
    if (styles.backgroundColor) {
      doc.setFillColor(...styles.backgroundColor);
    }
    
    if (radius > 0) {
      doc.roundedRect(rect.x, rect.y, rect.width, rect.height, radius, radius, styles.backgroundColor ? 'F' : 'S');
    } else if (styles.backgroundColor) {
      doc.rect(rect.x, rect.y, rect.width, rect.height, 'F');
    }
  }
};

export const drawBorderLine = (
  doc: jsPDF,
  from: { x: number; y: number },
  to: { x: number; y: number },
  color: [number, number, number],
  width: number
) => {
  doc.setDrawColor(...color);
  doc.setLineWidth(width);
  doc.line(from.x, from.y, to.x, to.y);
};

// ============ FLEX POSITION CALCULATOR ============

export const calculateFlexPositions = (
  doc: jsPDF,
  container: FlexContainer,
  availableWidth: number,
  margin: number,
  pageWidth: number
): { x: number; width: number }[] => {
  const itemCount = container.items.length;
  if (itemCount === 0) return [];
  
  const itemWidth = availableWidth / itemCount;
  
  switch (container.justifyContent) {
    case 'space-between':
      if (itemCount >= 2) {
        return container.items.map((_, i) => {
          if (i === 0) return { x: margin, width: itemWidth };
          if (i === itemCount - 1) return { x: pageWidth - margin - itemWidth, width: itemWidth };
          const spacing = (availableWidth - itemWidth * 2) / (itemCount - 1);
          return { x: margin + itemWidth + spacing * i - itemWidth / 2, width: itemWidth };
        });
      }
      break;
    case 'center': {
      const gap = container.gap ? container.gap * 0.3 : 10;
      const totalWidth = itemWidth * itemCount + gap * (itemCount - 1);
      const startX = margin + (availableWidth - totalWidth) / 2;
      return container.items.map((_, i) => ({
        x: startX + (itemWidth + gap) * i,
        width: itemWidth
      }));
    }
    case 'flex-end':
      return container.items.map((_, i) => ({
        x: pageWidth - margin - itemWidth * (itemCount - i),
        width: itemWidth
      }));
  }
  
  // Default: flex-start
  return container.items.map((_, i) => ({
    x: margin + itemWidth * i,
    width: itemWidth
  }));
};

// ============ TEXT RENDERING ============

export const renderAlignedText = (
  doc: jsPDF,
  text: string,
  pos: { x: number; width: number },
  y: number,
  align: 'left' | 'center' | 'right',
  styles: { fontSize: number; fontStyle: 'normal' | 'bold'; color: [number, number, number] }
) => {
  doc.setFontSize(styles.fontSize);
  doc.setFont('helvetica', styles.fontStyle);
  doc.setTextColor(...styles.color);
  
  const textWidth = doc.getTextWidth(text);
  let textX = pos.x + 2;
  
  if (align === 'right') {
    textX = pos.x + pos.width - textWidth - 2;
  } else if (align === 'center') {
    textX = pos.x + (pos.width - textWidth) / 2;
  }
  
  doc.text(text, textX, y);
};

// ============ UNIFIED FLEX CONTAINER RENDERER ============

export const renderFlexContainer = (
  doc: jsPDF,
  containers: FlexContainer[],
  containerStyles: ContainerStyles,
  area: RenderArea,
  options: {
    type: 'header' | 'footer';
    primaryColor: [number, number, number];
    pageNum?: number;
    totalPages?: number;
    imageCache?: Map<string, ImageData | null>;
  }
): boolean => {
  const { margin, pageWidth, pageHeight } = area;
  const availableWidth = pageWidth - (margin * 2);
  
  // Calculate rect based on type
  const isHeader = options.type === 'header';
  const rectX = margin - 2;
  const rectY = isHeader ? 3 : (pageHeight - area.height + 2);
  const rectWidth = availableWidth + 4;
  const rectHeight = area.height - 8;
  const radius = containerStyles.borderRadius || 0;
  const bottomLimit = rectY + rectHeight - 4; // bottom boundary for text
  
  // Draw border line
  const borderY = isHeader ? area.height - 3 : (pageHeight - area.height);
  const borderColor = isHeader 
    ? (containerStyles.borderBottomColor || options.primaryColor)
    : (containerStyles.borderTopColor || options.primaryColor);
  const borderWidth = isHeader 
    ? (containerStyles.borderBottomWidth || 0.8)
    : (containerStyles.borderTopWidth || 0.8);
  
  drawBorderLine(doc, { x: margin, y: borderY }, { x: pageWidth - margin, y: borderY }, borderColor, borderWidth);
  
  // Draw box shadow
  drawBoxShadow(doc, { x: rectX, y: rectY, width: rectWidth, height: rectHeight }, containerStyles.boxShadow, radius);
  
  // Draw background
  drawBackground(doc, { x: rectX, y: rectY, width: rectWidth, height: rectHeight }, containerStyles);
  
  // Render flex containers
  let currentY = isHeader ? 5 : (pageHeight - area.height + 6);
  
  for (const container of containers) {
    if (container.items.length === 0) continue;
    
    const padLeft = container.padding?.left || 0;
    const padRight = container.padding?.right || 0;
    const innerAvailableWidth = Math.max(0, availableWidth - padLeft - padRight);
    const baseMargin = margin + padLeft;
    const itemPositions = calculateFlexPositions(doc, container, innerAvailableWidth, baseMargin, pageWidth);

    // Apply container padding-top
    if (container.padding?.top) {
      currentY += container.padding.top;
    }
    
    // Render each flex item
    let maxHeight = 0;
    container.items.forEach((item, i) => {
      const pos = itemPositions[i];
      let textY = currentY + (isHeader ? 3 : 0);
      let imageHeight = 0;
      
      // Render image if present
      if (item.image?.src && options.imageCache) {
        const cachedImg = options.imageCache.get(item.image.src);
        if (cachedImg) {
          const imgHeight = Math.min(item.image.height * 0.4, area.height - 10);
          const aspectRatio = cachedImg.width / cachedImg.height;
          const imgWidth = item.image.width 
            ? Math.min(item.image.width * 0.4, pos.width - 4)
            : Math.min(imgHeight * aspectRatio, pos.width - 4);
          
          try {
            doc.addImage(cachedImg.dataUrl, 'PNG', pos.x + 2, currentY, imgWidth, imgHeight);
            imageHeight = imgHeight + 2;
            textY = currentY + imageHeight;
          } catch (e) {
            console.warn('Failed to add image to PDF:', e);
          }
        }
      }
      
      // Apply item-level margin-top
      if (item.marginTop) {
        textY += item.marginTop;
      }
      
      item.content.forEach(({ text, fontSize, fontStyle, color, lineHeight, marginTop }) => {
        if (marginTop) textY += marginTop;
        
        if (text === '\n') {
          textY += isHeader ? 2 : 3;
          return;
        }
        
        // Footer overflow check
        if (!isHeader && textY > bottomLimit) return;
        
        renderAlignedText(doc, text, pos, textY, item.textAlign, { fontSize, fontStyle, color });
        
        const spacing = lineHeight ? fontSize * lineHeight * 0.35 : fontSize * 0.35 + 0.5;
        textY += spacing;
      });
      
      maxHeight = Math.max(maxHeight, textY - currentY);
    });
    
    currentY += maxHeight + (isHeader ? 0 : 2);
    
    // Apply container padding-bottom
    if (container.padding?.bottom) {
      currentY += container.padding.bottom;
    }
    
    // Render border-bottom if specified on flex container
    if (container.borderBottom) {
      drawBorderLine(
        doc,
        { x: margin, y: currentY + 2 },
        { x: pageWidth - margin, y: currentY + 2 },
        container.borderBottom.color,
        container.borderBottom.width * 0.5
      );
    }
  }
  
  // Page number (footer only)
  if (!isHeader && options.pageNum && options.totalPages) {
    doc.setFontSize(8);
    doc.setTextColor(...options.primaryColor);
    doc.text(`Page ${options.pageNum} of ${options.totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }
  
  return true;
};

// ============ HTML TO IMAGE RENDERER (html2canvas) ============

export interface HtmlImageResult {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Renders HTML content as an image using html2canvas.
 * This preserves all CSS styles including flexbox, images, borders, shadows, etc.
 * 
 * @param htmlContent - The HTML string to render
 * @param maxWidth - Maximum width in pixels for the rendered content
 * @returns Promise resolving to image data or null on failure
 */
export const renderHtmlAsImage = async (
  htmlContent: string,
  maxWidth: number = 800
): Promise<HtmlImageResult | null> => {
  if (typeof window === 'undefined' || !htmlContent) return null;
  
  // Create a temporary container off-screen
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = `${maxWidth}px`;
  container.style.backgroundColor = 'white';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);
  
  try {
    const canvas = await html2canvas(container, {
      scale: 2, // Higher quality for PDF
      useCORS: true, // Allow cross-origin images
      logging: false,
      backgroundColor: '#ffffff',
      width: maxWidth,
    });
    
    return {
      dataUrl: canvas.toDataURL('image/png'),
      width: canvas.width / 2, // Account for scale
      height: canvas.height / 2
    };
  } catch (error) {
    console.error('html2canvas rendering failed:', error);
    return null;
  } finally {
    document.body.removeChild(container);
  }
};

// ============ HTML PARSING ============

export const extractTextWithStyles = (el: HTMLElement): FlexItemContent[] => {
  const results: FlexItemContent[] = [];
  
  const walk = (node: Node, inherited: { fontSize: number; fontStyle: 'normal' | 'bold'; color: [number, number, number]; lineHeight?: number; marginTop?: number }) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        results.push({ text, fontSize: inherited.fontSize, fontStyle: inherited.fontStyle, color: inherited.color, lineHeight: inherited.lineHeight, marginTop: inherited.marginTop });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const elem = node as HTMLElement;
      const style = elem.getAttribute('style') || '';
      
      // Parse styles
      let fontSize = inherited.fontSize;
      const fsMatch = style.match(/font-size\s*:\s*(\d+)px/i);
      if (fsMatch) fontSize = parseInt(fsMatch[1]) * 0.75;
      
      let color = inherited.color;
      const colorMatch = style.match(/color\s*:\s*(#[a-fA-F0-9]{3,6}|[a-zA-Z]+)/i);
      if (colorMatch) color = parseColor(colorMatch[1]);
      
      const isNormal = style.match(/font-weight\s*:\s*normal/i);
      const isBold = (style.includes('font-weight') && style.includes('bold')) || elem.tagName === 'STRONG' || elem.tagName === 'B';
      const fontStyle = isNormal ? 'normal' : (isBold ? 'bold' : inherited.fontStyle);
      
      let marginTop: number | undefined = inherited.marginTop;
      const mtMatch = style.match(/margin-top\s*:\s*(\d+)px/i);
      if (mtMatch) marginTop = parseInt(mtMatch[1]) * 0.3;
      
      let lineHeight: number | undefined = inherited.lineHeight;
      const lhMatch = style.match(/line-height\s*:\s*([\d.]+)/i);
      if (lhMatch) lineHeight = parseFloat(lhMatch[1]);
      
      if (elem.tagName === 'BR') {
        results.push({ text: '\n', fontSize, fontStyle, color, lineHeight, marginTop });
        return;
      }
      
      if (elem.tagName === 'DIV' && results.length > 0) {
        const lastResult = results[results.length - 1];
        if (lastResult && lastResult.text !== '\n') {
          results.push({ text: '\n', fontSize, fontStyle, color, lineHeight, marginTop });
        }
      }
      
      elem.childNodes.forEach(child => walk(child, { fontSize, fontStyle, color, lineHeight, marginTop }));
    }
  };
  
  walk(el, { fontSize: 9, fontStyle: 'normal', color: [44, 62, 80] });
  return results;
};

export const parseFlexLayout = (html: string): FlexContainer[] | null => {
  if (typeof window === 'undefined' || !html) return null;
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const containers: FlexContainer[] = [];
  
  const allElements = doc.querySelectorAll('*');
  const flexElements: HTMLElement[] = [];
  
  allElements.forEach(el => {
    const style = (el as HTMLElement).getAttribute('style') || '';
    if (style.match(/display\s*:\s*flex/i)) {
      flexElements.push(el as HTMLElement);
    }
  });
  
  if (flexElements.length === 0) return null;
  
  flexElements.forEach(flexEl => {
    const style = flexEl.getAttribute('style') || '';
    
    // Parse justify-content
    let justifyContent: FlexContainer['justifyContent'] = 'flex-start';
    const jcMatch = style.match(/justify-content\s*:\s*([\w-]+)/i);
    if (jcMatch) {
      const jc = jcMatch[1].toLowerCase();
      if (['space-between', 'center', 'flex-end', 'space-around'].includes(jc)) {
        justifyContent = jc as FlexContainer['justifyContent'];
      }
    }
    
    // Parse align-items
    let alignItems: FlexContainer['alignItems'] = 'stretch';
    const aiMatch = style.match(/align-items\s*:\s*([\w-]+)/i);
    if (aiMatch) {
      const ai = aiMatch[1].toLowerCase();
      if (['flex-start', 'center', 'flex-end'].includes(ai)) {
        alignItems = ai as FlexContainer['alignItems'];
      }
    }
    
    // Parse gap
    let gap: number | undefined;
    const gapMatch = style.match(/gap\s*:\s*(\d+)px/i);
    if (gapMatch) gap = parseInt(gapMatch[1]);
    
    // Parse padding
    let padding: FlexContainer['padding'];
    const paddingMatch = style.match(/padding\s*:\s*(\d+)px(?:\s+(\d+)px)?/i);
    const paddingBottomMatch = style.match(/padding-bottom\s*:\s*(\d+)px/i);
    const paddingTopMatch = style.match(/padding-top\s*:\s*(\d+)px/i);
    
    if (paddingMatch) {
      const v = parseInt(paddingMatch[1]) * 0.3;
      const h = paddingMatch[2] ? parseInt(paddingMatch[2]) * 0.3 : v;
      padding = { top: v, right: h, bottom: v, left: h };
    } else if (paddingBottomMatch || paddingTopMatch) {
      padding = { 
        top: paddingTopMatch ? parseInt(paddingTopMatch[1]) * 0.3 : 0,
        bottom: paddingBottomMatch ? parseInt(paddingBottomMatch[1]) * 0.3 : 0,
        right: 0, left: 0 
      };
    }
    
    // Parse borders
    let borderBottom: FlexContainer['borderBottom'];
    const bbMatch = style.match(/border-bottom\s*:\s*(\d+)px\s+\w+\s+(#?[\w]+)(?:\s*!important)?/i);
    if (bbMatch) {
      borderBottom = { width: parseInt(bbMatch[1]), color: parseColor(bbMatch[2]) };
    }
    
    let borderTop: FlexContainer['borderTop'];
    const btMatch = style.match(/border-top\s*:\s*(\d+)px\s+\w+\s+(#?[\w]+)(?:\s*!important)?/i);
    if (btMatch) {
      borderTop = { width: parseInt(btMatch[1]), color: parseColor(btMatch[2]) };
    }
    
    // Parse flex items
    const items: FlexItem[] = [];
    const children = flexEl.children;
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      if (child.tagName === 'DIV' || child.tagName === 'SPAN') {
        const childStyle = child.getAttribute('style') || '';
        
        let textAlign: FlexItem['textAlign'] = 'left';
        const taMatch = childStyle.match(/text-align\s*:\s*(\w+)/i);
        if (taMatch && ['center', 'right'].includes(taMatch[1])) {
          textAlign = taMatch[1] as 'center' | 'right';
        }
        
        let marginTop: number | undefined;
        const mtMatch = childStyle.match(/margin-top\s*:\s*(\d+)px/i);
        if (mtMatch) marginTop = parseInt(mtMatch[1]) * 0.3;
        
        // Check for image
        let image: { src: string; height: number; width?: number } | undefined;
        const imgEl = child.querySelector('img');
        if (imgEl) {
          const imgStyle = imgEl.getAttribute('style') || '';
          const heightMatch = imgStyle.match(/height\s*:\s*(\d+)/i);
          const widthMatch = imgStyle.match(/width\s*:\s*(\d+)/i);
          image = {
            src: imgEl.getAttribute('src') || '',
            height: heightMatch ? parseInt(heightMatch[1]) : 40,
            width: widthMatch ? parseInt(widthMatch[1]) : undefined
          };
        }
        
        const content = extractTextWithStyles(child);
        
        // Allow items with images even if no text content
        if (content.length > 0 || image) {
          items.push({ content, textAlign, marginTop, image });
        }
      }
    }
    
    if (items.length > 0) {
      containers.push({ justifyContent, alignItems, items, borderBottom, borderTop, gap, padding });
    }
  });
  
  return containers.length > 0 ? containers : null;
};

// ============ IMAGE LOADING ============

export const loadImageAsBase64 = async (url: string): Promise<ImageData | null> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve({
              dataUrl: canvas.toDataURL('image/png'),
              width: img.naturalWidth,
              height: img.naturalHeight
            });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };
      
      img.onerror = () => resolve(null);
      setTimeout(() => resolve(null), 5000);
      img.src = url;
    } catch {
      resolve(null);
    }
  });
};
