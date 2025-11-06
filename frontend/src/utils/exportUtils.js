import { jsPDF } from 'jspdf';

export const exportToJSON = (history) => {
  const dataStr = JSON.stringify(history, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  const exportFileDefaultName = `qa-history-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const exportToMarkdown = (history) => {
  let markdown = `# Graph Q&A Conversation History\n\n`;
  markdown += `Generated on: ${new Date().toLocaleString()}\n\n`;
  markdown += `Total Conversations: ${history.length}\n\n`;
  markdown += `---\n\n`;

  history.forEach((item, index) => {
    const date = new Date(item.timestamp).toLocaleString();
    markdown += `## Conversation ${index + 1}\n\n`;
    markdown += `**Date:** ${date}\n\n`;
    markdown += `**Question:**\n\n${item.question}\n\n`;
    markdown += `**Answer:**\n\n${item.answer}\n\n`;
    
    if (item.cypher) {
      markdown += `**Generated Cypher Query:**\n\n\`\`\`cypher\n${item.cypher}\n\`\`\`\n\n`;
    }
    
    markdown += `---\n\n`;
  });

  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const exportFileDefaultName = `qa-history-${new Date().toISOString().split('T')[0]}.md`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', url);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  URL.revokeObjectURL(url);
};

export const exportToPDF = (history) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Title
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('Graph Q&A Conversation History', margin, yPosition);
  yPosition += 10;

  // Metadata
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Total Conversations: ${history.length}`, margin, yPosition);
  yPosition += 15;

  // Draw separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  history.forEach((item, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    const date = new Date(item.timestamp).toLocaleString();

    // Conversation number
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Conversation ${index + 1}`, margin, yPosition);
    yPosition += 8;

    // Date
    doc.setFontSize(9);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`${date}`, margin, yPosition);
    yPosition += 10;

    // Question
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Question:', margin, yPosition);
    yPosition += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    const questionLines = doc.splitTextToSize(item.question, maxWidth);
    doc.text(questionLines, margin, yPosition);
    yPosition += questionLines.length * 5 + 8;

    // Answer
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Answer:', margin, yPosition);
    yPosition += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    const answerLines = doc.splitTextToSize(item.answer, maxWidth);
    doc.text(answerLines, margin, yPosition);
    yPosition += answerLines.length * 5 + 8;

    // Cypher query (if exists)
    if (item.cypher) {
      // Check if we need a new page for cypher
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Generated Cypher Query:', margin, yPosition);
      yPosition += 6;

      doc.setFont('courier', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 150);
      const cypherLines = doc.splitTextToSize(item.cypher, maxWidth);
      doc.text(cypherLines, margin, yPosition);
      yPosition += cypherLines.length * 4 + 10;
      doc.setTextColor(0, 0, 0);
    }

    // Separator
    if (index < history.length - 1) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    }
  });

  const exportFileDefaultName = `qa-history-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(exportFileDefaultName);
};

