import html2pdf from 'html2pdf.js';

export interface ExportPdfOptions {
  filename?: string;
  orientation?: 'landscape' | 'portrait';
  margin?: number | [number, number, number, number];
}

/**
 * Télécharge directement un élément DOM au format PDF A4 Paysage (ou Portrait).
 */
export async function exportElementToPdf(
  elementIdOrElement: string | HTMLElement,
  options: ExportPdfOptions = {}
): Promise<void> {
  const element =
    typeof elementIdOrElement === 'string'
      ? document.getElementById(elementIdOrElement)
      : elementIdOrElement;

  if (!element) {
    console.error('Élément cible introuvable pour la génération du PDF:', elementIdOrElement);
    alert('Impossible de générer le PDF : document cible introuvable.');
    return;
  }

  const orientation = options.orientation || 'landscape';
  const rawFilename = options.filename || `EEV_Document_${new Date().toISOString().slice(0, 10)}`;
  const filename = rawFilename.endsWith('.pdf') ? rawFilename : `${rawFilename}.pdf`;
  const margin: [number, number, number, number] =
    Array.isArray(options.margin) ? options.margin : [8, 8, 8, 8];

  const opt = {
    margin,
    filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4' as const,
      orientation,
    },
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } catch (err: any) {
    console.error('Erreur lors du téléchargement direct du PDF:', err);
    // Fallback gracieux vers l'impression native du navigateur
    window.print();
  }
}
