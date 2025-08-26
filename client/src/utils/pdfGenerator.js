import jsPDF from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';
import dayjs from 'dayjs';
import 'dayjs/locale/uz-latn';

dayjs.locale('uz-latn');

// Corporate color scheme
const colors = {
  primary: '#1e3a8a',    // To'q ko'k (corporate)
  secondary: '#1e40af',  // O'rta ko'k  
  accent: '#3b82f6',     // Ochiq ko'k
  text: '#1f2937',       // To'q kulrang
  border: '#d1d5db',     // Ochiq kulrang
  light: '#f8fafc'       // Och kulrang background
};

// Convert hex color to RGB array for jsPDF
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16), 
    parseInt(result[3], 16)
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

// Get item type emoji and label
const getItemTypeInfo = (type) => {
  switch (type) {
    case 'task':
      return { emoji: '📋', label: 'Vazifa', color: colors.primary };
    case 'reception':
      return { emoji: '👤', label: 'Qabul', color: colors.secondary };
    case 'meeting':
      return { emoji: '🤝', label: 'Majlis', color: colors.accent };
    default:
      return { emoji: '📄', label: 'Ish', color: colors.text };
  }
};

// Main PDF generator function
export const generateSchedulePDF = async (scheduleData, selectedDate) => {
  try {
    console.log('📄 Generating PDF for date:', selectedDate.format('YYYY-MM-DD'));
    console.log('📊 Schedule data:', scheduleData);

    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // A4 dimensions
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    let currentY = margin;

    // ===================
    // HEADER SECTION
    // ===================
    
    // Company logo placeholder (you can replace with actual logo)
    doc.setFillColor(...hexToRgb(colors.primary));
    doc.circle(35, currentY + 10, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Q', 32, currentY + 13);

    // Company name and title
    doc.setTextColor(...hexToRgb(colors.primary));
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('QABULXONA TIZIMI', 50, currentY + 8);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('RAHBAR ISH GRAFIGI', 50, currentY + 16);

    currentY += 30;

    // Date and generation info
    doc.setDrawColor(...hexToRgb(colors.border));
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;

    doc.setTextColor(...hexToRgb(colors.text));
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    
    const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 
                       'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
    
    const dateStr = `${selectedDate.date()} ${monthNames[selectedDate.month()]} ${selectedDate.year()}`;
    const dayName = dayNames[selectedDate.day()];
    
    doc.text(`Sana: ${dateStr} (${dayName})`, margin, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const generatedTime = dayjs().format('DD.MM.YYYY HH:mm');
    doc.text(`Tayyorlandi: ${generatedTime}`, margin, currentY + 6);

    currentY += 20;

    // ===================
    // SUMMARY SECTION
    // ===================
    
    const summary = scheduleData?.summary || {};
    const totalItems = summary.totalItems || 0;
    
    if (totalItems > 0) {
      doc.setDrawColor(...hexToRgb(colors.border));
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 8;
      
      doc.setTextColor(...hexToRgb(colors.primary));
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('XULOSALAR:', margin, currentY);
      
      currentY += 8;
      doc.setTextColor(...hexToRgb(colors.text));
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const summaryText = [
        `📋 Jami: ${totalItems} ta ish rejasi`,
        `📋 Vazifalar: ${summary.totalTasks || 0}`,
        `👤 Qabullar: ${summary.totalReceptions || 0}`, 
        `🤝 Majlislar: ${summary.totalMeetings || 0}`
      ];
      
      summaryText.forEach((text, index) => {
        doc.text(text, margin + (index * 45), currentY);
      });
      
      currentY += 15;
    }

    // ===================
    // SCHEDULE TABLE
    // ===================
    
    const items = scheduleData?.items || [];
    
    if (items.length === 0) {
      // Empty state
      doc.setTextColor(...hexToRgb(colors.text));
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Bu kun uchun ish rejasi mavjud emas', margin, currentY + 20);
    } else {
      // Table header
      doc.setDrawColor(...hexToRgb(colors.primary));
      doc.setFillColor(...hexToRgb(colors.primary));
      doc.rect(margin, currentY, contentWidth, 12, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('VAQT', margin + 5, currentY + 8);
      doc.text('TUR', margin + 35, currentY + 8);
      doc.text('TAFSIL', margin + 60, currentY + 8);
      
      currentY += 15;
      
      // Table rows
      items.forEach((item, index) => {
        const typeInfo = getItemTypeInfo(item.type);
        const rowHeight = Math.max(15, Math.ceil((item.description || '').length / 50) * 5 + 10);
        
        // Zebra striping
        if (index % 2 === 0) {
          doc.setFillColor(...hexToRgb(colors.light));
          doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
        }
        
        // Border
        doc.setDrawColor(...hexToRgb(colors.border));
        doc.rect(margin, currentY, contentWidth, rowHeight);
        doc.line(margin + 30, currentY, margin + 30, currentY + rowHeight);
        doc.line(margin + 55, currentY, margin + 55, currentY + rowHeight);
        
        // Content
        doc.setTextColor(...hexToRgb(colors.text));
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(formatTime(item.time), margin + 5, currentY + 8);
        
        doc.setTextColor(...hexToRgb(typeInfo.color));
        doc.text(`${typeInfo.emoji} ${typeInfo.label}`, margin + 32, currentY + 8);
        
        // Title
        doc.setTextColor(...hexToRgb(colors.text));
        doc.setFont('helvetica', 'bold');
        doc.text(item.title || 'Noma\'lum', margin + 60, currentY + 8);
        
        // Details
        let detailY = currentY + 12;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        if (item.description) {
          const lines = doc.splitTextToSize(item.description, contentWidth - 65);
          doc.text(lines, margin + 60, detailY);
          detailY += lines.length * 4;
        }
        
        // Type-specific details
        if (item.type === 'reception') {
          if (item.position) doc.text(`💼 ${item.position}`, margin + 60, detailY);
          if (item.department) doc.text(`🏢 ${item.department}`, margin + 60, detailY + 4);
        } else if (item.type === 'meeting') {
          if (item.location) doc.text(`📍 ${item.location}`, margin + 60, detailY);
          if (item.participants?.length) doc.text(`👥 ${item.participants.length} ishtirokchi`, margin + 60, detailY + 4);
        }
        
        currentY += rowHeight + 2;
        
        // Page break check
        if (currentY > pageHeight - 60) {
          doc.addPage();
          currentY = margin;
        }
      });
    }

    // ===================
    // FOOTER SECTION
    // ===================
    
    // Move to footer area
    currentY = pageHeight - 50;
    
    // Signature section
    doc.setDrawColor(...hexToRgb(colors.border));
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;
    
    doc.setTextColor(...hexToRgb(colors.text));
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Tasdiqladi: ________________________________', margin, currentY);
    doc.text('(Rahbar imzosi va sanasi)', margin, currentY + 6);
    
    // QR Code
    const qrData = `${window.location.origin}/schedule/${selectedDate.format('YYYY-MM-DD')}`;
    const qrCodeDataUrl = await generateQRCode(qrData);
    
    if (qrCodeDataUrl) {
      doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - margin - 25, currentY - 5, 20, 20);
      doc.setFontSize(8);
      doc.text('Digital tasdiqlash', pageWidth - margin - 25, currentY + 18);
    }
    
    // Page number
    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb(colors.text));
    doc.text(`Sahifa: 1/1`, pageWidth - margin - 15, pageHeight - 10);

    // ===================
    // SAVE PDF
    // ===================
    
    const fileName = `Rahbar_Ish_Grafigi_${selectedDate.format('YYYY-MM-DD')}.pdf`;
    doc.save(fileName);
    
    console.log('✅ PDF generated successfully:', fileName);
    
    return {
      success: true,
      fileName: fileName,
      message: 'PDF muvaffaqiyatli yaratildi va yuklab olindi'
    };
    
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    return {
      success: false,
      error: error.message,
      message: 'PDF yaratishda xatolik yuz berdi'
    };
  }
};