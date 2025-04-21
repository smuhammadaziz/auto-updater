const fs = require("fs");
const PDFDocument = require("pdfkit");

const generateReceiptPDF = (sale, outputPath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [58, 297],
      margin: 2,
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    doc.font("Helvetica").fontSize(8);

    doc.text(`Device ID: ${sale.device_id}`);
    doc.text(`KSB ID: ${sale.ksb_id}`);
    doc.text(`Sale ID: ${sale.id}`);
    doc.text(`Date: ${new Date(sale.date).toLocaleString()}`);
    doc.moveDown();

    doc.text("Items:");
    sale.products.forEach((product, index) => {
      doc.text(`${index + 1}. ${product.product} x${product.quantity}`);
    });

    doc.end();

    stream.on("finish", () => resolve(outputPath));
    stream.on("error", reject);
  });
};

module.exports = { generateReceiptPDF };
