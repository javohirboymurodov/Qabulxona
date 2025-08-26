import PDFDocument from 'pdfkit';
import blobStream from 'blob-stream';
import QRCode from 'qrcode';
import dayjs from 'dayjs';
import 'dayjs/locale/uz';
import { Buffer } from 'buffer';

// Import font files as URLs for Vite
import DejaVuSansFont from '../assets/fonts/DejaVuSans.ttf?url';
import DejaVuSansBoldFont from '../assets/fonts/DejaVuSans-Bold.ttf?url';

dayjs.locale('uz');

// Corporate color scheme
const colors = {
  primary: '#1e3a8a',    // Тўқ кўк (corporate)
  secondary: '#1e40af',  // Ўрта кўк  
  accent: '#3b82f6',     // Очиқ кўк
  text: '#1f2937',       // Тўқ кулранг
  border: '#d1d5db',     // Очиқ кулранг
  light: '#f8fafc'       // Оч кулранг background
};

// Convert hex to RGB for PDFKit
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255, 
    parseInt(result[3], 16) / 255
  ] : [0, 0, 0];
};

// Generate QR code data URL
const generateQRCode = async (data) => {
  try {
    return await QRCode.toDataURL(data, {
      width: 150,
      margin: 1,
      color: {
        dark: colors.primary,
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('QR Code generation error:', error);
    return null;
  }
};

// Format time display
const formatTime = (time) => {
  if (!time) return '00:00';
  return time.length === 5 ? time : `${time}:00`;
};

// Get item type info in Cyrillic
const getItemTypeInfo = (type) => {
  switch (type) {
    case 'task':
      return { emoji: '📋', label: 'Вазифа', color: colors.primary };
    case 'reception':
      return { emoji: '👤', label: 'Қабул', color: colors.secondary };
    case 'meeting':
      return { emoji: '🤝', label: 'Мажлис', color: colors.accent };
    default:
      return { emoji: '📄', label: 'Иш', color: colors.text };
  }
};

// Uzbek Cyrillic month and day names
const monthNames = [
  'Январ', 'Феврал', 'Март', 'Апрел', 'Май', 'Июн',
  'Июл', 'Август', 'Сентябр', 'Октябр', 'Ноябр', 'Декабр'
];

const dayNames = [
  'Якшанба', 'Душанба', 'Сешанба', 'Чоршанба', 
  'Пайшанба', 'Жума', 'Шанба'
];

// Format date in Uzbek Cyrillic
const formatDateUz = (date) => {
  const day = date.date();
  const month = monthNames[date.month()];
  const year = date.year();
  const dayName = dayNames[date.day()];
  
  return {
    dateStr: `${day} ${month} ${year}`,
    dayName: dayName
  };
};

// Main PDF generator function
export const generateSchedulePDF = async (scheduleData, selectedDate) => {
  try {
    console.log('📄 PDFKit: Generating PDF for date:', selectedDate.format('YYYY-MM-DD'));
    console.log('📊 Schedule data:', scheduleData);

    // Create new PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50, 
        right: 50
      },
      info: {
        Title: `Раҳбар Иш Графиги - ${selectedDate.format('DD.MM.YYYY')}`,
        Author: 'Қабулхона Тизими',
        Subject: 'Кунлик иш режаси',
        Creator: 'Қабулхона Тизими PDF Generator'
      }
    });

    // Load and register custom fonts for Cyrillic support
    const fontBuffers = await Promise.all([
      fetch(DejaVuSansFont).then(res => res.arrayBuffer()),
      fetch(DejaVuSansBoldFont).then(res => res.arrayBuffer())
    ]);
    
    doc.registerFont('DejaVuSans', Buffer.from(fontBuffers[0]));
    doc.registerFont('DejaVuSans-Bold', Buffer.from(fontBuffers[1]));

    // Create blob stream
    const stream = doc.pipe(blobStream());

    // Page dimensions
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);

    let currentY = margin;

    // ===================
    // HEADER SECTION
    // ===================
    
    // Company logo (circle with Q)
    doc.circle(margin + 20, currentY + 20, 15)
       .fillColor(colors.primary)
       .fill();
    
    doc.fillColor('white')
       .fontSize(16)
       .font('DejaVuSans-Bold')
       .text('Қ', margin + 15, currentY + 13);

    // Company name and title
    doc.fillColor(colors.primary)
       .fontSize(24)
       .font('DejaVuSans-Bold')
       .text('ҚАБУЛХОНА ТИЗИМИ', margin + 50, currentY + 5);
    
    doc.fontSize(18)
       .font('DejaVuSans')
       .text('РАҲБАР ИШ ГРАФИГИ', margin + 50, currentY + 35);

    currentY += 70;

    // Horizontal line
    doc.strokeColor(colors.border)
       .lineWidth(1)
       .moveTo(margin, currentY)
       .lineTo(pageWidth - margin, currentY)
       .stroke();

    currentY += 15;

    // Date information
    const dateInfo = formatDateUz(selectedDate);
    
    doc.fillColor(colors.text)
       .fontSize(14)
       .font('DejaVuSans-Bold')
       .text(`Сана: ${dateInfo.dateStr} (${dateInfo.dayName})`, margin, currentY);
    
    const generatedTime = dayjs().format('DD.MM.YYYY HH:mm');
    doc.fontSize(10)
       .font('DejaVuSans')
       .text(`Тайёрланди: ${generatedTime}`, margin, currentY + 20);

    currentY += 50;

    // ===================
    // SUMMARY SECTION
    // ===================
    
    const summary = scheduleData?.summary || {};
    const totalItems = summary.totalItems || 0;
    
    if (totalItems > 0) {
      // Summary line
      doc.strokeColor(colors.border)
         .moveTo(margin, currentY)
         .lineTo(pageWidth - margin, currentY)
         .stroke();
      
      currentY += 15;
      
      doc.fillColor(colors.primary)
         .fontSize(14)
         .font('DejaVuSans-Bold')
         .text('ХУЛОСАЛАР:', margin, currentY);
      
      currentY += 20;
      
      doc.fillColor(colors.text)
         .fontSize(11)
         .font('DejaVuSans');
      
      const summaryTexts = [
        `📋 Жами: ${totalItems} та иш режаси`,
        `📋 Вазифалар: ${summary.totalTasks || 0}`,
        `👤 Қабуллар: ${summary.totalReceptions || 0}`,
        `🤝 Мажлислар: ${summary.totalMeetings || 0}`
      ];
      
      // Display summary in 2 columns
      summaryTexts.forEach((text, index) => {
        const x = margin + (index % 2) * 250;
        const y = currentY + Math.floor(index / 2) * 15;
        doc.text(text, x, y);
      });
      
      currentY += Math.ceil(summaryTexts.length / 2) * 15 + 20;
    }

    // ===================
    // SCHEDULE TABLE
    // ===================
    
    const items = scheduleData?.items || [];
    
    if (items.length === 0) {
      // Empty state
      doc.fillColor(colors.text)
         .fontSize(16)
         .font('DejaVuSans')
         .text('Бу кун учун иш режаси мавжуд эмас', margin, currentY + 30);
    } else {
      // Table header
      const tableTop = currentY;
      const tableLeft = margin;
      const colWidths = [80, 80, contentWidth - 160]; // ВАҚТ, ТУР, ТАФСИЛ
      
      // Header background
      doc.rect(tableLeft, tableTop, contentWidth, 25)
         .fillColor(colors.primary)
         .fill();
      
      // Header text
      doc.fillColor('white')
         .fontSize(12)
         .font('DejaVuSans-Bold')
         .text('ВАҚТ', tableLeft + 10, tableTop + 8)
         .text('ТУР', tableLeft + colWidths[0] + 10, tableTop + 8)
         .text('ТАФСИЛ', tableLeft + colWidths[0] + colWidths[1] + 10, tableTop + 8);
      
      currentY = tableTop + 30;
      
      // Table rows
      items.forEach((item, index) => {
        const typeInfo = getItemTypeInfo(item.type);
        
        // Calculate row height based on content
        const descriptionLines = item.description ? 
          Math.ceil(item.description.length / 60) : 1;
        const detailLines = 1 + descriptionLines + 
          (item.position ? 1 : 0) + 
          (item.department ? 1 : 0) + 
          (item.location ? 1 : 0);
        const rowHeight = Math.max(30, detailLines * 12 + 10);
        
        // Check if we need a new page
        if (currentY + rowHeight > pageHeight - 100) {
          doc.addPage();
          currentY = margin;
        }
        
        // Zebra striping
        if (index % 2 === 0) {
          doc.rect(tableLeft, currentY, contentWidth, rowHeight)
             .fillColor(colors.light)
             .fill();
        }
        
        // Row borders
        doc.strokeColor(colors.border)
           .lineWidth(0.5)
           .rect(tableLeft, currentY, contentWidth, rowHeight)
           .stroke();
        
        // Vertical separators
        doc.moveTo(tableLeft + colWidths[0], currentY)
           .lineTo(tableLeft + colWidths[0], currentY + rowHeight)
           .stroke();
        
        doc.moveTo(tableLeft + colWidths[0] + colWidths[1], currentY)
           .lineTo(tableLeft + colWidths[0] + colWidths[1], currentY + rowHeight)
           .stroke();
        
        // Cell content
        let cellY = currentY + 10;
        
        // Time column
        doc.fillColor(colors.text)
           .fontSize(12)
           .font('DejaVuSans-Bold')
           .text(formatTime(item.time), tableLeft + 10, cellY);
        
        // Type column
        doc.fillColor(typeInfo.color)
           .fontSize(11)
           .font('DejaVuSans-Bold')
           .text(`${typeInfo.emoji} ${typeInfo.label}`, 
                 tableLeft + colWidths[0] + 10, cellY);
        
        // Details column
        const detailX = tableLeft + colWidths[0] + colWidths[1] + 10;
        
        // Title
        doc.fillColor(colors.text)
           .fontSize(12)
           .font('DejaVuSans-Bold')
           .text(item.title || 'Номаълум', detailX, cellY, {
             width: colWidths[2] - 20
           });
        
        cellY += 15;
        
        // Description
        if (item.description) {
          doc.fontSize(10)
             .font('DejaVuSans')
             .text(item.description, detailX, cellY, {
               width: colWidths[2] - 20
             });
          cellY += descriptionLines * 12;
        }
        
        // Type-specific details
        doc.fontSize(9)
           .font('DejaVuSans');
        
        if (item.type === 'reception') {
          if (item.position) {
            doc.text(`💼 ${item.position}`, detailX, cellY);
            cellY += 12;
          }
          if (item.department) {
            doc.text(`🏢 ${item.department}`, detailX, cellY);
            cellY += 12;
          }
        } else if (item.type === 'meeting') {
          if (item.location) {
            doc.text(`📍 ${item.location}`, detailX, cellY);
            cellY += 12;
          }
          if (item.participants?.length) {
            doc.text(`👥 ${item.participants.length} иштирокчи`, detailX, cellY);
            cellY += 12;
          }
        }
        
        currentY += rowHeight + 1;
      });
    }

    // ===================
    // FOOTER SECTION
    // ===================
    
    // Move to footer area
    currentY = pageHeight - 80;
    
    // Signature line
    doc.strokeColor(colors.border)
       .moveTo(margin, currentY)
       .lineTo(pageWidth - margin, currentY)
       .stroke();
    
    currentY += 15;
    
    doc.fillColor(colors.text)
       .fontSize(11)
       .font('DejaVuSans')
       .text('Тасдиқлади: ________________________________', margin, currentY)
       .text('(Раҳбар имзоси ва санаси)', margin, currentY + 15);
    
    // QR Code
    const qrData = `${window.location.origin}/schedule/${selectedDate.format('YYYY-MM-DD')}`;
    const qrCodeDataUrl = await generateQRCode(qrData);
    
    if (qrCodeDataUrl) {
      // Convert data URL to buffer for PDFKit
      const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      doc.image(qrBuffer, pageWidth - margin - 60, currentY - 10, {
        width: 50,
        height: 50
      });
      
      doc.fontSize(8)
         .text('Рақамли тасдиқлаш', pageWidth - margin - 65, currentY + 45);
    }
    
    // Page number
    doc.fontSize(8)
       .text('Саҳифа: 1/1', pageWidth - margin - 40, pageHeight - 20);

    // ===================
    // FINALIZE PDF
    // ===================
    
    doc.end();
    
    // Return promise that resolves when PDF is ready
    return new Promise((resolve, reject) => {
      stream.on('finish', function() {
        try {
          const blob = stream.toBlob('application/pdf');
          const fileName = `Rahbar_Ish_Grafigi_${selectedDate.format('YYYY-MM-DD')}.pdf`;
          
          // Create download link
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          console.log('✅ PDFKit: PDF generated successfully:', fileName);
          
          resolve({
            success: true,
            fileName: fileName,
            message: 'PDF муваффақиятли яратилди ва юклаб олинди'
          });
        } catch (error) {
          reject(error);
        }
      });
      
      stream.on('error', reject);
    });
    
  } catch (error) {
    console.error('❌ PDFKit: PDF generation error:', error);
    return {
      success: false,
      error: error.message,
      message: 'PDF яратишда хатолик юз берди'
    };
  }
};