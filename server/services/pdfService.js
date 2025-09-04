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

// Emoji font paths (optional) - only TTF fonts that PDFKit supports
const EMOJI_FONT_PATHS = [
  path.join(FONT_PATH, 'NotoColorEmoji.ttf'),
  path.join(FONT_PATH, 'SegoeUIEmoji.ttf')
  // AppleColorEmoji.ttf is not supported by PDFKit
];

// Check if custom fonts and logo exist
const hasCustomFonts = fs.existsSync(DEJAVU_SANS) && fs.existsSync(DEJAVU_SANS_BOLD);
const hasCompanyLogo = fs.existsSync(COMPANY_LOGO) || fs.existsSync(path.join(LOGO_PATH, 'logo.jpg'));

// Check for emoji font support
const hasEmojiFont = EMOJI_FONT_PATHS.some(fontPath => fs.existsSync(fontPath));
const emojiFontPath = EMOJI_FONT_PATHS.find(fontPath => fs.existsSync(fontPath));

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

// Get item type info in Cyrillic with emoji fallback
const getItemTypeInfo = (type) => {
  // Try to use emojis, fallback to Unicode symbols if not supported
  const emojiMap = {
    task: { emoji: '📋', fallback: '■', label: 'Вазифа', color: colors.primary },
    reception: { emoji: '👤', fallback: '●', label: 'Қабул', color: colors.secondary },
    meeting: { emoji: '🤝', fallback: '◆', label: 'Мажлис', color: colors.accent }
  };
  
  const item = emojiMap[type] || { emoji: '📄', fallback: '□', label: 'Иш', color: colors.text };
  
  // Use emojis if emoji font is available, otherwise use fallback symbols
  return {
    emoji: hasEmojiFont ? item.emoji : item.fallback,
    label: item.label,
    color: item.color,
    hasEmojiSupport: hasEmojiFont
  };
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
      
      // Register emoji font if available
      if (hasEmojiFont && emojiFontPath) {
        doc.registerFont('EmojiFont', emojiFontPath);
        console.log('🎨 Emoji font registered:', path.basename(emojiFontPath));
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
           .text(`▲ Жами: ${totalItems} та иш режаси`, margin + 20, currentY);
        
        // Second line with other stats if they exist
        if (summary.totalTasks > 0 || summary.totalReceptions > 0 || summary.totalMeetings > 0) {
          currentY += 14;
          const detailParts = [];
          if (summary.totalTasks > 0) {
            const taskInfo = getItemTypeInfo('task');
            detailParts.push(`${taskInfo.emoji} Вазифалар: ${summary.totalTasks}`);
          }
          if (summary.totalReceptions > 0) {
            const receptionInfo = getItemTypeInfo('reception');
            detailParts.push(`${receptionInfo.emoji} Қабуллар: ${summary.totalReceptions}`);
          }
          if (summary.totalMeetings > 0) {
            const meetingInfo = getItemTypeInfo('meeting');
            detailParts.push(`${meetingInfo.emoji} Мажлислар: ${summary.totalMeetings}`);
          }
          
          // Use emoji font for summary if available
          const summaryFont = hasEmojiFont ? 'EmojiFont' : getRegularFont();
          doc.font(summaryFont)
             .text(detailParts.join('  •  '), margin + 20, currentY);
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
        
              // Sort items by time before rendering
      const sortedItems = items.sort((a, b) => {
        // Get display time for sorting (same logic as display)
        const timeA = a.type === 'reception' ? 
          (a.data?.scheduledTime || a.time) : 
          a.time;
        const timeB = b.type === 'reception' ? 
          (b.data?.scheduledTime || b.time) : 
          b.time;
        
        const timeAFormatted = (timeA || '00:00').replace(':', '');
        const timeBFormatted = (timeB || '00:00').replace(':', '');
        return parseInt(timeAFormatted) - parseInt(timeBFormatted);
      });
      
      // Table rows with improved height calculation
      sortedItems.forEach((item, index) => {
          const typeInfo = getItemTypeInfo(item.type);
          
          // Calculate actual text height using PDFKit's text measurement
          const detailX = tableLeft + colWidths[0] + colWidths[1] + 8;
          const maxWidth = colWidths[2] - 16;
          
          // Measure title height
          const titleHeight = doc.heightOfString(item.title || 'Номаълум', {
            width: maxWidth,
            fontSize: 11
          });
          
          // Measure description height
          let descHeight = 0;
          if (item.description) {
            descHeight = doc.heightOfString(item.description, {
              width: maxWidth,
              fontSize: 9
            });
          }
          
          // Calculate meta info height with emoji support
          const metaParts = [];
          if (item.type === 'reception') {
            if (item.position) metaParts.push(`${hasEmojiFont ? '💼' : '■'} ${item.position}`);
            if (item.department) metaParts.push(`${hasEmojiFont ? '🏢' : '◢'} ${item.department}`);
            if (item.phone) metaParts.push(`${hasEmojiFont ? '📞' : '☎'} ${item.phone}`);
          } else if (item.type === 'meeting') {
            if (item.location) metaParts.push(`${hasEmojiFont ? '📍' : '◆'} ${item.location}`);
            if (item.participants?.length) metaParts.push(`${hasEmojiFont ? '👥' : '◯'} ${item.participants.length} иштирокчи`);
          } else if (item.type === 'task') {
            if (item.priority && item.priority !== 'normal') {
              const priorityTexts = { low: 'Паст', high: 'Юқори', urgent: 'Шошилинч' };
              metaParts.push(`${hasEmojiFont ? '⚡' : '▲'} ${priorityTexts[item.priority]}`);
            }
          }
          
          let metaHeight = 0;
          if (metaParts.length > 0) {
            metaHeight = doc.heightOfString(metaParts.join('  •  '), {
              width: maxWidth,
              fontSize: 8
            });
          }
          
          // Calculate total height with proper padding
          const totalContentHeight = titleHeight + descHeight + metaHeight;
          const rowHeight = Math.max(50, totalContentHeight + 30); // 30px padding (15px top + 15px bottom)
          
          // Page break check
          if (currentY + rowHeight > pageHeight - 80) {
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
          
          // Time column - qabul uchun data.scheduledTime, boshqalar uchun time
          const displayTime = item.type === 'reception' ? 
            (item.data?.scheduledTime || item.time) : 
            item.time;
            
          // Debug log for reception items
          if (item.type === 'reception') {
            console.log('🔍 PDF Reception Debug:', {
              name: item.title,
              time: item.time,
              dataScheduledTime: item.data?.scheduledTime,
              displayTime: displayTime
            });
          }
            
          doc.fillColor(colors.text)
             .fontSize(12)
             .font(getBoldFont())
             .text(formatTime(displayTime), tableLeft + 8, cellY, {
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
          
          // Type column with emoji font support
          doc.fillColor(typeInfo.color)
             .fontSize(10)
             .font(typeInfo.hasEmojiSupport ? 'EmojiFont' : getBoldFont())
             .text(`${typeInfo.emoji}`, tableLeft + colWidths[0] + 8, cellY);
          
          doc.fontSize(9)
             .text(typeInfo.label, tableLeft + colWidths[0] + 8, cellY + 12, {
               width: colWidths[1] - 16,
               align: 'center'
             });
          
          // Details column with proper text positioning
          // Title
          doc.fillColor(colors.text)
             .fontSize(11)
             .font(getBoldFont())
             .text(item.title || 'Номаълум', detailX, cellY, {
               width: maxWidth
             });
          
          cellY += titleHeight + 4;
          
          // Description
          if (item.description) {
            doc.fontSize(9)
               .font(getRegularFont())
               .fillColor('#555555')
               .text(item.description, detailX, cellY, {
                 width: maxWidth
               });
            cellY += descHeight + 4;
          }
          
          // Meta info with emoji font support
          if (metaParts.length > 0) {
            doc.fontSize(8)
               .font(hasEmojiFont ? 'EmojiFont' : getRegularFont())
               .fillColor('#666666')
               .text(metaParts.join('  •  '), detailX, cellY, {
                 width: maxWidth
               });
          }
          
          currentY += rowHeight + 1;
        });
      }

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