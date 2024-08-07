const jsQR = require('jsqr');
const Jimp = require('jimp');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const saveImage = async (fileBuffer, fileName) => {
    const filePath = path.join(__dirname, fileName);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, fileBuffer);
    return filePath;
};

// Function to read the QR code from the image
const readQRCode = async (fileBuffer, fileName) => {
    try {
        const filePath = await saveImage(fileBuffer, fileName);
        console.log("filePath", filePath);
        const image = await Jimp.read(filePath);
        const imageData = {
            data: new Uint8ClampedArray(image.bitmap.data),
            width: image.bitmap.width,
            height: image.bitmap.height
        };
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
        if (qrCode) {
            return qrCode.data;
        } else {
            throw new Error("QR Code not detected");
        }
    } catch (err) {
        console.error('Error reading QR code:', err);
        throw err;
    }
};

// Function to create a PDF from the extracted QR code data and include the image
const createPDF = async (data, imagePath) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    // Add title to the center
    const title = 'QR Scan Code';
    const titleFontSize = 20;
    const textWidth = font.widthOfTextAtSize(title, titleFontSize);
    const textX = (page.getWidth() - textWidth) / 2;
    const textY = 800;

    page.drawText(title, { x: textX, y: textY, size: titleFontSize, font });

    // Embed and draw the image
    const imageBytes = fs.readFileSync(imagePath);
    let image;
    if (imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg')) {
        image = await pdfDoc.embedJpg(imageBytes);
    } else if (imagePath.endsWith('.png')) {
        image = await pdfDoc.embedPng(imageBytes);
    } else {
        throw new Error("Unsupported image format");
    }

    // Set image size 
    const imageWidth = 350;
    const imageHeight = 350;
    const imageX = 50; // Left aligned
    const imageY = 750 - titleFontSize - 10-100;
    page.drawImage(image, {
        x: imageX,
        y: imageY,
        width: imageWidth,
        height: imageHeight,
    });

    const titleData = 'QR Scan Result';
    const titleFontSizeData = 20;
    const textWidthData = font.widthOfTextAtSize(titleData, titleFontSizeData);
    const textXData = (page.getWidth() - textWidthData) / 2;
    const textYData = imageY - 100;
    page.drawText(titleData, { x: textXData, y: textYData, size: titleFontSizeData, font });
    // Add extracted data below the image
    const chunks = data.match(/.{1,40}/g);
    let x = 150;
    let y = textYData - imageHeight - 10+200; // Start below the image
    const lineHeight = 20;
    const fontSize = 12;

    for (const chunk of chunks) {
        page.drawText(chunk.trim(), {
            x,
            y,
            size: fontSize,
            font,
        });
        y -= lineHeight;
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
};

// Controller function to handle QR code reading and PDF generation
exports.getQrDetails = async (req, res) => {
    try {
        if (!req.files || !req.files.qrImage) {
            return res.status(400).send('No files were uploaded.');
        }

        const fileBuffer = req.files.qrImage.data;
        const fileName = req.files.qrImage.name;
        const extractedData = await readQRCode(fileBuffer, fileName);
        console.log("Extracted QR Code data:", extractedData);

        const pdfBytes = await createPDF(extractedData, path.join(__dirname, fileName));
        const pdfName = fileName.replace(/\.[^/.]+$/, "") + ".pdf";
        // specify the path for storing the downloaded file
        const storageDirectoryPath = 'C:/Users/Ainan/Downloads';
        const pdfPath = path.join(storageDirectoryPath, pdfName);
        fs.writeFileSync(pdfPath, pdfBytes);

        // Delete the uploaded image file
        fs.unlinkSync(path.join(__dirname, fileName));

        res.json({ extractedData });
    } catch (error) {
        console.log("Error reading QR code:", error);
        res.status(500).send('Error reading QR code.');
    }
};