// Simple PDF test to verify jsPDF is working
import React from 'react';

const PDFTest = () => {
  const testPDF = async () => {
    try {
      console.log('Testing PDF generation...');
      
      // Import jsPDF
      const { jsPDF } = await import('jspdf');
      console.log('jsPDF imported successfully');
      
      // Create simple PDF
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('PDF Test - This is working!', 20, 20);
      doc.text('Date: ' + new Date().toLocaleString(), 20, 40);
      
      // Save PDF
      doc.save('test-pdf.pdf');
      console.log('PDF saved successfully');
      alert('PDF test successful! Check your downloads.');
      
    } catch (error) {
      console.error('PDF test failed:', error);
      alert('PDF test failed: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>PDF Export Test</h3>
      <button 
        onClick={testPDF}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Test PDF Generation
      </button>
    </div>
  );
};

export default PDFTest;