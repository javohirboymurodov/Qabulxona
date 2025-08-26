const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');

// Font paths
const FONT_PATH = path.join(__dirname, '../assets/fonts');
const DEJAVU_SANS = path.join(FONT_PATH, 'DejaVuSans.ttf');
const DEJAVU_SANS_BOLD = path.join(FONT_PATH, 'DejaVuSans-Bold.ttf');

// Check if custom fonts exist
const hasCustomFonts = fs.existsSync(DEJAVU_SANS) && fs.existsSync(DEJAVU_SANS_BOLD);

// Font helper functions
const getRegularFont = () => hasCustomFonts ? 'CustomRegular' : 'Helvetica';
const getBoldFont = () => hasCustomFonts ? 'CustomBold' : 'Helvetica-Bold';

// Corporate color scheme
const colors = {
  primary: [30, 58, 138],      // #1e3a8a - Тўқ кўк
  secondary: [30, 64, 175],    // #1e40af - Ўрта кўк  
  accent: [59, 130, 246],      // #3b82f6 - Очиқ кўк
  text: [31, 41, 55],          // #1f2937 - Тўқ кулранг
  border: [209, 213, 219],     // #d1d5db - Очиқ кулранг
  light: [248, 250, 252]       // #f8fafc - Оч кулранг background
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

// Format time display
const formatTime = (time) => {
  if (!time) return '00:00';
  return time.length === 5 ? time : `${time}:00`;
};

// Main PDF generator function
const generateSchedulePDF = async (scheduleData, selectedDate) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('📄 Server PDFKit: Generating PDF for date:', selectedDate.format('YYYY-MM-DD'));
      console.log(`🎨 Using fonts: ${hasCustomFonts ? 'DejaVu Sans (Custom)' : 'Helvetica (Default)'}`);
      
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

      // Register custom fonts if available
      if (hasCustomFonts) {
        doc.registerFont('CustomRegular', DEJAVU_SANS);
        doc.registerFont('CustomBold', DEJAVU_SANS_BOLD);
      }

      // Collect chunks
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

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
         .font(getBoldFont())
         .text('Қ', margin + 15, currentY + 13);

      // Company name and title
      doc.fillColor(colors.primary)
         .fontSize(24)
         .font(getBoldFont())
         .text('ҚАБУЛХОНА ТИЗИМИ', margin + 50, currentY + 5);
      
      doc.fontSize(18)
         .font(getRegularFont())
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
         .font(getBoldFont())
         .text(`Сана: ${dateInfo.dateStr} (${dateInfo.dayName})`, margin, currentY);
      
      const generatedTime = dayjs().format('DD.MM.YYYY HH:mm');
      doc.fontSize(10)
         .font(getRegularFont())
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
           .font(getBoldFont())
           .text('ХУЛОСАЛАР:', margin, currentY);
        
        currentY += 20;
        
        doc.fillColor(colors.text)
           .fontSize(11)
           .font(getRegularFont());
        
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
           .font(getRegularFont())
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
           .font(getBoldFont())
           .text('ВАҚТ', tableLeft + 10, tableTop + 8)
           .text('ТУР', tableLeft + colWidths[0] + 10, tableTop + 8)
           .text('ТАФСИЛ', tableLeft + colWidths[0] + colWidths[1] + 10, tableTop + 8);
        
        currentY = tableTop + 30;
        
        // Table rows
        items.forEach((item, index) => {
          const typeInfo = getItemTypeInfo(item.type);
          
          // Calculate row height based on content
          const descriptionLength = (item.description || '').length;
          const descriptionLines = Math.ceil(descriptionLength / 60);
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
             .font(getBoldFont())
             .text(formatTime(item.time), tableLeft + 10, cellY);
          
          // Type column
          doc.fillColor(typeInfo.color)
             .fontSize(11)
             .font(getBoldFont())
             .text(`${typeInfo.emoji} ${typeInfo.label}`, 
                   tableLeft + colWidths[0] + 10, cellY);
          
          // Details column
          const detailX = tableLeft + colWidths[0] + colWidths[1] + 10;
          const maxWidth = colWidths[2] - 20;
          
          // Title
          doc.fillColor(colors.text)
             .fontSize(12)
             .font(getBoldFont())
             .text(item.title || 'Номаълум', detailX, cellY, {
               width: maxWidth
             });
          
          cellY += 15;
          
          // Description
          if (item.description) {
            doc.fontSize(10)
               .font(getRegularFont())
               .text(item.description, detailX, cellY, {
                 width: maxWidth
               });
            cellY += descriptionLines * 12;
          }
          
          // Type-specific details
          doc.fontSize(9)
             .font(getRegularFont());
          
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
         .font(getRegularFont())
         .text('Тасдиқлади: ________________________________', margin, currentY)
         .text('(Раҳбар имзоси ва санаси)', margin, currentY + 15);
      
      // Page number
      doc.fontSize(8)
         .font(getRegularFont())
         .text('Саҳифа: 1/1', pageWidth - margin - 40, pageHeight - 20);

      // Finalize PDF
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateSchedulePDF
};