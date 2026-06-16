import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  parseColor,
  parseContainerStyles,
  parseFlexLayout,
  extractTextWithStyles,
  loadImageAsBase64,
  renderFlexContainer,
  renderHtmlAsImage,
  drawBoxShadow,
  drawBackground,
  drawBorderLine,
  FlexContainer,
  ContainerStyles,
  ParsedTableRow,
  TableCell,
  ImageData,
  RenderArea
} from './pdfCssRenderer';
import { FREQUENCY_VALUE_TO_SHORT } from './medicationOptions';
import { VitalSigns } from '@/types/patient';
import { ReportFieldConfig, ReportSectionConfig } from '@/types/doctorAssistant';

// Re-export for backward compatibility
export { parseColor, parseFlexLayout };

export interface ReportData {
  patient: {
    firstName: string;
    surName: string;
    age: number;
    gender: string;
    consultationId: string;
    patientId?: string;
    dateOfBirth?: string;
    admissionReason?: string;
    primaryDiagnosis?: string;
    secondaryDiagnoses?: string;
    allergies?: string[];
    bedNumber?: string;
    admissionDateTime?: string;
    duration?: string;
    severity?: string;
    opIpNo?: string;
    visitDate?: string;
    consultationDate?: string;
    visitStatus?: string;
    chiefComplaint?: string;
    purposeOfVisit?: string;
    urgentConcerns?: string;
    symptoms?: string;
    medicalHistory?: string;
    allergy?: string;
    comorbidity?: string;
    familySocialHistory?: string;
    currentMedication?: string;
    customCategories?: Array<{ name: string; value: string; field?: string }>;
  };
  doctor: {
    name: string;
    id?: string;
  };
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    route: string;
    duration?: string;
    foodTiming?: string;
    instructions?: string;
    status?: string;
    prescribedBy?: string;
  }>;
  labOrders?: Array<{
    testName: string;
    notes?: string;
    createdOn?: string;
    doctorId?: string;
  }>;
  notes: Array<{
    Type?: string;
    content?: string;
    doctorName?: string;
    doctorId?: string;
    date?: string;
  }>;
  vitals?: VitalSigns;
  generatedDate: Date;
  customHeader?: string;
  customFooter?: string;
  isPrintMode?: boolean;
  primaryColorHex?: string;
  headerHeight?: number;  // Dynamic height in PDF points from API
  footerHeight?: number;  // Dynamic height in PDF points from API
  prescriptionConfig?: ReportFieldConfig[];
  reportSections?: ReportSectionConfig[];
}

// Layout constants - defaults when API doesn't provide heights
const DEFAULT_HEADER_HEIGHT = 30;
const DEFAULT_FOOTER_HEIGHT = 20; // reduced to decrease footer gap

// Interface for parsed HTML elements
interface ParsedElement {
  text: string;
  align: 'left' | 'center' | 'right';
  color: [number, number, number];
  fontSize: number;
  fontStyle: 'normal' | 'bold' | 'italic';
  isNewLine: boolean;
  column: 'left' | 'right' | 'full';
}

// ============ HTML TABLE PARSER ============
const parseHtmlTable = (html: string): ParsedTableRow[] | null => {
  if (typeof window === 'undefined' || !html) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');

  if (!table) return null;

  const parseTableRows = (tableEl: Element): ParsedTableRow[] => {
    const parsedRows: ParsedTableRow[] = [];

    tableEl.querySelectorAll(':scope > tbody > tr, :scope > tr').forEach(tr => {
      const cells: TableCell[] = [];
      const rowStyleAttr = (tr as HTMLElement).getAttribute('style') || '';

      let rowBgColor: [number, number, number] | undefined;
      const rowBgMatch = rowStyleAttr.match(/background\s*:\s*(#?\w+)/i);
      if (rowBgMatch) rowBgColor = parseColor(rowBgMatch[1]);

      tr.querySelectorAll(':scope > td').forEach(td => {
        const tdEl = td as HTMLElement;
        const cellStyleAttr = tdEl.getAttribute('style') || '';

        let widthPercent = 33;
        const widthAttr = td.getAttribute('width');
        if (widthAttr) widthPercent = parseInt(widthAttr.replace('%', ''));

        let bgColor: [number, number, number] | undefined;
        const cellBgMatch = cellStyleAttr.match(/background\s*:\s*(#?\w+)/i);
        if (cellBgMatch) bgColor = parseColor(cellBgMatch[1]);

        let borderColor: [number, number, number] | undefined;
        let borderWidth: number | undefined;
        const borderMatch = cellStyleAttr.match(/border\s*:\s*(\d+)px\s+\w+\s+(#?\w+)/i);
        if (borderMatch) {
          borderWidth = parseInt(borderMatch[1]);
          borderColor = parseColor(borderMatch[2]);
        }

        let verticalAlign: string | undefined;
        const vaMatch = cellStyleAttr.match(/vertical-align\s*:\s*(\w+)/i);
        if (vaMatch) verticalAlign = vaMatch[1];

        let textAlign: 'left' | 'center' | 'right' = 'left';
        const taMatch = cellStyleAttr.match(/text-align\s*:\s*(\w+)/i);
        if (taMatch && ['center', 'right'].includes(taMatch[1].toLowerCase())) {
          textAlign = taMatch[1].toLowerCase() as 'center' | 'right';
        }

        const img = td.querySelector('img');
        let image: { src: string; height: number } | undefined;
        if (img) {
          const imgStyle = img.getAttribute('style') || '';
          const heightMatch = imgStyle.match(/height\s*:\s*(\d+)/i);
          image = {
            src: img.getAttribute('src') || '',
            height: heightMatch ? parseInt(heightMatch[1]) : 40
          };
        }

        const nestedTableEl = td.querySelector('table');
        let nestedTable: ParsedTableRow[] | undefined;
        if (nestedTableEl) nestedTable = parseTableRows(nestedTableEl);

        const content: string[] = [];
        const styles: { fontSize: number; fontStyle: 'normal' | 'bold'; color: [number, number, number] }[] = [];

        const extractText = (el: Element, inheritedStyles?: { fontSize?: number; color?: [number, number, number]; fontWeight?: string }) => {
          el.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent?.trim();
              if (text) {
                const parentEl = node.parentElement as HTMLElement;
                const parentStyleAttr = parentEl?.getAttribute('style') || '';

                let fontSize = inheritedStyles?.fontSize || 9;
                const fsMatch = parentStyleAttr.match(/font-size\s*:\s*(\d+)px/i);
                if (fsMatch) fontSize = parseInt(fsMatch[1]) * 0.75;

                let color: [number, number, number] = inheritedStyles?.color || [44, 62, 80];
                const colorMatch = parentStyleAttr.match(/color\s*:\s*(#?\w+)/i);
                if (colorMatch) color = parseColor(colorMatch[1]);

                const isBold = parentStyleAttr.includes('font-weight') && parentStyleAttr.includes('bold') ||
                  parentEl?.tagName === 'STRONG' || parentEl?.tagName === 'B';

                content.push(text);
                styles.push({ fontSize: Math.max(7, Math.min(14, fontSize)), fontStyle: isBold ? 'bold' : 'normal', color });
              }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              const childEl = node as Element;
              if (childEl.tagName !== 'TABLE' && childEl.tagName !== 'IMG') {
                if (childEl.tagName === 'BR') {
                  content.push('\n');
                  styles.push({ fontSize: 9, fontStyle: 'normal', color: [44, 62, 80] });
                } else {
                  const elStyleAttr = (childEl as HTMLElement).getAttribute('style') || '';
                  const elFsMatch = elStyleAttr.match(/font-size\s*:\s*(\d+)px/i);
                  const elColorMatch = elStyleAttr.match(/color\s*:\s*(#?\w+)/i);

                  extractText(childEl, {
                    fontSize: elFsMatch ? parseInt(elFsMatch[1]) * 0.75 : inheritedStyles?.fontSize,
                    color: elColorMatch ? parseColor(elColorMatch[1]) : inheritedStyles?.color,
                    fontWeight: elStyleAttr.includes('bold') ? 'bold' : inheritedStyles?.fontWeight
                  });
                }
              }
            }
          });
        };

        extractText(td);
        cells.push({ widthPercent, content, styles, image, nestedTable, bgColor, borderColor, borderWidth, verticalAlign, textAlign });
      });

      parsedRows.push({ cells, bgColor: rowBgColor });
    });

    return parsedRows;
  };

  return parseTableRows(table);
};

// Extract all text from HTML (fallback)
const extractAllText = (html: string): { text: string; isBold: boolean; color: [number, number, number] }[] => {
  if (typeof window === 'undefined' || !html) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const results: { text: string; isBold: boolean; color: [number, number, number] }[] = [];

  const walk = (el: Element) => {
    el.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          const parentEl = node.parentElement as HTMLElement;
          const isBold = parentEl?.tagName === 'STRONG' || parentEl?.tagName === 'B' || parentEl?.style?.fontWeight === 'bold';
          const color = parentEl?.style?.color ? parseColor(parentEl.style.color) : [44, 62, 80] as [number, number, number];
          results.push({ text, isBold, color });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        walk(node as Element);
      }
    });
  };

  walk(doc.body);
  return results;
};

// Parse HTML with inline styles (legacy)
const parseHtmlWithStyles = (html: string): ParsedElement[] => {
  if (typeof window === 'undefined' || !html) return [];

  const parser = new DOMParser();
  const parsedDoc = parser.parseFromString(html, 'text/html');
  const elements: ParsedElement[] = [];

  const processElement = (el: Element, parentStyles: { color?: [number, number, number]; align?: 'left' | 'center' | 'right'; fontSize?: number; fontStyle?: 'normal' | 'bold'; column?: 'left' | 'right' | 'full' } = {}) => {
    const computedStyle = (el as HTMLElement).style;

    const colorStr = computedStyle?.color || '';
    const fontWeight = computedStyle?.fontWeight || '';
    const textAlign = computedStyle?.textAlign || '';
    const float = computedStyle?.cssFloat || computedStyle?.getPropertyValue?.('float') || '';
    const fontSize = computedStyle?.fontSize || '';

    let align: 'left' | 'center' | 'right' = parentStyles.align || 'left';
    let column: 'left' | 'right' | 'full' = parentStyles.column || 'full';

    if (textAlign === 'center') align = 'center';
    else if (textAlign === 'right') align = 'right';
    else if (textAlign === 'left') align = 'left';

    if (float === 'left') { column = 'left'; align = 'left'; }
    else if (float === 'right') { column = 'right'; align = 'right'; }

    const position = computedStyle?.position || '';
    const left = computedStyle?.left || '';
    const right = computedStyle?.right || '';

    if (position === 'absolute' || position === 'relative') {
      if (left && !right) { column = 'left'; align = 'left'; }
      else if (right && !left) { column = 'right'; align = 'right'; }
    }

    const isBold = fontWeight === 'bold' || fontWeight === '700' || fontWeight === '600' || el.tagName === 'B' || el.tagName === 'STRONG';
    const fontStyle: 'normal' | 'bold' = isBold ? 'bold' : (parentStyles.fontStyle || 'normal');

    let fontSizeNum = parentStyles.fontSize || 9;
    if (fontSize) {
      const match = fontSize.match(/(\d+)/);
      if (match) {
        const size = parseInt(match[1]);
        if (fontSize.includes('px')) fontSizeNum = Math.max(7, Math.min(14, size * 0.75));
        else if (fontSize.includes('pt')) fontSizeNum = Math.max(7, Math.min(14, size));
        else if (fontSize.includes('em')) fontSizeNum = Math.max(7, Math.min(14, size * 9));
      }
    }

    const parsedColor: [number, number, number] = colorStr ? parseColor(colorStr) : (parentStyles.color || [44, 62, 80]);

    el.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          elements.push({ text, align, color: parsedColor, fontSize: fontSizeNum, fontStyle, isNewLine: false, column });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        processElement(node as Element, { align, color: parsedColor, fontSize: fontSizeNum, fontStyle, column });
      }
    });

    const tagName = el.tagName?.toLowerCase();
    const isBlockElement = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr', 'br', 'li'].includes(tagName);
    if (isBlockElement && elements.length > 0) {
      elements[elements.length - 1].isNewLine = true;
    }
  };

  if (parsedDoc.body) processElement(parsedDoc.body);
  return elements;
};

export const generateMedicalReport = async (data: ReportData): Promise<void> => {
  const doc = await createPDFDocument(data);
  const fileName = `OP_Consultation_${data.patient.consultationId}_${data.generatedDate.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

const createPDFDocument = async (data: ReportData): Promise<jsPDF> => {
  // Filter all notes to only include ones from the current date (or keep if date is missing)
  if (data.notes) {
    const reportDate = data.generatedDate || new Date();
    data.notes = data.notes.filter(note => {
      if (!note.date) return true; // keep if no date is provided
      const noteDate = new Date(note.date);
      if (isNaN(noteDate.getTime())) return true; // keep if date is invalid
      return noteDate.getDate() === reportDate.getDate() &&
        noteDate.getMonth() === reportDate.getMonth() &&
        noteDate.getFullYear() === reportDate.getFullYear();
    });
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  // Dynamic heights from API or defaults
  const HEADER_HEIGHT = data.headerHeight || DEFAULT_HEADER_HEIGHT;
  const FOOTER_HEIGHT = data.footerHeight || DEFAULT_FOOTER_HEIGHT;
  const HEADER_CONTENT_GAP = 2; // gap between header area and content in PDF points
  // contentStartY will be computed after estimating the header area so we avoid overlap with dynamic header content

  const hasCustomContent = !data.isPrintMode && (data.customHeader || data.customFooter);

  // Parse header HTML early so we can estimate required header height and avoid content overlap
  const headerFlexContainers = parseFlexLayout(data.customHeader || '');
  const headerTableRows = parseHtmlTable(data.customHeader || '');
  const headerStyles = parseContainerStyles(data.customHeader || '');

  // Estimate header area height based on flex containers or table rows
  const estimateHeaderHeight = (flexContainers: FlexContainer[] | null, tableRows: ParsedTableRow[] | null, styles: ContainerStyles | null) => {
    let height = HEADER_HEIGHT; // default fallback

    // Flex containers estimator
    if (flexContainers && flexContainers.length > 0) {
      let currentY = 5;
      for (const container of flexContainers) {
        if (container.padding?.top) currentY += container.padding.top;
        let maxHeight = 0;
        for (const item of container.items) {
          let textY = currentY + 3;
          if (item.marginTop) textY += item.marginTop;
          for (const c of item.content) {
            if (c.text === '\n') {
              textY += 2;
              continue;
            }
            const spacing = c.lineHeight ? c.fontSize * c.lineHeight * 0.35 : c.fontSize * 0.35 + 0.5;
            textY += spacing;
          }
          maxHeight = Math.max(maxHeight, textY - currentY);
        }
        currentY += maxHeight;
        if (container.padding?.bottom) currentY += container.padding.bottom;
        if (container.borderBottom) currentY += (container.borderBottom.width * 0.5) || 0;
      }
      height = Math.max(height, Math.ceil(currentY + 6));
    }

    // Table header estimator (account for images/nested tables which can be taller than the default row height)
    if (tableRows && tableRows.length > 0) {
      let rowsHeight = 0;
      for (const row of tableRows) {
        let rowHeight = 12;
        for (const cell of row.cells) {
          if (cell.image?.height && cell.image.src && cell.image.src !== 'undefined' && cell.image.src !== 'null') {
            rowHeight = Math.max(rowHeight, Math.min(cell.image.height, 45) + 2);
          }
          if (cell.nestedTable && cell.nestedTable.length > 0) {
            rowHeight = Math.max(rowHeight, cell.nestedTable.length * 5 + 4);
          }
        }
        rowsHeight += rowHeight;
      }
      rowsHeight += (styles.padding ? (styles.padding.top || 0) + (styles.padding.bottom || 0) : 0);
      height = Math.max(height, Math.ceil(rowsHeight + 10));
    }

    return height;
  };

  // Use API-provided height if available (always, even in print mode);
  // otherwise estimate from content when custom HTML is present;
  // fall back to the constant defaults as a last resort.
  const headerAreaHeight = data.headerHeight
    ? data.headerHeight
    : hasCustomContent
      ? estimateHeaderHeight(headerFlexContainers, headerTableRows, headerStyles)
      : HEADER_HEIGHT;

  // Parse footer early and estimate footer area height so body avoids overlapping footer
  const footerFlexContainers = parseFlexLayout(data.customFooter || '');
  const footerTableRows = parseHtmlTable(data.customFooter || '');
  const footerStyles = parseContainerStyles(data.customFooter || '');
  const footerAreaHeight = data.footerHeight
    ? data.footerHeight
    : hasCustomContent
      ? estimateHeaderHeight(footerFlexContainers, footerTableRows, footerStyles)
      : FOOTER_HEIGHT;

  // Ensure content starts after the header area plus a buffer gap to visually separate header and body
  const contentStartY = Math.ceil(headerAreaHeight + HEADER_CONTENT_GAP);
  const contentEndY = pageHeight - footerAreaHeight - 10;

  let yPosition = contentStartY;

  // Typography
  const FONT_SIZE = { title: 14, subtitle: 9, sectionHeader: 9, label: 10, body: 9, small: 8, large: 10 };
  const SPACING = { margin: 20, sectionGap: 6, rowHeight: 5, labelWidth: 42, col1X: 20, col2X: 112 };

  // Color utilities
  const lightenColor = (rgb: [number, number, number], factor: number = 0.7): [number, number, number] => [
    Math.min(255, Math.round(rgb[0] + (255 - rgb[0]) * factor)),
    Math.min(255, Math.round(rgb[1] + (255 - rgb[1]) * factor)),
    Math.min(255, Math.round(rgb[2] + (255 - rgb[2]) * factor))
  ];

  const darkenColor = (rgb: [number, number, number], factor: number = 0.2): [number, number, number] => [
    Math.max(0, Math.round(rgb[0] * (1 - factor))),
    Math.max(0, Math.round(rgb[1] * (1 - factor))),
    Math.max(0, Math.round(rgb[2] * (1 - factor)))
  ];

  // Colors
  const defaultPrimary: [number, number, number] = [41, 128, 185];
  const primaryColor: [number, number, number] = data.primaryColorHex ? parseColor(data.primaryColorHex) : defaultPrimary;
  const primaryLight: [number, number, number] = lightenColor(primaryColor, 0.7);
  const primaryDark: [number, number, number] = darkenColor(primaryColor, 0.15);
  const darkColor: [number, number, number] = [44, 62, 80];
  const lightGray: [number, number, number] = [189, 195, 199];
  const alertColor: [number, number, number] = [192, 57, 43];

  // Helpers
  const addText = (text: string, x: number, y: number, options: { fontSize?: number; fontStyle?: 'normal' | 'bold'; color?: [number, number, number] } = {}) => {
    const { fontSize = FONT_SIZE.body, fontStyle = 'normal', color = darkColor } = options;
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(...color);
    doc.text(text, x, y);
  };

  const drawSectionHeader = (title: string, y: number, _bgColor?: [number, number, number], textColor: [number, number, number] = primaryColor, underline: boolean = true): number => {
    // Teal/primary colored text with optional underline (matching reference design)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONT_SIZE.sectionHeader);
    doc.setTextColor(...textColor);
    doc.text(title, margin, y);

    // Draw an underline when requested (keeps the design minimal vs a full background)
    if (underline) {
      const textWidth = doc.getTextWidth(title);
      const lineY = y + 1.5;
      doc.setDrawColor(...textColor);
      doc.setLineWidth(0.3);
      doc.line(margin, lineY, margin + textWidth, lineY);
      // Slightly increase vertical spacing when underline is present
      y += 3;
    }

    // Slightly smaller vertical gap when no underline
    return y + 5;
  };

  const drawLabelValue = (label: string, value: string, x: number, y: number, labelWidth: number = SPACING.labelWidth) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONT_SIZE.label);
    doc.setTextColor(...darkColor);
    doc.text(`${label}`, x, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${value || '-'}`, x + labelWidth, y);
  };

  const checkPageBreak = (requiredSpace: number) => {
    const bottomMargin = hasCustomContent ? footerAreaHeight : 15;
    if (yPosition + requiredSpace > pageHeight - bottomMargin) {
      doc.addPage();
      yPosition = contentStartY;
    }
  };

  const formatDate = (date: Date | string | undefined, includeTime: boolean = false): string => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return typeof date === 'string' ? date : '-';
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    if (includeTime) { options.hour = '2-digit'; options.minute = '2-digit'; }
    return d.toLocaleDateString('en-IN', options);
  };

  // ============ TABLE-BASED HEADER/FOOTER RENDERER ============
  const renderTableContainer = async (
    type: 'header' | 'footer',
    tableRows: ParsedTableRow[],
    containerStyles: ContainerStyles,
    imageCache: Map<string, ImageData | null>,
    pageNum: number,
    totalPages?: number,
    areaHeight?: number
  ) => {
    doc.setPage(pageNum);

    const isHeader = type === 'header';
    const availableWidth = pageWidth - (margin * 2);
    const containerPadding = containerStyles.padding || { top: 5, right: 10, bottom: 5, left: 10 };
    const innerAvailableWidth = Math.max(0, availableWidth - (containerPadding.left || 0) - (containerPadding.right || 0));

    const rectX = margin - 2;
    const rectY = isHeader ? 3 : (pageHeight - (areaHeight || FOOTER_HEIGHT) + 2);
    const rectWidth = availableWidth + 4;
    const rectHeight = (isHeader ? (areaHeight || HEADER_HEIGHT) : (areaHeight || FOOTER_HEIGHT)) - 8;
    const radius = containerStyles.borderRadius || 0;
    const bottomLimit = rectY + rectHeight - 2;

    // Shadow and background
    drawBoxShadow(doc, { x: rectX, y: rectY, width: rectWidth, height: rectHeight }, containerStyles.boxShadow, radius);
    drawBackground(doc, { x: rectX, y: rectY, width: rectWidth, height: rectHeight }, containerStyles);

    const initialY = isHeader ? (4 + containerPadding.top * 0.2) : (pageHeight - (areaHeight || FOOTER_HEIGHT) + 4 + containerPadding.top * 0.3);
    let currentY = initialY;
    const rowSpacing = 2;

    for (const row of tableRows) {
      let currentX = margin;
      let maxRowHeight = 0;

      if (row.bgColor) {
        doc.setFillColor(...row.bgColor);
        doc.rect(margin, currentY - 2, availableWidth, 12, 'F');
      }

      for (const cell of row.cells) {
        const cellWidth = (cell.widthPercent / 100) * availableWidth;
        let cellHeight = 0;

        if (cell.bgColor) {
          doc.setFillColor(...cell.bgColor);
          doc.rect(currentX, currentY - 2, cellWidth, isHeader ? 12 : 7, 'F');
        }

        // Image rendering (header only)
        if (isHeader && cell.image?.src) {
          const cachedImg = imageCache.get(cell.image.src);
          if (cachedImg) {
            const imgHeight = Math.min(cell.image.height, 45);
            const aspectRatio = cachedImg.width / cachedImg.height;
            const imgWidth = Math.min(imgHeight * aspectRatio, cellWidth - 4);
            try {
              doc.addImage(cachedImg.dataUrl, 'PNG', currentX + 2, currentY, imgWidth, imgHeight);
              cellHeight = imgHeight + 2;
            } catch (e) {
              console.warn('Failed to add image to PDF:', e);
            }
          }
        }

        // Nested table (header only)
        if (isHeader && cell.nestedTable && cell.nestedTable.length > 0) {
          const nestedStartX = currentX + 2;
          const nestedWidth = cellWidth - 4;
          let nestedY = currentY;
          const nestedRowHeight = 5;

          const firstNestedCell = cell.nestedTable[0]?.cells[0];
          const nestedBorderColor = firstNestedCell?.borderColor || [208, 215, 229];
          const nestedBorderWidth = firstNestedCell?.borderWidth || 0.3;

          doc.setDrawColor(...nestedBorderColor);
          doc.setLineWidth(0.3);
          const nestedHeight = cell.nestedTable.length * nestedRowHeight;
          doc.rect(nestedStartX, nestedY - 2, nestedWidth, nestedHeight + 4);

          for (const nestedRow of cell.nestedTable) {
            let nestedX = nestedStartX;
            const colWidth = nestedWidth / Math.max(nestedRow.cells.length, 1);

            if (nestedRow.bgColor) {
              doc.setFillColor(...nestedRow.bgColor);
              doc.rect(nestedStartX, nestedY - 2, nestedWidth, nestedRowHeight, 'F');
            }

            for (const nestedCell of nestedRow.cells) {
              if (nestedCell.bgColor) {
                doc.setFillColor(...nestedCell.bgColor);
                doc.rect(nestedX, nestedY - 2, colWidth, nestedRowHeight, 'F');
              }

              for (let i = 0; i < nestedCell.content.length; i++) {
                const text = nestedCell.content[i];
                if (text && text !== '\n') {
                  const style = nestedCell.styles[i] || { fontSize: 8, fontStyle: 'normal', color: [44, 62, 80] as [number, number, number] };
                  doc.setFontSize(style.fontSize);
                  doc.setFont('helvetica', style.fontStyle);
                  doc.setTextColor(...style.color);

                  const maxWidth = colWidth - 4;
                  let displayText = text;
                  while (doc.getTextWidth(displayText) > maxWidth && displayText.length > 3) {
                    displayText = displayText.slice(0, -1);
                  }
                  doc.text(displayText, nestedX + 2, nestedY + 2);
                }
              }
              nestedX += colWidth;
            }
            nestedY += nestedRowHeight;
          }
          cellHeight = Math.max(cellHeight, cell.nestedTable.length * nestedRowHeight + 4);
        }

        // Text content
        if (!cell.image && !cell.nestedTable) {
          let textY = currentY + (isHeader ? 4 : 0);
          for (let i = 0; i < cell.content.length; i++) {
            const text = cell.content[i];
            if (text === '\n') {
              textY += 4;
              continue;
            }
            if (text && textY < bottomLimit) {
              const style = cell.styles[i] || { fontSize: isHeader ? 9 : 8, fontStyle: 'normal', color: [44, 62, 80] as [number, number, number] };
              doc.setFontSize(style.fontSize);
              doc.setFont('helvetica', style.fontStyle);
              doc.setTextColor(...style.color);

              const maxWidth = cellWidth - 4;
              let displayText = text;
              while (doc.getTextWidth(displayText) > maxWidth && displayText.length > 3) {
                displayText = displayText.slice(0, -1);
              }

              const textWidth = doc.getTextWidth(displayText);
              let textX = currentX + 2;
              if (cell.textAlign === 'right') {
                textX = currentX + cellWidth - textWidth - 2;
              } else if (cell.textAlign === 'center') {
                textX = currentX + (cellWidth - textWidth) / 2;
              }

              doc.text(displayText, textX, textY);
              textY += style.fontSize * (isHeader ? 0.35 : 0.4) + 1.5;
            }
          }
          cellHeight = Math.max(cellHeight, textY - currentY);
        }

        maxRowHeight = Math.max(maxRowHeight, cellHeight);
        currentX += cellWidth;
      }

      currentY += maxRowHeight + rowSpacing;
    }

    // Footer-specific: centered address and page number
    if (!isHeader) {
      const addressMatch = data.customFooter?.match(/<div[^>]*text-align:\s*center[^>]*>([^<]+)<\/div>/i);
      if (addressMatch) {
        const addressStyleMatch = data.customFooter?.match(/<div[^>]*text-align:\s*center[^>]*style="([^"]*)"/i);
        const addressStyle = addressStyleMatch?.[1] || '';
        const addressColorMatch = addressStyle.match(/color\s*:\s*(#?\w+)/i);
        const addressColor = addressColorMatch ? parseColor(addressColorMatch[1]) : [85, 85, 85] as [number, number, number];

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...addressColor);
        const addressText = addressMatch[1].trim();
        const splitAddress = doc.splitTextToSize(addressText, availableWidth - 10);
        const addressStartY = pageHeight - (areaHeight || FOOTER_HEIGHT) + 6 + containerPadding.top;
        splitAddress.forEach((line: string, idx: number) => {
          const lineY = addressStartY + idx * 4;
          // Only draw lines that fit within the footer area
          if (lineY <= bottomLimit) {
            doc.text(line, pageWidth / 2, lineY, { align: 'center' });
          }
        });
      }

      doc.setFontSize(FONT_SIZE.small);
      doc.setTextColor(...primaryColor);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }

    return true;
  };

  // ============ FALLBACK RENDERERS ============
  const renderFallbackHeader = (pageNum: number) => {
    doc.setPage(pageNum);
    if (data.isPrintMode) return;

    if (data.customHeader !== undefined && data.customHeader !== null) {
      const textElements = extractAllText(data.customHeader);
      let textY = 12;
      textElements.forEach(el => {
        if (textY < HEADER_HEIGHT - 5) {
          doc.setFontSize(9);
          doc.setFont('helvetica', el.isBold ? 'bold' : 'normal');
          doc.setTextColor(...el.color);
          doc.text(el.text, margin, textY);
          textY += 15;
        }
      });
    } else {
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setFontSize(FONT_SIZE.title);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('OP CONSULTATION NOTES', pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(FONT_SIZE.subtitle);
      doc.setFont('helvetica', 'normal');
      doc.text('Healthcare Medical Center', pageWidth / 2, 24, { align: 'center' });
      doc.setFontSize(FONT_SIZE.small);
      doc.text(`Generated: ${formatDate(data.generatedDate, true)}`, pageWidth / 2, 32, { align: 'center' });
    }
  };

  const renderFallbackFooter = (pageNum: number, totalPages: number) => {
    doc.setPage(pageNum);
    if (data.isPrintMode) return;

    if (data.customFooter !== undefined && data.customFooter !== null) {

      const textElements = extractAllText(data.customFooter);
      let textY = pageHeight - footerAreaHeight + 6;
      const fallbackLeftX = margin + ((footerStyles && footerStyles.padding && footerStyles.padding.left) ? footerStyles.padding.left : 0);
      const fallbackRightX = pageWidth - margin - ((footerStyles && footerStyles.padding && footerStyles.padding.right) ? footerStyles.padding.right : 0);
      for (const el of textElements) {
        if (textY > pageHeight - 4) break; // avoid drawing past the bottom margin
        doc.setFontSize(8);
        doc.setFont('helvetica', el.isBold ? 'bold' : 'normal');
        doc.setTextColor(...el.color);
        doc.text(el.text, fallbackLeftX, textY);
        textY += 4;
      }

      doc.setFontSize(FONT_SIZE.small);
      doc.setTextColor(...primaryColor);
      doc.text(`Page ${pageNum} of ${totalPages}`, fallbackRightX, pageHeight - 8, { align: 'right' });
    } else {
      doc.setFontSize(FONT_SIZE.small);
      doc.setTextColor(...darkColor);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }
  };

  // ============ CONTENT SECTIONS ============

  // Patient Information - Compact two-column layout matching reference
  const rowHeight = SPACING.rowHeight;
  const genderDisplay = data.patient.gender === 'M' ? 'Male' : data.patient.gender === 'F' ? 'Female' : data.patient.gender;

  // Line 1: Name / Age Gender on left, Date on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(FONT_SIZE.large);
  doc.setTextColor(...darkColor);
  const patientName = `${data.patient.firstName} ${data.patient.surName}`;
  doc.text(patientName, margin, yPosition);

  // Right aligned date (smaller body font)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SIZE.body);
  doc.text(`Date: ${formatDate(data.generatedDate)}`, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += rowHeight;
  const consultationText = `Consultation ID : ${data.patient.consultationId}`;
  doc.setFontSize(FONT_SIZE.body);
  // Consultation ID (top right)
  doc.text(consultationText, pageWidth - margin, yPosition, { align: 'right' });
  // Line 2: Address/symptoms on left, ID on right
  if (data.patient.age) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONT_SIZE.body);
    doc.setTextColor(...darkColor);
    doc.text(` ${data.patient.age}  Years / ${genderDisplay}`, margin, yPosition);

  }
  yPosition += rowHeight;
  const patientIdText = data.patient.patientId ? `Patient ID : ${data.patient.patientId}` : null;
  if (patientIdText) {
    doc.text(patientIdText, margin, yPosition);
    yPosition += rowHeight;
  }
  //  yPosition += 5;
  // ID on right: show Consultation ID and Patient ID on two lines

  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.3);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += SPACING.sectionGap;
  yPosition += 2;
  // yPosition += SPACING.sectionGap;
  // yPosition += SPACING.sectionGap;

  // Helper functions for formatting
  const formatDuration = (duration?: string): string => {
    if (!duration || duration === '-') return '-';
    if (duration.toLowerCase().includes('day')) return duration;
    const num = parseInt(duration, 10);
    if (!isNaN(num)) {
      return num === 1 ? '1 day' : `${num} days`;
    }
    return duration;
  };

  const formatFoodTiming = (timing?: string): string => {
    if (!timing) return '-';
    return timing.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatFrequency = (frequency?: string): string => {
    if (!frequency) return '-';
    return FREQUENCY_VALUE_TO_SHORT[frequency] || frequency;
  };

  // Helper to render a grouped set of notes under a single heading
  const renderNoteGroup = (noteType: string, notes: typeof data.notes) => {
    if (!notes || notes.length === 0) return;
    checkPageBreak(20);
    // Draw heading once for the group
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONT_SIZE.label);
    doc.setTextColor(...primaryColor);
    doc.text(noteType, margin, yPosition);
    const textW = doc.getTextWidth(noteType);
    const lineY = yPosition + 1.5;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.3);
    doc.line(margin, lineY, margin + textW, lineY);
    yPosition += 4;

    notes.forEach((note) => {
      checkPageBreak(15);
      if (note.content) {
        yPosition += 2;
        const contentLines = doc.splitTextToSize(note.content, pageWidth - 2 * margin);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(FONT_SIZE.body);
        doc.setTextColor(...darkColor);
        contentLines.forEach((line: string) => {
          checkPageBreak(6);
          doc.text(line, margin, yPosition);
          yPosition += 4;
        });
      }
      yPosition += 1;
    });

    yPosition += SPACING.sectionGap;
  };

  // Helper to render vitals in a compact grid-like summary
  const drawVitalsSection = (vitals: VitalSigns) => {
    const vitalsToRender = [
      { label: 'Heart Rate', value: vitals.heartRate, unit: 'BPM' },
      {
        label: 'Blood Pressure',
        value: (vitals.bloodPressureSystolic || vitals.bloodPressureDiastolic)
          ? `${vitals.bloodPressureSystolic || '-'}/${vitals.bloodPressureDiastolic || '-'}`
          : null,
        unit: 'mmHg'
      },
      { label: 'Temperature', value: vitals.temperature, unit: '°C' },
      { label: 'SpO2', value: vitals.oxygenSaturation, unit: '%' },
      { label: 'Resp Rate', value: vitals.respiratoryRate, unit: 'breaths/min' },
      { label: 'GCS', value: vitals.glasgowComaScale?.total, unit: '/15' },
      { label: 'Pain Level', value: vitals.painLevel, unit: '/10' },
      { label: 'Blood Glucose', value: vitals.bloodGlucose, unit: 'mg/dL' },
    ].filter(v => v.value !== undefined && v.value !== null && v.value !== 0 && v.value !== '' && v.value !== '-/-');

    if (vitalsToRender.length === 0) return;

    checkPageBreak(25);
    yPosition = drawSectionHeader('Vital Signs', yPosition);
    yPosition += 1;

    const colWidth = (pageWidth - 2 * margin) / 4;
    const rowHeight = 12;
    const labelFontSize = 8;
    const valueFontSize = 9;

    const renderVital = (label: string, value: string | number, unit: string, x: number, y: number) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(labelFontSize);
      doc.setTextColor(...darkColor);
      doc.text(label, x, y);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(valueFontSize);
      doc.setTextColor(...primaryColor);
      doc.text(`${value}`, x, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(128, 128, 128);
      const valW = doc.getTextWidth(`${value}`);
      doc.text(unit, x + valW + 1.5, y + 4);
    };

    vitalsToRender.forEach((vital, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = margin + col * colWidth;
      const y = yPosition + row * rowHeight;
      renderVital(vital.label, vital.value as any, vital.unit, x, y);
    });

    const totalRows = Math.ceil(vitalsToRender.length / 4);
    yPosition += totalRows * rowHeight + 2;
    yPosition += SPACING.sectionGap;
  };
  // ============ MODULAR SECTION DRAWERS ============

  const drawSimpleField = (label: string, value: string | undefined | null) => {
    if (value && value.trim() !== '' && value !== 'undefined' && value !== 'N/A' && value !== '-') {
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...darkColor);
      doc.text(`${label}:`, margin, yPosition);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      const maxWidth = pageWidth - margin - 50;
      const lines = doc.splitTextToSize(value, maxWidth);
      doc.text(lines, margin + 40, yPosition);
      yPosition += (lines.length * 5) + 2;
    }
  };

  const drawVisitInfo = () => {
    // Visit Info is now handled by granular fields below
  };

  const drawClinicalFindings = () => {
    // Custom Categories are handled by ID in the main loop
  };

  const drawConsultationNotes = () => {
    const consultationNotes = (data.notes || []).filter(n => n.Type === 'Consultation Note');
    if (consultationNotes.length > 0) {
      renderNoteGroup('Consultation Note', consultationNotes);
    }
  };

  const drawVitalSigns = () => {
    if (data.vitals) {
      drawVitalsSection(data.vitals);
    }
  };

  const drawMedications = () => {
    if (data.medications && data.medications.length > 0) {
      checkPageBreak(40);
      yPosition = drawSectionHeader('Prescription', yPosition);
      yPosition += 1;

      const config = data.prescriptionConfig || [
        { id: 'name', name: 'Medicine', enabled: true, order: 0 }
      ];

      const isEnabled = (fieldId: string) => {
        const field = config.find(c => c.id === fieldId);
        return field ? field.enabled : true; // Default true if missing
      };

      const headers = ['MEDICINE', 'DOSAGE', 'DURATION'];

      const tableData = data.medications.map(med => {
        // Build Medicine Column (Name + Route)
        let medicineCell = med.name.toUpperCase();
        if (isEnabled('route') && med.route && med.route.trim() !== '') {
          medicineCell += `\n${med.route.toUpperCase()}`;
        }

        // Build Dosage Column (Frequency + Food Timing)
        let dosageCell = '';
        if (isEnabled('frequency')) {
          dosageCell += formatFrequency(med.frequency || '-').toUpperCase();
        }
        if (isEnabled('foodTiming') && med.foodTiming && med.foodTiming.trim() !== '') {
          dosageCell += (dosageCell ? '\n' : '') + formatFoodTiming(med.foodTiming).toUpperCase();
        }
        if (!dosageCell) dosageCell = '-';

        // Build Duration Column (Duration + Instructions)
        let durationCell = '';
        if (isEnabled('duration')) {
          durationCell += formatDuration(med.duration || '-');
        }
        if (isEnabled('instructions') && med.instructions && med.instructions.trim() !== '') {
          durationCell += (durationCell ? '\n' : '') + med.instructions;
        }
        if (!durationCell) durationCell = '-';

        return [medicineCell, dosageCell, durationCell];
      });

      const tableAvailableWidth = pageWidth - margin * 2;
      // Fixed 3 column distribution
      const columnStyles: Record<number, any> = {
        0: { cellWidth: tableAvailableWidth * 0.45 },
        1: { cellWidth: tableAvailableWidth * 0.35 },
        2: { cellWidth: tableAvailableWidth * 0.20 }
      };

      autoTable(doc, {
        startY: yPosition,
        head: [headers],
        body: tableData,
        margin: { left: margin, right: margin },
        theme: 'plain',
        headStyles: { textColor: darkColor, fontStyle: 'normal', fontSize: 9, cellPadding: 2, lineWidth: 0 },
        styles: { fontSize: 8, textColor: darkColor, cellPadding: 2, lineWidth: 0 },
        bodyStyles: { fontSize: 8, textColor: darkColor, cellPadding: 2 },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        columnStyles: columnStyles,
        tableWidth: tableAvailableWidth,
        didParseCell: (cellData) => { if (cellData.section === 'body') cellData.cell.styles.overflow = 'linebreak'; },
        didDrawCell: (cellData) => {
          if (cellData.section === 'head') {
            const text = (cellData.cell.text && cellData.cell.text[0]) || '';
            const textWidth = doc.getTextWidth(String(text));
            const x = cellData.cell.x + 2;
            const lineY = cellData.cell.y + cellData.cell.height - 1;
            doc.setDrawColor(...primaryColor);
            doc.setLineWidth(0.3);
            doc.line(x, lineY, x + textWidth, lineY);
          }
        }
      });

      const lastAutoTable = (doc as any).lastAutoTable;
      yPosition = (lastAutoTable && lastAutoTable.finalY) ? lastAutoTable.finalY + SPACING.sectionGap + 4 : yPosition + SPACING.sectionGap + 4;
    }
  };

  const drawLabOrders = () => {
    if (data.labOrders && data.labOrders.length > 0) {
      checkPageBreak(25);
      yPosition = drawSectionHeader('Lab', yPosition);
      const testNameWidth = 70;
      yPosition += 1;
      data.labOrders.forEach((lab, index) => {
        checkPageBreak(12);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...darkColor);
        doc.text(lab.testName.toUpperCase(), margin, yPosition);        if (lab.notes) {
          const notesX = margin + testNameWidth;
          const maxNotesWidth = pageWidth - margin - notesX;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(...darkColor);
          const notesLines = doc.splitTextToSize(lab.notes, maxNotesWidth);
          doc.text(notesLines, notesX, yPosition);
        }

        yPosition += rowHeight;
        if (index < data.labOrders!.length - 1) yPosition += 2;
      });
      yPosition += SPACING.sectionGap;
    }
  };

  const drawOtherNotes = () => {
    const otherNotesList = (data.notes || []).filter(n => n.Type !== 'Consultation Note');
    if (otherNotesList.length > 0) {
      const notesByType = new Map<string, typeof data.notes>();
      otherNotesList.forEach(note => {
        const key = note.Type || 'Notes';
        if (!notesByType.has(key)) notesByType.set(key, []);
        notesByType.get(key)!.push(note);
      });
      notesByType.forEach((notes, noteType) => renderNoteGroup(noteType, notes));
    }
  };

  // ============ MAIN RENDER LOOP ============

  const sections = data.reportSections || [
    { id: 'chiefComplaint', name: 'Chief Complaints', enabled: true, order: 0 },
    { id: 'consultationNotes', name: 'Consultation Notes', enabled: true, order: 1 },
    { id: 'vitals', name: 'Vital Signs', enabled: true, order: 2 },
    { id: 'prescriptions', name: 'Prescription', enabled: true, order: 3 },
    { id: 'labOrders', name: 'Lab', enabled: true, order: 4 },
    { id: 'otherObservations', name: 'Other Notes', enabled: true, order: 5 },
    { id: 'purposeOfVisit', name: 'Purpose of Visit', enabled: true, order: 6 },
    { id: 'urgentConcerns', name: 'Urgent Concern', enabled: true, order: 7 },
    { id: 'symptoms', name: 'Symptoms', enabled: true, order: 8 },
    { id: 'medicalHistory', name: 'Medical History', enabled: true, order: 9 },
    { id: 'allergy', name: 'Allergies', enabled: true, order: 10 },
    { id: 'comorbidity', name: 'Comorbidity', enabled: true, order: 11 },
    { id: 'familySocialHistory', name: 'Social History', enabled: true, order: 12 }
  ];

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  for (const section of sortedSections) {
    if (!section.enabled) continue;

    switch (section.id) {
      case 'chiefComplaint':
        drawSimpleField('Chief Complaint', data.patient.chiefComplaint);
        break;
      case 'consultationNotes':
        drawConsultationNotes();
        break;
      case 'vitals':
        drawVitalSigns();
        break;
      case 'prescriptions':
        drawMedications();
        break;
      case 'labOrders':
        drawLabOrders();
        break;
      case 'otherObservations':
        drawOtherNotes();
        break;
      case 'purposeOfVisit':
        drawSimpleField('Purpose of Visit', data.patient.purposeOfVisit);
        break;
      case 'urgentConcerns':
        drawSimpleField('Urgent Concern', data.patient.urgentConcerns);
        break;
      case 'symptoms':
        drawSimpleField('Symptoms', data.patient.symptoms);
        break;
      case 'medicalHistory':
        drawSimpleField('Medical History', data.patient.medicalHistory);
        break;
      case 'allergy':
        drawSimpleField('Allergies', data.patient.allergy);
        break;
      case 'comorbidity':
        drawSimpleField('Comorbidity', data.patient.comorbidity);
        break;
      case 'familySocialHistory':
        drawSimpleField('Social History', data.patient.familySocialHistory);
        break;
      default:
        // Handle custom categories (id matches cat.id or field matches cat.field)
        if (data.patient.customCategories && data.patient.customCategories.length > 0) {
          // Robust matching: Check if section ID matches the custom category field OR section name matches cat name
          const customCat = data.patient.customCategories.find(c =>
            (c as any).field === section.id ||
            c.name === section.name ||
            c.name.toLowerCase() === section.name.toLowerCase()
          );

          if (customCat && customCat.value && customCat.value.trim() !== '') {
            drawSimpleField(customCat.name, customCat.value);
          }
        }
        break;
    }
  }


  // ============ APPLY HEADER & FOOTER ============
  const totalPages = doc.getNumberOfPages();

  // Pre-load images for legacy renderer fallback
  const imageCache = new Map<string, ImageData | null>();
  if (data.customHeader && !data.isPrintMode) {
    const imgMatches = data.customHeader.match(/src="([^"]+)"/gi);
    if (imgMatches) {
      const srcs = imgMatches.map(m => m.replace(/src="([^"]+)"/i, '$1'));
      await Promise.all(srcs.map(async src => {
        if (!imageCache.has(src)) {
          imageCache.set(src, await loadImageAsBase64(src));
        }
      }));
    }
  }

  // html2canvas rendered images cache (render once, apply to all pages)
  const htmlImageCache = new Map<string, { dataUrl: string; width: number; height: number } | null>();

  // Pre-render header/footer with html2canvas (once for all pages)
  let headerHtmlImage: { dataUrl: string; width: number; height: number } | null = null;
  let footerHtmlImage: { dataUrl: string; width: number; height: number } | null = null;

  if (!data.isPrintMode && data.customHeader) {
    // Render header HTML as image - use page width minus margins * 3.78 for CSS pixels
    const headerWidthPx = (pageWidth - margin * 2) * 3.78;
    headerHtmlImage = await renderHtmlAsImage(data.customHeader, headerWidthPx);
    console.log('[PDF] Header html2canvas result:', headerHtmlImage ? `${headerHtmlImage.width}x${headerHtmlImage.height}` : 'null');
  }

  if (!data.isPrintMode && data.customFooter) {
    const footerWidthPx = (pageWidth - margin * 2) * 3.78;
    footerHtmlImage = await renderHtmlAsImage(data.customFooter, footerWidthPx);
    console.log('[PDF] Footer html2canvas result:', footerHtmlImage ? `${footerHtmlImage.width}x${footerHtmlImage.height}` : 'null');
  }

  // Render to all pages
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Header
    if (!data.isPrintMode && data.customHeader) {
      // Try html2canvas first (preserves all CSS styles)
      if (headerHtmlImage) {
        const imgWidth = pageWidth - margin * 2;
        const scaleFactor = imgWidth / headerHtmlImage.width;
        const imgHeight = Math.min(headerHtmlImage.height * scaleFactor, headerAreaHeight - 5);

        try {
          doc.addImage(headerHtmlImage.dataUrl, 'PNG', margin, 3, imgWidth, imgHeight);
        } catch (e) {
          console.warn('[PDF] Failed to add header image, falling back:', e);
          // Fallback to flex/table parsers
          if (headerFlexContainers && headerFlexContainers.length > 0) {
            renderFlexContainer(doc, headerFlexContainers, headerStyles,
              { y: 0, height: headerAreaHeight, margin, pageWidth, pageHeight },
              { type: 'header', primaryColor });
          } else if (headerTableRows && headerTableRows.length > 0) {
            await renderTableContainer('header', headerTableRows, headerStyles, imageCache, i, undefined, headerAreaHeight);
          } else {
            renderFallbackHeader(i);
          }
        }
      } else if (headerFlexContainers && headerFlexContainers.length > 0) {
        renderFlexContainer(doc, headerFlexContainers, headerStyles,
          { y: 0, height: headerAreaHeight, margin, pageWidth, pageHeight },
          { type: 'header', primaryColor });
      } else if (headerTableRows && headerTableRows.length > 0) {
        await renderTableContainer('header', headerTableRows, headerStyles, imageCache, i, undefined, headerAreaHeight);
      } else {
        renderFallbackHeader(i);
      }
    } else {
      renderFallbackHeader(i);
    }

    // Footer
    if (!data.isPrintMode && data.customFooter) {
      // Try html2canvas first (preserves all CSS styles)
      if (footerHtmlImage) {
        const imgWidth = pageWidth - margin * 2;
        const scaleFactor = imgWidth / footerHtmlImage.width;
        // Allow the footer image to use more of the allocated footer area to reduce empty gap
        const imgHeight = Math.min(footerHtmlImage.height * scaleFactor, footerAreaHeight - 2);
        const footerY = pageHeight - footerAreaHeight + 2;

        try {
          doc.addImage(footerHtmlImage.dataUrl, 'PNG', margin, footerY, imgWidth, imgHeight);
          // Add page number
          doc.setFontSize(8);
          doc.setTextColor(...primaryColor);
          doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
        } catch (e) {
          console.warn('[PDF] Failed to add footer image, falling back:', e);
          // Fallback to flex/table parsers
          if (footerFlexContainers && footerFlexContainers.length > 0) {
            renderFlexContainer(doc, footerFlexContainers, footerStyles,
              { y: pageHeight - footerAreaHeight, height: footerAreaHeight, margin, pageWidth, pageHeight },
              { type: 'footer', primaryColor, pageNum: i, totalPages });
          } else if (footerTableRows && footerTableRows.length > 0) {
            await renderTableContainer('footer', footerTableRows, footerStyles, imageCache, i, totalPages, footerAreaHeight);
          } else {
            renderFallbackFooter(i, totalPages);
          }
        }
      } else if (footerFlexContainers && footerFlexContainers.length > 0) {
        renderFlexContainer(doc, footerFlexContainers, footerStyles,
          { y: pageHeight - footerAreaHeight, height: footerAreaHeight, margin, pageWidth, pageHeight },
          { type: 'footer', primaryColor, pageNum: i, totalPages });
      } else if (footerTableRows && footerTableRows.length > 0) {
        await renderTableContainer('footer', footerTableRows, footerStyles, imageCache, i, totalPages, footerAreaHeight);
      } else {
        renderFallbackFooter(i, totalPages);
      }
    } else {
      renderFallbackFooter(i, totalPages);
    }
  }

  return doc;
};

export const generateMedicalReportBlob = async (data: ReportData): Promise<Blob> => {
  const doc = await createPDFDocument(data);
  return doc.output('blob');
};
