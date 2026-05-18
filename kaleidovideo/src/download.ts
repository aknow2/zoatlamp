export function createRadialSliceFilename(frameCount: number, date = new Date()): string {
  const timestamp = date
    .toISOString()
    .replace(/\.\d{3}Z$/, 'Z')
    .replace(/[:.]/g, '-');

  return `radial-slice-${frameCount}-${timestamp}.png`;
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create PNG blob'));
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
      resolve();
    }, 'image/png');
  });
}
