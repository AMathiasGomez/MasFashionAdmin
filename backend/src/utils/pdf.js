const PDFDocument = require('pdfkit');

const createPdfReport = ({ title, columns, rows, generatedAt }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: 'A4', layout: 'landscape' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text(title, { continued: false });
    doc.moveDown(0.25);
    doc.fontSize(9).fillColor('#666666').text(`Generado: ${generatedAt.toLocaleString('es-CO')}`);
    doc.moveDown();

    const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = usableWidth / Math.min(columns.length, 8);
    const visibleColumns = columns.slice(0, 8);

    const drawHeader = () => {
      doc.fillColor('#ffffff').rect(doc.x, doc.y, usableWidth, 22).fill('#2f6f64');
      doc.fillColor('#ffffff').fontSize(8);
      const startY = doc.y + 6;
      visibleColumns.forEach((column, index) => {
        doc.text(column.header, doc.page.margins.left + index * colWidth + 4, startY, {
          width: colWidth - 8,
          ellipsis: true
        });
      });
      doc.y = startY + 18;
      doc.fillColor('#202721');
    };

    drawHeader();

    rows.forEach((row) => {
      if (doc.y > doc.page.height - doc.page.margins.bottom - 24) {
        doc.addPage();
        drawHeader();
      }

      const y = doc.y + 4;
      visibleColumns.forEach((column, index) => {
        const value = row[column.key] === null || row[column.key] === undefined ? '-' : String(row[column.key]);
        doc.fontSize(8).text(value, doc.page.margins.left + index * colWidth + 4, y, {
          width: colWidth - 8,
          height: 20,
          ellipsis: true
        });
      });
      doc.y = y + 22;
      doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor('#dde4dc').stroke();
    });

    doc.end();
  });

module.exports = {
  createPdfReport
};

