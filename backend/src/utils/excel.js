const ExcelJS = require('exceljs');

const createExcelReport = async ({ title, columns, rows, generatedAt }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Clothing Admin';
  workbook.created = generatedAt;

  const sheet = workbook.addWorksheet(title.slice(0, 31));
  sheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.key,
    width: column.width || 16
  }));

  sheet.spliceRows(1, 0, [title]);
  sheet.mergeCells(1, 1, 1, columns.length);
  sheet.getCell(1, 1).font = { bold: true, size: 16 };
  sheet.getCell(1, 1).alignment = { vertical: 'middle' };

  sheet.spliceRows(2, 0, [`Generado: ${generatedAt.toLocaleString('es-CO')}`]);
  sheet.mergeCells(2, 1, 2, columns.length);
  sheet.getCell(2, 1).font = { color: { argb: '666666' } };

  sheet.addRow([]);
  sheet.addRow(columns.map((column) => column.header));

  const headerRow = sheet.getRow(4);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2F6F64' }
  };

  rows.forEach((row) => {
    sheet.addRow(columns.map((column) => row[column.key]));
  });

  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFDDE4DC' } },
        left: { style: 'thin', color: { argb: 'FFDDE4DC' } },
        bottom: { style: 'thin', color: { argb: 'FFDDE4DC' } },
        right: { style: 'thin', color: { argb: 'FFDDE4DC' } }
      };
    });
  });

  return workbook.xlsx.writeBuffer();
};

module.exports = {
  createExcelReport
};

