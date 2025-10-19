import React from 'react';
import { jsPDF } from 'jspdf';

const PDFTestComponent = () => {
  const testPDFGeneration = () => {
    try {
      console.log('Testing jsPDF generation...');
      
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Add some basic content
      doc.setFontSize(16);
      doc.text('PDF Generation Test', 20, 20);
      
      doc.setFontSize(12);
      doc.text('This is a test PDF to verify jsPDF is working correctly.', 20, 40);
      
      // Test simple table with text formatting instead of autoTable
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Sample Data Table:', 20, 60);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Column 1    Column 2    Column 3', 20, 70);
      doc.text('Row 1       Data 1      Value 1', 20, 80);
      doc.text('Row 2       Data 2      Value 2', 20, 90);
      doc.text('Row 3       Data 3      Value 3', 20, 100);
      
      // Save the PDF
      doc.save('test-pdf.pdf');
      
      console.log('PDF generation test completed successfully!');
      alert('PDF test completed! Check your downloads folder.');
      
    } catch (error) {
      console.error('PDF generation test failed:', error);
      alert(`PDF test failed: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>PDF Generation Test</h3>
      <button 
        onClick={testPDFGeneration}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test PDF Generation
      </button>
    </div>
  );
};

export default PDFTestComponent;