declare module 'pdfkit' {
  interface PDFDocumentOptions {
    margin?: number;
    size?: string | number[];
    bufferPages?: boolean;
    autoFirstPage?: boolean;
    info?: Record<string, unknown>;
  }

  interface TextOptions {
    align?: 'left' | 'center' | 'right' | 'justify';
    width?: number;
    height?: number;
    ellipsis?: boolean | string;
    lineBreak?: boolean;
  }

  class PDFDocument extends NodeJS.EventEmitter {
    constructor(options?: PDFDocumentOptions);
    x: number;
    y: number;
    fontSize(size: number): this;
    fillColor(color: string): this;
    strokeColor(color: string): this;
    lineWidth(width: number): this;
    text(text: string, x?: number, y?: number, options?: TextOptions): this;
    text(text: string, options?: TextOptions): this;
    moveDown(lines?: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(): this;
    rect(x: number, y: number, w: number, h: number): this;
    fill(color?: string): this;
    end(): void;
  }

  export default PDFDocument;
}
