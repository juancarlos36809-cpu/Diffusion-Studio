
export type ExportFormat = 'png' | 'jpeg' | 'bmp' | 'gif' | 'raw';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Helper to create BMP binary data from ImageData
const createBMP = (imageData: ImageData): Blob => {
  const width = imageData.width;
  const height = imageData.height;
  const bufferLen = 54 + (width * height * 4);
  const buffer = new ArrayBuffer(bufferLen);
  const view = new DataView(buffer);
  
  // BMP Header
  view.setUint16(0, 0x424D, false); // BM
  view.setUint32(2, bufferLen, true); // File size
  view.setUint32(6, 0, true); // Reserved
  view.setUint32(10, 54, true); // Offset to pixel data
  
  // DIB Header
  view.setUint32(14, 40, true); // Header size
  view.setInt32(18, width, true); // Width
  view.setInt32(22, -height, true); // Height (top-down)
  view.setUint16(26, 1, true); // Planes
  view.setUint16(28, 32, true); // Bits per pixel (32 for RGBA)
  view.setUint32(30, 0, true); // Compression (BI_RGB)
  view.setUint32(34, width * height * 4, true); // Image size
  view.setInt32(38, 2835, true); // X pixels per meter
  view.setInt32(42, 2835, true); // Y pixels per meter
  view.setUint32(46, 0, true); // Colors used
  view.setUint32(50, 0, true); // Important colors

  // Pixel Data (BGRA for BMP usually, but canvas is RGBA. Let's just dump RGBA for simplicity in web viewers, 
  // though strictly BMP is often BGR. We'll do a quick swap to BGR to be compliant)
  const data = imageData.data;
  let offset = 54;
  for (let i = 0; i < data.length; i += 4) {
    // BMP is BGRA in Little Endian
    view.setUint8(offset++, data[i + 2]); // B
    view.setUint8(offset++, data[i + 1]); // G
    view.setUint8(offset++, data[i]);     // R
    view.setUint8(offset++, data[i + 3]); // A
  }

  return new Blob([buffer], { type: 'image/bmp' });
};

export const exportCanvasAs = (canvas: HTMLCanvasElement, format: ExportFormat, filenameBase: string = 'composition') => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  switch (format) {
    case 'png':
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, `${filenameBase}.png`);
      }, 'image/png');
      break;

    case 'jpeg':
      // JPEG doesn't support transparency, fill black first if needed, but canvas is usually composited on color.
      // We assume canvas has a background color drawn.
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, `${filenameBase}.jpg`);
      }, 'image/jpeg', 0.95);
      break;

    case 'gif':
      // Note: HTMLCanvasElement.toDataURL('image/gif') is not supported by all browsers and often returns PNG.
      // Real GIF encoding client-side requires a heavy library (LZW compression). 
      // We will attempt native, if it fails/returns png, the user gets a png with .gif extension (browser might auto-correct or file is just png).
      // A robust app would use gif.js, but we want to stay dependency-free.
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, `${filenameBase}.gif`);
      }, 'image/gif');
      break;

    case 'bmp':
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const bmpBlob = createBMP(imageData);
      downloadBlob(bmpBlob, `${filenameBase}.bmp`);
      break;

    case 'raw':
      // Export Raw Pixel Data (RGBA sequence)
      const rawData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const rawBlob = new Blob([rawData.data.buffer], { type: 'application/octet-stream' });
      downloadBlob(rawBlob, `${filenameBase}.raw`);
      break;
  }
};
