import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Normalizza elementi per html2canvas, convertendo eventuali colori oklch/moderni
 * in formati RGB standard compatibili con il parser di html2canvas.
 */
function sanitizeStylesForCanvas(clonedDoc: Document) {
  const dummyCanvas = document.createElement('canvas');
  const dummyCtx = dummyCanvas.getContext('2d');
  if (!dummyCtx) return;

  const allElements = clonedDoc.querySelectorAll<HTMLElement>('*');
  allElements.forEach((el) => {
    try {
      const computed = window.getComputedStyle(el);
      const propsToCheck = ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor'];
      
      propsToCheck.forEach((prop) => {
        const val = (computed as any)[prop];
        if (typeof val === 'string' && (val.includes('oklch') || val.includes('color('))) {
          dummyCtx.fillStyle = '#000000';
          dummyCtx.fillStyle = val;
          (el.style as any)[prop] = dummyCtx.fillStyle;
        }
      });
    } catch {
      // Ignora errori minori di lettura stile
    }
  });
}

/**
 * Genera e scarica un file PDF multipagina di alta qualità a partire da un elemento HTML.
 */
export async function downloadPdfFromElement(element: HTMLElement, fileName: string): Promise<boolean> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        sanitizeStylesForCanvas(clonedDoc);
        const clonedElement = clonedDoc.getElementById(element.id) || clonedDoc.querySelector('.print-page');
        if (clonedElement instanceof HTMLElement) {
          clonedElement.style.boxShadow = 'none';
          clonedElement.style.border = 'none';
          clonedElement.style.margin = '0 auto';
        }
      }
    });

    const imgWidth = 210; // A4 standard width in mm
    const pageHeight = 297; // A4 standard height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Prima pagina
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Pagine successive per documenti lunghi
    while (heightLeft > 0) {
      position = position - pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const safeName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    pdf.save(safeName);
    return true;
  } catch (error) {
    console.error('Errore durante la generazione del PDF con html2canvas:', error);
    return false;
  }
}

/**
 * Apre il documento formattato per la stampa in una nuova scheda del browser.
 * Nella nuova scheda il comando window.print() funziona al 100% nativamente
 * senza blocchi sandbox dell'iframe.
 */
export function openPrintableDocumentInNewTab(element: HTMLElement, documentTitle: string): boolean {
  try {
    const contentHtml = element.outerHTML;
    
    // Raccoglie tutti i fogli di stile attuali per conservare Tailwind e font
    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    const standaloneHtml = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentTitle} - Stampa</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  ${styleTags}
  <style>
    @media print {
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print-toolbar {
        display: none !important;
      }
      .print-page {
        box-shadow: none !important;
        border: none !important;
        margin: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
      }
    }
    @media screen {
      body {
        background-color: #f1f5f9;
        padding: 24px 16px 60px 16px;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      }
      .no-print-toolbar {
        max-width: 210mm;
        margin: 0 auto 20px auto;
        background: #0f172a;
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      }
      .btn-print {
        background: #d97706;
        color: white;
        border: none;
        padding: 8px 18px;
        font-size: 13px;
        font-weight: 700;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .btn-print:hover {
        background: #b45309;
      }
      .print-page {
        background: white;
        max-width: 210mm;
        margin: 0 auto;
        box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1);
        border-radius: 12px;
        padding: 40px;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-toolbar">
    <div>
      <strong style="font-size: 14px;">${documentTitle}</strong>
      <div style="font-size: 12px; opacity: 0.8;">Anteprima di Stampa A4 per browser</div>
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="btn-print" onclick="window.print()">
        🖨️ Stampa o Salva PDF
      </button>
      <button onclick="window.close()" style="background: transparent; border: 1px solid #475569; color: #cbd5e1; padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer;">
        Chiudi
      </button>
    </div>
  </div>

  ${contentHtml}

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>`;

    const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const newWindow = window.open(blobUrl, '_blank');
    
    if (!newWindow) {
      // Se il browser ha bloccato il popup, creiamo un link di download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.target = '_blank';
      a.click();
    }
    return true;
  } catch (error) {
    console.error('Errore durante l\'apertura della scheda di stampa:', error);
    return false;
  }
}
