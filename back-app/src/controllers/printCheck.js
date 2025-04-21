const printerDefault = require("node-printer");
const PdfPrinter = require("pdfmake");
const fs = require("fs");
const path = require("path");
const saveSalesModel = require("../models/saveSalesModel");
const moment = require("moment");
const { exec } = require("child_process");
const os = require("os");
const { fillColor } = require("pdfkit");

const pdfPrinter = require("pdf-to-printer");

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const generatePDF = async (docDefinition, pdfPath, printer) => {
  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const writeStream = fs.createWriteStream(pdfPath);

      writeStream.on("error", (error) => {
        console.error("Write stream error:", error);
        reject(error);
      });

      pdfDoc.on("error", (error) => {
        console.error("PDF document error:", error);
        reject(error);
      });

      writeStream.on("finish", () => {
        resolve();
      });

      pdfDoc.pipe(writeStream);

      pdfDoc.end();
    } catch (error) {
      console.error("Error in generatePDF:", error);
      reject(error);
    }
  });
};

const getPrinterConfig = (printerName) => {
  let paperWidthMM = 72.1;

  console.log("Detected printer name:", printerName);

  if (printerName) {
    const widerPrinters = [
      "XP-80C",
      "XP80C",
      "80C",
      "TM-T82",
      "TM-T88",
      "XP-58",
      "XP-58C",
    ];

    if (
      printerName.includes("72") ||
      printerName.includes("80") ||
      widerPrinters.some((model) => printerName.includes(model))
    ) {
      paperWidthMM = 72.1;
      console.log("Using 72.1mm width for printer:", printerName);
    } else if (printerName.includes("48") || printerName.includes("58")) {
      paperWidthMM = 48;
      console.log("Using 48mm width for printer:", printerName);
    }
  }

  const paperWidthPts = paperWidthMM * 2.83465;
  const printWidthPts = paperWidthPts * 0.95;
  const marginSize = (paperWidthPts - printWidthPts) / 2;

  const scaleFactor = paperWidthMM / 48;

  console.log(`Paper width: ${paperWidthMM}mm, Scale factor: ${scaleFactor}`);

  return {
    paperWidthPts,
    printWidthPts,
    marginSize,
    scaleFactor,
    paperWidthMM,
  };
};

const scaleFontSizes = (styles, scaleFactor) => {
  const scaledStyles = { ...styles };

  Object.keys(scaledStyles).forEach((styleName) => {
    if (scaledStyles[styleName].fontSize) {
      scaledStyles[styleName].fontSize = Math.round(
        scaledStyles[styleName].fontSize
      );
    }

    if (scaledStyles[styleName].margin) {
      scaledStyles[styleName].margin = scaledStyles[styleName].margin.map(
        (margin) => Math.round(margin * scaleFactor)
      );
    }
  });

  return scaledStyles;
};

const printCheckSalesController = {
  getSale: async (req, res) => {
    try {
      const { sales_id } = req.params;
      const { full_title, phone1, phone2, slogan1, slogan2, user_type } =
        req.body;
      // const { printerName } = req.query;

      let printerName = "";

      const getDefault = await pdfPrinter.getDefaultPrinter();

      printerName = getDefault.deviceId;

      const response = await saveSalesModel.getSaleById(sales_id);

      const fontPath = path.join(__dirname, "../fonts/REFSAN.ttf");
      const boldPath = path.join(__dirname, "../fonts/REFSANB.ttf");
      const semiBoldPath = path.join(__dirname, "../fonts/refsanbi.ttf");

      const fonts = {
        Roboto: {
          normal: fontPath,
          bold: boldPath,
          semibold: semiBoldPath,
        },
      };

      const printer = new PdfPrinter(fonts);

      const checksDir = path.join(__dirname, "../checks");
      ensureDirectoryExists(checksDir);

      const timestamp = Date.now();
      const pdfPath = path.join(checksDir, `sale_receipt_${sales_id}.pdf`);

      let total_count = 0;
      let total_sum = 0;

      const printerConfig = getPrinterConfig(printerName);

      const {
        paperWidthPts,
        printWidthPts,
        marginSize,
        scaleFactor,
        paperWidthMM,
      } = printerConfig;

      console.log(
        `Using printer width: ${paperWidthMM}mm (${paperWidthPts}pts) with scale factor: ${scaleFactor}`
      );

      const productData = response.products
        .map((product, index) => {
          total_count += Number(product.quantity);
          total_sum += Number(product.sum);

          return [
            {
              text: `${index + 1}. ${product.product_name}`,
              style: "productName",
            },
            {
              columns: [
                {
                  text: `${product.quantity} * ${product.price.toLocaleString(
                    "ru-RU"
                  )}`,
                  style: "productQuantity",
                  semibold: true,
                },
                {
                  text: `= ${product.sum.toLocaleString("ru-RU")}`,
                  style: "productTotal",
                  bold: true,
                },
              ],
            },
          ];
        })
        .flat();

      let total_price =
        Number(response.total_price) - Number(response.details[0].discount);

      let paid_price = 0;

      response.payments.map((payment) => {
        if (payment.sum) {
          paid_price += payment.sum;
        }
      });

      let nasiya_price = total_price - paid_price;

      const baseStyles = {
        header: {
          fontSize: 10 * scaleFactor,
          bold: true,
          alignment: "center",
          margin: [0, 2, 0, 0],
        },
        subheader: {
          fontSize: 7 * scaleFactor,
          bold: true,
          alignment: "center",
          margin: [0, 3, 0, 1],
        },
        subheaderSlogan: {
          fontSize: 9,
          alignment: "center",
          margin: [0, 2, 0, 1],
        },
        textLeft: {
          fontSize: 8,
          alignment: "left",
          margin: [0, 1, 0, 1],
        },
        textRight: {
          fontSize: 6 * scaleFactor - 1,
          alignment: "right",
          margin: [0, 1, 0, 1],
        },
        textRightSum: {
          fontSize: 8,
          alignment: "right",
          margin: [0, 1, 0, 1],
        },
        textCenter: {
          fontSize: 8,
          alignment: "center",
          margin: [0, 1, 0, 1],
        },
        tableHeader: {
          fontSize: 6,
          alignment: "center",
          fillColor: "#f3f3f3",
          bold: true,
        },
        tableHeaderTotal: {
          bold: true,
          fontSize: 8,
          alignment: "center",
          fillColor: "#f3f3f3",
        },
        tableBody: {
          fontSize: 5,
          alignment: "left",
          bold: true,
          margin: [0, 3, 0, 0],
        },
        extraBoldText: {
          bold: true,
        },
        productName: {
          fontSize: 9,
          margin: [0, 2, 0, 0],
        },
        productQuantity: {
          fontSize: 9,
          alignment: "left",
          margin: [0, 4, 0, 2],
        },
        productTotal: {
          fontSize: 9,
          alignment: "right",
          margin: [0, 4, 0, 2],
        },
      };

      const scaledStyles = scaleFontSizes(baseStyles, scaleFactor);

      const docDefinition = {
        pageSize: {
          width: paperWidthPts,
          height: "auto",
        },
        pageOrientation: "portrait",
        pageMargins: [
          marginSize,
          2 * scaleFactor,
          marginSize,
          15 * scaleFactor,
        ],
        content: [
          { text: full_title, style: "header" },
          { text: phone1, style: "subheader" },
          { text: phone2, style: "subheader" },

          {
            columns: [
              {
                text: "Сана:",
                style: "textLeft",
                bold: true,
                margin: [0, 10 * scaleFactor, 0, 0],
                color: "#000",
              },
              {
                text: moment(response.date).format("DD.MM.YYYY HH:mm"),
                style: "textRight",
                margin: [0, 10 * scaleFactor, 0, 0],
                bold: true,
              },
            ],
          },
          {
            columns: [
              { text: "Сотувчи:", style: "textLeft", bold: true },
              { text: user_type, style: "textRight", bold: true },
            ],
          },
          ...(response.client_id !== "00000000-0000-0000-0000-000000000000"
            ? [
                {
                  columns: [
                    { text: "Клиент:", style: "textLeft", bold: true },
                    {
                      text: response.client_name,
                      style: "textRight",
                      margin: [0, 0, 0, 5 * scaleFactor],
                      bold: true,
                    },
                  ],
                },
              ]
            : []),

          {
            table: {
              widths: ["*"],
              body: [
                [
                  {
                    canvas: [
                      {
                        type: "line",
                        x1: 0,
                        y1: 0,
                        x2: 400,
                        y2: 0, // safe width for A4 with 40pt margins (595 - 2*40)
                        lineWidth: 2,
                        dash: { length: 2, space: 2 },
                        lineColor: "#000",
                      },
                    ],
                  },
                ],
              ],
            },
            layout: "noBorders",
            margin: [0, 10, 0, 10],
          },
          productData,
          {
            table: {
              widths: ["*"],
              body: [
                [
                  {
                    canvas: [
                      {
                        type: "line",
                        x1: 0,
                        y1: 0,
                        x2: 400,
                        y2: 0, // safe width for A4 with 40pt margins (595 - 2*40)
                        lineWidth: 2,
                        dash: { length: 2, space: 2 },
                        lineColor: "#000",
                      },
                    ],
                  },
                ],
              ],
            },
            layout: "noBorders",
            margin: [0, 10, 0, 10],
          },
          {
            columns: [
              {
                text: "Савдо: ",
                style: "textLeft",
                margin: [0, 5 * scaleFactor, 0, 0],
                bold: true,
              },
              {
                text: `${Number(response.total_price).toLocaleString("ru-RU", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
                style: ["textRightSum", "extraBoldText"],
                margin: [0, 5 * scaleFactor, 0, 0],
              },
            ],
          },

          {
            columns: [
              {
                text: "Скидка:",
                style: "textLeft",
                bold: true,
              },
              {
                text: `${Number(response.details[0].discount).toLocaleString(
                  "ru-RU",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}`,
                style: ["textRightSum", "extraBoldText"],
              },
            ],
          },
          {
            columns: [
              {
                text: "Тўлов учун:",
                style: "textLeft",

                bold: true,
              },
              {
                text: `${Number(total_price).toLocaleString("ru-RU", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
                style: ["textRightSum", "extraBoldText"],
              },
            ],
          },
          {
            columns: [
              { text: "Тўланди:", style: "textLeft", bold: true },
              {
                text: `${paid_price.toLocaleString("ru-RU", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
                style: ["textRightSum", "extraBoldText"],
              },
            ],
          },

          ...(nasiya_price == 0
            ? []
            : [
                {
                  columns: [
                    { text: "Насия:", style: "textLeft", bold: true },
                    {
                      text: `${nasiya_price.toLocaleString("ru-RU", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`,
                      style: ["textRightSum", "extraBoldText"],
                    },
                  ],
                },
              ]),

          {
            table: {
              widths: ["*"],
              body: [
                [
                  {
                    canvas: [
                      {
                        type: "line",
                        x1: 0,
                        y1: 0,
                        x2: 400,
                        y2: 0, // safe width for A4 with 40pt margins (595 - 2*40)
                        lineWidth: 2,
                        dash: { length: 2, space: 2 },
                        lineColor: "#000",
                      },
                    ],
                  },
                ],
              ],
            },
            layout: "noBorders",
            margin: [0, 10, 0, 10],
          },

          {
            text: slogan1,
            style: "subheaderSlogan",
            bold: true,
          },
          {
            text: slogan2,
            style: "textCenter",
            paddingBottom: 20 * scaleFactor,
          },
          ...(slogan1 == "" && slogan2 == ""
            ? []
            : [
                {
                  table: {
                    widths: ["*"],
                    body: [
                      [
                        {
                          canvas: [
                            {
                              type: "line",
                              x1: 0,
                              y1: 0,
                              x2: 400,
                              y2: 0, // safe width for A4 with 40pt margins (595 - 2*40)
                              lineWidth: 2,
                              dash: { length: 2, space: 2 },
                              lineColor: "#000",
                            },
                          ],
                        },
                      ],
                    ],
                  },
                  layout: "noBorders",
                  margin: [0, 10, 0, 10],
                },
              ]),
        ],
        styles: scaledStyles,
      };

      await generatePDF(docDefinition, pdfPath, printer);

      const fileStats = await fs.promises.stat(pdfPath);
      if (fileStats.size === 0) {
        throw new Error("Generated PDF is empty");
      }

      await pdfPrinter.print(pdfPath, {
        printer: printerName || "XP-80C",
      });

      res.json({
        success: true,
        message: `Receipt printed successfully on ${paperWidthMM}mm printer`,
        filePath: pdfPath,
        printerWidth: paperWidthMM,
        scaleFactor: scaleFactor,
      });
    } catch (error) {
      console.error("Error in getSale:", error);

      if (error.code === "ENOENT") {
        res.status(500).json({
          error: "Failed to generate PDF",
          details: error.message,
        });
      } else {
        res.status(500).json({
          error: "Internal server error",
          details: error.message,
        });
      }
    }
  },
};

module.exports = printCheckSalesController;
