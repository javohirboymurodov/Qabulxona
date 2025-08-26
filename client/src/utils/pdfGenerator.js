import React from 'react';
import { pdf, Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import dayjs from 'dayjs';
import 'dayjs/locale/uz';

// Import font files as URLs for Vite
import DejaVuSansFont from '../assets/fonts/DejaVuSans.ttf?url';
import DejaVuSansBoldFont from '../assets/fonts/DejaVuSans-Bold.ttf?url';

dayjs.locale('uz');

// Register fonts for Cyrillic support
Font.register({
  family: 'DejaVuSans',
  fonts: [
    { src: DejaVuSansFont },
    { src: DejaVuSansBoldFont, fontWeight: 'bold' }
  ]
});

// Styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'DejaVuSans',
    padding: 50,
    fontSize: 10,
    lineHeight: 1.4,
    color: '#1f2937'
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    marginBottom: 30,
    alignItems: 'center'
  },
  
  logo: {
    width: 30,
    height: 30,
    backgroundColor: '#1e3a8a',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20
  },
  
  logoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  
  headerText: {
    flex: 1
  },
  
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 5
  },
  
  title: {
    fontSize: 18,
    color: '#1e3a8a'
  },
  
  // Date section
  dateLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    marginBottom: 15,
    paddingBottom: 15
  },
  
  dateText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5
  },
  
  generatedText: {
    fontSize: 10,
    color: '#6b7280'
  },
  
  // Summary section
  summaryLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    marginBottom: 15,
    paddingBottom: 15
  },
  
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 10
  },
  
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 30
  },
  
  summaryItem: {
    fontSize: 11
  },
  
  // Table styles
  table: {
    marginBottom: 30
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    padding: 8,
    marginBottom: 2
  },
  
  tableHeaderText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#d1d5db',
    minHeight: 30,
    alignItems: 'flex-start'
  },
  
  tableRowEven: {
    backgroundColor: '#f8fafc'
  },
  
  timeCol: {
    width: '15%',
    padding: 8,
    borderRightWidth: 0.5,
    borderRightColor: '#d1d5db'
  },
  
  typeCol: {
    width: '20%',
    padding: 8,
    borderRightWidth: 0.5,
    borderRightColor: '#d1d5db'
  },
  
  detailCol: {
    width: '65%',
    padding: 8
  },
  
  cellTime: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  
  cellType: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  
  cellTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 3
  },
  
  cellDescription: {
    fontSize: 10,
    marginBottom: 3,
    color: '#4b5563'
  },
  
  cellDetail: {
    fontSize: 9,
    color: '#6b7280'
  },
  
  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    paddingTop: 15
  },
  
  signature: {
    flex: 1
  },
  
  signatureText: {
    fontSize: 11,
    marginBottom: 5
  },
  
  signatureSubtext: {
    fontSize: 9,
    color: '#6b7280'
  },
  
  qrSection: {
    alignItems: 'center'
  },
  
  qrCode: {
    width: 50,
    height: 50,
    marginBottom: 5
  },
  
  qrText: {
    fontSize: 8,
    color: '#6b7280'
  },
  
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 50,
    fontSize: 8,
    color: '#6b7280'
  },
  
  // Empty state
  emptyState: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#6b7280'
  }
});

// Color mapping for item types
const getItemTypeColor = (type) => {
  switch (type) {
    case 'task':
      return '#1e3a8a';
    case 'reception':
      return '#1e40af';
    case 'meeting':
      return '#3b82f6';
    default:
      return '#1f2937';
  }
};

// Get item type info in Cyrillic
const getItemTypeInfo = (type) => {
  switch (type) {
    case 'task':
      return { emoji: '📋', label: 'Вазифа' };
    case 'reception':
      return { emoji: '👤', label: 'Қабул' };
    case 'meeting':
      return { emoji: '🤝', label: 'Мажлис' };
    default:
      return { emoji: '📄', label: 'Иш' };
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

// PDF Document Component
const SchedulePDFDocument = ({ scheduleData, selectedDate, qrCodeUrl }) => {
  const dateInfo = formatDateUz(selectedDate);
  const summary = scheduleData?.summary || {};
  const items = scheduleData?.items || [];
  const totalItems = summary.totalItems || 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>Қ</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.companyName}>ҚАБУЛХОНА ТИЗИМИ</Text>
            <Text style={styles.title}>РАҲБАР ИШ ГРАФИГИ</Text>
          </View>
        </View>
        
        {/* Date Section */}
        <View style={styles.dateLine}>
          <Text style={styles.dateText}>
            Сана: {dateInfo.dateStr} ({dateInfo.dayName})
          </Text>
          <Text style={styles.generatedText}>
            Тайёрланди: {dayjs().format('DD.MM.YYYY HH:mm')}
          </Text>
        </View>
        
        {/* Summary Section */}
        {totalItems > 0 && (
          <View style={styles.summaryLine}>
            <Text style={styles.summaryTitle}>ХУЛОСАЛАР:</Text>
            <View style={styles.summaryGrid}>
              <Text style={styles.summaryItem}>
                📋 Жами: {totalItems} та иш режаси
              </Text>
              <Text style={styles.summaryItem}>
                📋 Вазифалар: {summary.totalTasks || 0}
              </Text>
              <Text style={styles.summaryItem}>
                👤 Қабуллар: {summary.totalReceptions || 0}
              </Text>
              <Text style={styles.summaryItem}>
                🤝 Мажлислар: {summary.totalMeetings || 0}
              </Text>
            </View>
          </View>
        )}
        
        {/* Table or Empty State */}
        {items.length === 0 ? (
          <Text style={styles.emptyState}>
            Бу кун учун иш режаси мавжуд эмас
          </Text>
        ) : (
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={styles.timeCol}>
                <Text style={styles.tableHeaderText}>ВАҚТ</Text>
              </View>
              <View style={styles.typeCol}>
                <Text style={styles.tableHeaderText}>ТУР</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.tableHeaderText}>ТАФСИЛ</Text>
              </View>
            </View>
            
            {/* Table Rows */}
            {items.map((item, index) => {
              const typeInfo = getItemTypeInfo(item.type);
              const isEven = index % 2 === 0;
              
              return (
                <View 
                  key={index} 
                  style={[styles.tableRow, isEven && styles.tableRowEven]}
                >
                  {/* Time Column */}
                  <View style={styles.timeCol}>
                    <Text style={styles.cellTime}>
                      {formatTime(item.time)}
                    </Text>
                  </View>
                  
                  {/* Type Column */}
                  <View style={styles.typeCol}>
                    <Text 
                      style={[
                        styles.cellType,
                        { color: getItemTypeColor(item.type) }
                      ]}
                    >
                      {typeInfo.emoji} {typeInfo.label}
                    </Text>
                  </View>
                  
                  {/* Detail Column */}
                  <View style={styles.detailCol}>
                    <Text style={styles.cellTitle}>
                      {item.title || 'Номаълум'}
                    </Text>
                    
                    {item.description && (
                      <Text style={styles.cellDescription}>
                        {item.description}
                      </Text>
                    )}
                    
                    {/* Type-specific details */}
                    {item.type === 'reception' && (
                      <View>
                        {item.position && (
                          <Text style={styles.cellDetail}>
                            💼 {item.position}
                          </Text>
                        )}
                        {item.department && (
                          <Text style={styles.cellDetail}>
                            🏢 {item.department}
                          </Text>
                        )}
                      </View>
                    )}
                    
                    {item.type === 'meeting' && (
                      <View>
                        {item.location && (
                          <Text style={styles.cellDetail}>
                            📍 {item.location}
                          </Text>
                        )}
                        {item.participants?.length && (
                          <Text style={styles.cellDetail}>
                            👥 {item.participants.length} иштирокчи
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
        
        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.signature}>
            <Text style={styles.signatureText}>
              Тасдиқлади: ________________________________
            </Text>
            <Text style={styles.signatureSubtext}>
              (Раҳбар имзоси ва санаси)
            </Text>
          </View>
          
          {qrCodeUrl && (
            <View style={styles.qrSection}>
              <Image style={styles.qrCode} src={qrCodeUrl} />
              <Text style={styles.qrText}>Рақамли тасдиқлаш</Text>
            </View>
          )}
        </View>
        
        {/* Page Number */}
        <Text style={styles.pageNumber}>Саҳифа: 1/1</Text>
      </Page>
    </Document>
  );
};

// Main PDF generator function
export const generateSchedulePDF = async (scheduleData, selectedDate) => {
  try {
    console.log('📄 React-PDF: Generating PDF for date:', selectedDate.format('YYYY-MM-DD'));
    console.log('📊 Schedule data:', scheduleData);

    // Generate QR Code
    const qrData = `${window.location.origin}/schedule/${selectedDate.format('YYYY-MM-DD')}`;
    let qrCodeUrl = null;
    
    try {
      qrCodeUrl = await QRCode.toDataURL(qrData, {
        width: 150,
        margin: 1,
        color: {
          dark: '#1e3a8a',
          light: '#FFFFFF'
        }
      });
    } catch (qrError) {
      console.warn('QR Code generation failed:', qrError);
    }

    // Create PDF document
    const doc = (
      <SchedulePDFDocument 
        scheduleData={scheduleData}
        selectedDate={selectedDate}
        qrCodeUrl={qrCodeUrl}
      />
    );

    // Generate PDF blob
    const blob = await pdf(doc).toBlob();
    
    // Download file
    const fileName = `Rahbar_Ish_Grafigi_${selectedDate.format('YYYY-MM-DD')}.pdf`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('✅ React-PDF: PDF generated successfully:', fileName);
    
    return {
      success: true,
      fileName: fileName,
      message: 'PDF муваффақиятли яратилди ва юклаб олинди'
    };
    
  } catch (error) {
    console.error('❌ React-PDF: PDF generation error:', error);
    return {
      success: false,
      error: error.message,
      message: 'PDF яратишда хатолик юз берди'
    };
  }
};