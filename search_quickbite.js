const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

function searchDir(dir, depth = 0) {
  if (depth > 4) return;
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      if (item.startsWith('.') || item === 'node_modules' || item === 'AppData' || item === 'anaconda3') continue;
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        searchDir(fullPath, depth + 1);
      } else if (item.toLowerCase().endsWith('.pdf')) {
        try {
          const buf = fs.readFileSync(fullPath);
          pdf(buf).then(data => {
            if (data.text.includes('QuickBite') || data.text.includes('Food Delivery') || data.text.includes('VESA')) {
              console.log('FOUND IN PDF:', fullPath);
            }
          }).catch(() => {});
        } catch (e) {}
      } else if (item.toLowerCase().endsWith('.txt') || item.toLowerCase().endsWith('.md') || item.toLowerCase().endsWith('.json')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('QuickBite')) {
            console.log('FOUND IN TEXT:', fullPath);
          }
        } catch (e) {}
      }
    }
  } catch (e) {}
}

console.log('Searching C:\\Users\\HP...');
searchDir('C:\\Users\\HP');
