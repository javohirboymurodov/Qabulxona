const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');

// Font and logo paths
const FONT_PATH = path.join(__dirname, '../assets/fonts');
const LOGO_PATH = path.join(__dirname, '../assets/images');
const DEJAVU_SANS = path.join(FONT_PATH, 'DejaVuSans.ttf');
const DEJAVU_SANS_BOLD = path.join(FONT_PATH, 'DejaVuSans-Bold.ttf');
const COMPANY_LOGO = path.join(LOGO_PATH, 'logo.png'); // or logo.jpg

// Check if custom fonts and logo exist
const hasCustomFonts = fs.existsSync(DEJAVU_SANS) && fs.existsSync(DEJAVU_SANS_BOLD);
const hasCompanyLogo = fs.existsSync(COMPANY_LOGO) || fs.existsSync(path.join(LOGO_PATH, 'logo.jpg'));

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
      
      // Create new PDF document with proper margins
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 60,
          bottom: 80,
          left: 40, 
          right: 40
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
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);
      const headerHeight = 80;
      const footerHeight = 60;
      const contentHeight = pageHeight - headerHeight - footerHeight;

      let currentY = margin;

      // ===================
      // HEADER SECTION
      // ===================
      
      // Company logo - use actual logo if available, otherwise fallback
      if (hasCompanyLogo) {
        try {
          // Try PNG first, then JPG
          const logoPath = fs.existsSync(path.join(LOGO_PATH, 'logo.png')) 
            ? path.join(LOGO_PATH, 'logo.png')
            : path.join(LOGO_PATH, 'logo.jpg');
          
          doc.image(logoPath, margin + 5, currentY + 5, {
            width: 40,
            height: 40
          });
        } catch (error) {
          console.warn('Logo loading failed, using fallback:', error.message);
          // Fallback to circular design
          doc.circle(margin + 25, currentY + 25, 20)
             .fillColor(colors.primary)
             .fill();
          
          doc.circle(margin + 25, currentY + 25, 18)
             .fillColor('white')
             .fill();
             
          doc.fillColor(colors.primary)
             .fontSize(18)
             .font(getBoldFont())
             .text('Қ', margin + 18, currentY + 16);
        }
      } else {
        // Fallback circular logo design
        doc.circle(margin + 25, currentY + 25, 20)
           .fillColor(colors.primary)
           .fill();
        
        doc.circle(margin + 25, currentY + 25, 18)
           .fillColor('white')
           .fill();
           
        doc.fillColor(colors.primary)
           .fontSize(18)
           .font(getBoldFont())
           .text('Қ', margin + 18, currentY + 16);
      }

      // Company name and title with better spacing
      doc.fillColor(colors.primary)
         .fontSize(22)
         .font(getBoldFont())
         .text('ҚАБУЛХОНА ТИЗИМИ', margin + 60, currentY + 8);
      
      doc.fontSize(16)
         .font(getRegularFont())
         .fillColor(colors.text)
         .text('РАҲБАР ИШ ГРАФИГИ', margin + 60, currentY + 32);

      currentY += 65;

      // Horizontal line
      doc.strokeColor(colors.border)
         .lineWidth(1)
         .moveTo(margin, currentY)
         .lineTo(pageWidth - margin, currentY)
         .stroke();

      currentY += 15;

      // Date information in a compact format
      const dateInfo = formatDateUz(selectedDate);
      
      // Date and generated time on same line
      doc.fillColor(colors.text)
         .fontSize(14)
         .font(getBoldFont())
         .text(`Сана: ${dateInfo.dateStr} (${dateInfo.dayName})`, margin, currentY);
      
      const generatedTime = dayjs().format('DD.MM.YYYY HH:mm');
      doc.fontSize(10)
         .font(getRegularFont())
         .text(`Тайёрланди: ${generatedTime}`, pageWidth - margin - 120, currentY + 2);

              currentY += 30;

      // ===================
      // SUMMARY SECTION (Compact)
      // ===================
      
      const summary = scheduleData?.summary || {};
      const totalItems = summary.totalItems || 0;
      
      if (totalItems > 0) {
        // Compact summary with better layout
        doc.fillColor(colors.primary)
           .fontSize(12)
           .font(getBoldFont())
           .text('ХУЛОСАЛАР:', margin, currentY);
        
        currentY += 18;
        
        // Summary stats with proper line breaks to avoid overlap
        doc.fillColor(colors.text)
           .fontSize(10)
           .font(getRegularFont())
           .text(`📋 Жами: ${totalItems} та иш режаси`, margin + 20, currentY);
        
        // Second line with other stats if they exist
        if (summary.totalTasks > 0 || summary.totalReceptions > 0 || summary.totalMeetings > 0) {
          currentY += 14;
          const detailParts = [];
          if (summary.totalTasks > 0) detailParts.push(`📋 Вазифалар: ${summary.totalTasks}`);
          if (summary.totalReceptions > 0) detailParts.push(`👤 Қабуллар: ${summary.totalReceptions}`);
          if (summary.totalMeetings > 0) detailParts.push(`🤝 Мажлислар: ${summary.totalMeetings}`);
          
          doc.text(detailParts.join('  •  '), margin + 20, currentY);
        }
        
        currentY += 25;
      }

      // ===================
      // SCHEDULE TABLE
      // ===================
      
      const items = scheduleData?.items || [];
      
      if (items.length === 0) {
        // Empty state with better positioning
        doc.fillColor(colors.text)
           .fontSize(14)
           .font(getRegularFont())
           .text('Бу кун учун иш режаси мавжуд эмас', margin, currentY + 50, {
             align: 'center',
             width: contentWidth
           });
      } else {
        // Table header with improved spacing
        const tableTop = currentY;
        const tableLeft = margin;
        const colWidths = [80, 90, contentWidth - 170]; // ВАҚТ, ТУР, ТАФСИЛ
        
        // Header background with better height
        doc.rect(tableLeft, tableTop, contentWidth, 30)
           .fillColor(colors.primary)
           .fill();
        
        // Header text with better positioning
        doc.fillColor('white')
           .fontSize(12)
           .font(getBoldFont())
           .text('ВАҚТ', tableLeft + 8, tableTop + 10)
           .text('ТУР', tableLeft + colWidths[0] + 8, tableTop + 10)
           .text('ТАФСИЛ', tableLeft + colWidths[0] + colWidths[1] + 8, tableTop + 10);
        
        currentY = tableTop + 35;
        
        // Table rows - Simplified for consistency with frontend
        items.forEach((item, index) => {
          const typeInfo = getItemTypeInfo(item.type);
          
          // Simplified row height calculation
          const titleLines = Math.ceil((item.title || '').length / 40);
          const descLines = Math.ceil((item.description || '').length / 50);
          const metaLines = (item.position || item.department || item.location) ? 1 : 0;
          const totalLines = titleLines + descLines + metaLines;
          const rowHeight = Math.max(45, totalLines * 16 + 20);
          
          // Page break check
          if (currentY + rowHeight > pageHeight - 120) {
            addPageNumber(1, 1);
            doc.addPage();
            currentY = margin + 20;
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
          
          // Vertical separators with lighter color
          doc.strokeColor('#e5e7eb')
             .lineWidth(0.5)
             .moveTo(tableLeft + colWidths[0], currentY)
             .lineTo(tableLeft + colWidths[0], currentY + rowHeight)
             .stroke();
          
          doc.moveTo(tableLeft + colWidths[0] + colWidths[1], currentY)
             .lineTo(tableLeft + colWidths[0] + colWidths[1], currentY + rowHeight)
             .stroke();
          
          // Simplified cell content
          let cellY = currentY + 15;
          
          // Time column
          doc.fillColor(colors.text)
             .fontSize(12)
             .font(getBoldFont())
             .text(formatTime(item.time), tableLeft + 8, cellY, {
               width: colWidths[0] - 16,
               align: 'center'
             });
          
          // Add end time if exists
          if (item.endTime) {
            doc.fontSize(10)
               .fillColor('#666666')
               .text(formatTime(item.endTime), tableLeft + 8, cellY + 12, {
                 width: colWidths[0] - 16,
                 align: 'center'
               });
          }
          
          // Type column
          doc.fillColor(typeInfo.color)
             .fontSize(10)
             .font(getBoldFont())
             .text(`${typeInfo.emoji}`, tableLeft + colWidths[0] + 8, cellY);
          
          doc.fontSize(9)
             .text(typeInfo.label, tableLeft + colWidths[0] + 8, cellY + 12, {
               width: colWidths[1] - 16,
               align: 'center'
             });
          
          // Simplified details column
          const detailX = tableLeft + colWidths[0] + colWidths[1] + 8;
          const maxWidth = colWidths[2] - 16;
          
          // Title
          doc.fillColor(colors.text)
             .fontSize(11)
             .font(getBoldFont())
             .text(item.title || 'Номаълум', detailX, cellY, {
               width: maxWidth
             });
          
          cellY += 16;
          
          // Description
          if (item.description) {
            doc.fontSize(9)
               .font(getRegularFont())
               .fillColor('#555555')
               .text(item.description, detailX, cellY, {
                 width: maxWidth
               });
            cellY += descLines * 12 + 4;
          }
          
          // Meta info in one line
          const metaParts = [];
          if (item.type === 'reception') {
            if (item.position) metaParts.push(`💼 ${item.position}`);
            if (item.department) metaParts.push(`🏢 ${item.department}`);
            if (item.phone) metaParts.push(`📞 ${item.phone}`);
          } else if (item.type === 'meeting') {
            if (item.location) metaParts.push(`📍 ${item.location}`);
            if (item.participants?.length) metaParts.push(`👥 ${item.participants.length} иштирокчи`);
          } else if (item.type === 'task') {
            if (item.priority && item.priority !== 'normal') {
              const priorityTexts = { low: 'Паст', high: 'Юқори', urgent: 'Шошилинч' };
              metaParts.push(`⚡ ${priorityTexts[item.priority]}`);
            }
          }
          
          if (metaParts.length > 0) {
            doc.fontSize(8)
               .fillColor('#666666')
               .text(metaParts.join('  •  '), detailX, cellY);
          }
          
          currentY += rowHeight + 1;
        });
        
        // ===================
        // FOOTER SECTION - Jadval tugagandan keyin
        // ===================
        
        // Add some space after table
        currentY += 30;
        
        // Signature section - jadval tagida
        doc.strokeColor(colors.border)
           .lineWidth(0.5)
           .moveTo(margin, currentY)
           .lineTo(margin + 250, currentY)
           .stroke();
        
        currentY += 15;
        
        // Signature text
        doc.fillColor(colors.text)
           .fontSize(11)
           .font(getRegularFont())
           .text('Тасдиқлади: ________________________________', margin, currentY);
        
        doc.fontSize(9)
           .fillColor('#666666')
           .text('(Раҳбар имзоси ва санаси)', margin, currentY + 18);
      }
      
      // ===================
      // PAGE FOOTER (har sahifada)
      // ===================
      
      // Page number at bottom of every page
      const addPageNumber = (pageNum, totalPages) => {
        doc.fontSize(9)
           .fillColor(colors.text)
           .font(getRegularFont())
           .text(`Саҳифа: ${pageNum}/${totalPages}`, pageWidth - margin - 60, pageHeight - 25);
      };
      
      // Add page number to current page
      addPageNumber(1, 1);

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