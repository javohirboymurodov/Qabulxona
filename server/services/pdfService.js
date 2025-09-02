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

// Get item type info - TURLI SHAKLLAR
const getItemTypeInfo = (type) => {
  switch (type) {
    case 'task':
      return { symbol: '■', label: 'Вазифа', color: colors.primary };
    case 'reception':
      return { symbol: '●', label: 'Қабул', color: colors.secondary };
    case 'meeting':
      return { symbol: '▲', label: 'Мажлис', color: colors.accent };
    default:
      return { symbol: '♦', label: 'Иш', color: colors.text };
  }
};

// Detail symbols - KICHIK BELGILAR
const getDetailSymbol = (detailType) => {
  switch (detailType) {
    case 'position': return '►';     
    case 'department': return '§';   
    case 'location': return '※';     
    case 'participants': return '∞'; 
    default: return '•';
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
      
      const items = scheduleData?.items || [];
      
      // Create new PDF document
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

      let currentY = margin;

      // DRAW TABLE HEADER FUNCTION
      const drawTableHeader = (startY) => {
        const colWidths = [80, 90, contentWidth - 170];
        
        doc.rect(margin, startY, contentWidth, 35)
           .fillColor(colors.primary)
           .fill();
        
        doc.fillColor('white')
           .fontSize(14)
           .font(getBoldFont())
           .text('ВАҚТ', margin + 10, startY + 12)
           .text('ТУР', margin + colWidths[0] + 10, startY + 12)
           .text('ТАФСИЛОТЛАР', margin + colWidths[0] + colWidths[1] + 10, startY + 12);
           
        return startY + 40;
      };

      // ===================
      // HEADER SECTION
      // ===================
      
      // Company logo design
      if (hasCompanyLogo) {
        try {
          const logoPath = fs.existsSync(path.join(LOGO_PATH, 'logo.png')) 
            ? path.join(LOGO_PATH, 'logo.png')
            : path.join(LOGO_PATH, 'logo.jpg');
          
          doc.image(logoPath, margin + 5, currentY + 5, {
            width: 45,
            height: 45
          });
        } catch (error) {
          doc.rect(margin + 5, currentY + 5, 45, 45)
             .fillColor(colors.primary)
             .fill();
          
          doc.fillColor('white')
             .fontSize(24)
             .font(getBoldFont())
             .text('Қ', margin + 22, currentY + 20);
        }
      } else {
        doc.rect(margin + 5, currentY + 5, 45, 45)
           .fillColor(colors.primary)
           .fill();
        
        doc.fillColor('white')
           .fontSize(24)
           .font(getBoldFont())
           .text('Қ', margin + 22, currentY + 20);
      }

      // Company name and title
      doc.fillColor(colors.primary)
         .fontSize(24)
         .font(getBoldFont())
         .text('ҚАБУЛХОНА ТИЗИМИ', margin + 65, currentY + 5);
      
      doc.fontSize(18)
         .font(getRegularFont())
         .fillColor(colors.text)
         .text('РАҲБАР ИШ ГРАФИГИ', margin + 65, currentY + 32);

      currentY += 70;

      // Divider line
      doc.strokeColor(colors.border)
         .lineWidth(2)
         .moveTo(margin, currentY)
         .lineTo(pageWidth - margin, currentY)
         .stroke();

      currentY += 20;

      // Date and generation info
      const dateInfo = formatDateUz(selectedDate);
      
      doc.fillColor(colors.text)
         .fontSize(16)
         .font(getBoldFont())
         .text(`Сана: ${dateInfo.dateStr} (${dateInfo.dayName})`, margin, currentY);
      
      const generatedTime = dayjs().format('DD.MM.YYYY HH:mm');
      doc.fontSize(11)
         .font(getRegularFont())
         .fillColor('#666666')
         .text(`Тайёрланди: ${generatedTime}`, pageWidth - margin - 140, currentY + 3);

      currentY += 35;

      // ===================
      // SUMMARY SECTION - SYMBOL O'RNIGA MATN
      // ===================
      
      const summary = scheduleData?.summary || {};
      const totalItems = summary.totalItems || 0;
      
      if (totalItems > 0) {
        doc.fillColor(colors.primary)
           .fontSize(14)
           .font(getBoldFont())
           .text('УМУМИЙ МАЪЛУМОТЛАР:', margin, currentY);
        
        currentY += 22;
        
        // JAMI - SYMBOL O'RNIGA MATN
        doc.fillColor(colors.text)
           .fontSize(12)
           .font(getRegularFont())
           .text(`Жами: ${totalItems} та иш режаси`, margin + 25, currentY);
        
        currentY += 18;
        
        // Detailed breakdown - HAR XO'L UCHUN ALOHIDA SHAKL
        if (summary.totalTasks > 0 || summary.totalReceptions > 0 || summary.totalMeetings > 0) {
          const details = [];
          
          if (summary.totalTasks > 0) {
            details.push(`■ Вазифалар: ${summary.totalTasks}`);
          }
          if (summary.totalReceptions > 0) {
            details.push(`● Қабуллар: ${summary.totalReceptions}`);
          }
          if (summary.totalMeetings > 0) {
            details.push(`▲ Мажлислар: ${summary.totalMeetings}`);
          }
          
          doc.text(details.join('   '), margin + 25, currentY);
          currentY += 18;
        }
        
        currentY += 15;
      }

      // ===================
      // SCHEDULE TABLE
      // ===================
      
      if (items.length === 0) {
        // Empty state
        doc.rect(margin, currentY, contentWidth, 80)
           .fillColor(colors.light)
           .fill();
           
        doc.fillColor(colors.text)
           .fontSize(16)
           .font(getRegularFont())
           .text('Бу кун учун иш режаси белгиланмаган', margin, currentY + 30, {
             align: 'center',
             width: contentWidth
           });
           
        currentY += 100;
      } else {
        // Draw initial table header
        currentY = drawTableHeader(currentY);
        
        const colWidths = [80, 90, contentWidth - 170];
        
        // Table rows
        items.forEach((item, index) => {
          const typeInfo = getItemTypeInfo(item.type);
          
          // Calculate required row height
          const titleLength = (item.title || '').length;
          const descLength = (item.description || '').length;
          const extraDetails = [item.position, item.department, item.location].filter(Boolean).length;
          const participantCount = item.participants?.length ? 1 : 0;
          
          const contentLines = Math.ceil(titleLength / 40) + 
                              Math.ceil(descLength / 45) + 
                              extraDetails + participantCount;
          const rowHeight = Math.max(70, contentLines * 20 + 30);
          
          // Check if new page needed - KAMROQ JOY QOLDIRISH
          if (currentY + rowHeight > pageHeight - 120) {
            doc.addPage();
            currentY = margin + 20;
            
            // Continuation header
            doc.fillColor(colors.primary)
               .fontSize(14)
               .font(getBoldFont())
               .text('РАҲБАР ИШ ГРАФИГИ (давоми)', margin, currentY, {
                 align: 'center',
                 width: contentWidth
               });
            
            currentY += 25;
            
            // Date on continuation
            doc.fillColor(colors.text)
               .fontSize(12)
               .font(getRegularFont())
               .text(`${dateInfo.dateStr} (${dateInfo.dayName})`, margin, currentY, {
                 align: 'center',
                 width: contentWidth
               });
            
            currentY += 35;
            
            // Redraw table header
            currentY = drawTableHeader(currentY);
          }
          
          // Row background (zebra striping)
          if (index % 2 === 0) {
            doc.rect(margin, currentY, contentWidth, rowHeight)
               .fillColor(colors.light)
               .fill();
          }
          
          // Row border
          doc.strokeColor(colors.border)
             .lineWidth(1)
             .rect(margin, currentY, contentWidth, rowHeight)
             .stroke();
          
          // Column separators
          doc.strokeColor('#e0e0e0')
             .lineWidth(0.5)
             .moveTo(margin + colWidths[0], currentY)
             .lineTo(margin + colWidths[0], currentY + rowHeight)
             .stroke()
             .moveTo(margin + colWidths[0] + colWidths[1], currentY)
             .lineTo(margin + colWidths[0] + colWidths[1], currentY + rowHeight)
             .stroke();
          
          let cellY = currentY + 20;
          
          // TIME COLUMN - MARKAZLASH
          doc.fillColor(colors.text)
             .fontSize(14)
             .font(getBoldFont())
             .text(formatTime(item.time), margin + 10, cellY, {
               width: colWidths[0] - 20,
               align: 'center'
             });
          
          // TYPE COLUMN - SHAKL VA MATNNI MARKAZLASH
          const typeColumnX = margin + colWidths[0];
          const typeColumnWidth = colWidths[1];
          const typeCenterX = typeColumnX + (typeColumnWidth / 2);
          
          // Shakl (symbol) - markazda
          doc.fillColor(typeInfo.color)
             .fontSize(20)
             .font(getBoldFont())
             .text(typeInfo.symbol, typeCenterX - 6, cellY - 5);
             
          // Matn (label) - markazda
          doc.fillColor(typeInfo.color)
             .fontSize(11)
             .font(getBoldFont())
             .text(typeInfo.label, typeColumnX + 10, cellY + 20, {
               width: typeColumnWidth - 20,
               align: 'center'
             });
          
          // DETAILS COLUMN
          const detailX = margin + colWidths[0] + colWidths[1] + 15;
          const maxDetailWidth = colWidths[2] - 25;
          
          // Title
          doc.fillColor(colors.text)
             .fontSize(13)
             .font(getBoldFont())
             .text(item.title || 'Номаълум', detailX, cellY, {
               width: maxDetailWidth,
               lineGap: 4
             });
          
          cellY += 25;
          
          // Description
          if (item.description) {
            doc.fontSize(11)
               .font(getRegularFont())
               .fillColor('#555555')
               .text(item.description, detailX, cellY, {
                 width: maxDetailWidth,
                 lineGap: 3
               });
            cellY += Math.ceil((item.description.length / 45)) * 18 + 10;
          }
          
          // Type-specific details
          doc.fontSize(10)
             .font(getRegularFont())
             .fillColor('#666666');
          
          if (item.type === 'reception') {
            if (item.position) {
              doc.text(`${getDetailSymbol('position')} ${item.position}`, detailX, cellY);
              cellY += 16;
            }
            if (item.department) {
              doc.text(`${getDetailSymbol('department')} ${item.department}`, detailX, cellY);
              cellY += 16;
            }
          } else if (item.type === 'meeting') {
            if (item.location) {
              doc.text(`${getDetailSymbol('location')} ${item.location}`, detailX, cellY);
              cellY += 16;
            }
            if (item.participants?.length) {
              doc.text(`${getDetailSymbol('participants')} ${item.participants.length} иштирокчи`, detailX, cellY);
              cellY += 16;
            }
          }
          
          currentY += rowHeight + 1;
        });
      }
      
      // ===================
      // SIGNATURE SECTION - HAR DOIM OXIRGI ITEMDAN KEYIN
      // ===================
      
      // Minimal space after last item - faqat 30px
      currentY += 30;
      
      // Check if signature fits - FAQAT 60px kerak imzo uchun
      if (currentY + 60 > pageHeight - 50) {
        doc.addPage();
        currentY = margin + 30; // Kam joy bilan boshlash
        
        // Very minimal header for signature page
        doc.fillColor(colors.text)
           .fontSize(12)
           .font(getBoldFont())
           .text(`${dateInfo.dateStr} (${dateInfo.dayName}) - давоми`, margin, currentY, {
             align: 'center',
             width: contentWidth
           });
        
        currentY += 40;
      }
      
      // Signature line
      doc.strokeColor(colors.border)
         .lineWidth(1)
         .moveTo(margin, currentY)
         .lineTo(margin + 300, currentY)
         .stroke();
      
      currentY += 20;
      
      // Signature text
      doc.fillColor(colors.text)
         .fontSize(12)
         .font(getRegularFont())
         .text('Тасдиқлайман: ___________________________', margin, currentY);
      
      doc.fontSize(10)
         .fillColor('#666666')
         .text('(Раҳбар имзоси, Ф.И.Ш. ва санаси)', margin, currentY + 20);

      // Finalize PDF - SAHIFA RAQAMI YO'Q
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateSchedulePDF
};