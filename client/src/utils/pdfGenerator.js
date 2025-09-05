import dayjs from 'dayjs';

// Server-side PDF generation function
export const generateSchedulePDF = async (scheduleData, selectedDate) => {
  try {
    console.log('📄 Client: Requesting PDF from server for date:', selectedDate.format('YYYY-MM-DD'));
    
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://qabulxona-api.onrender.com/api'}/schedule/pdf/${selectedDate.format('YYYY-MM-DD')}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    // Get PDF blob from server
    const blob = await response.blob();
    
    // Create download link
    const fileName = `Rahbar_Ish_Grafigi_${selectedDate.format('YYYY-MM-DD')}.pdf`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('✅ Client: PDF downloaded successfully:', fileName);
    
    return {
      success: true,
      fileName: fileName,
      message: 'PDF муваффақиятли яратилди ва юклаб олинди'
    };
    
  } catch (error) {
    console.error('❌ Client: PDF download error:', error);
    return {
      success: false,
      error: error.message,
      message: 'PDF юклашда хатолик юз берди'
    };
  }
};