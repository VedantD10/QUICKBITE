const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const downloadsDir = 'C:\\Users\\HP\\Downloads';
const files = fs.readdirSync(downloadsDir).filter(f => f.toLowerCase().endsWith('.pdf'));

async function scan() {
  console.log(`Found ${files.length} PDF files in Downloads`);
  for (const file of files) {
    const filePath = path.join(downloadsDir, file);
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      if (data.text.includes('QuickBite') || data.text.includes('VESA') || file.toLowerCase().includes('full')) {
        console.log('----------------------------------------------------');
        console.log(`MATCHED FILE: ${file}`);
        console.log(`Pages: ${data.numpages}`);
        console.log(`Snippet: ${data.text.substring(0, 500)}...`);
        fs.writeFileSync(path.join(__dirname, `extracted_${file.replace(/[^a-zA-Z0-9]/g, '_')}.txt`), data.text);
      }
    } catch (e) {
      // Ignore unparseable
    }
  }
}

scan();
