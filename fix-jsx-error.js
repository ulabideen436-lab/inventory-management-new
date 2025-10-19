const fs = require('fs');
const path = require('path');

// Read the Sales.js file
const filePath = path.join(__dirname, 'frontend', 'src', 'components', 'Sales.js');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Fixing JSX syntax error...');

// Fix the malformed label tag
content = content.replace(
  /<label className="input-label"  Customer Brand<\/label>/g,
  '<label className="input-label">Customer Brand</label>'
);

// Write the fixed content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed JSX syntax error in Sales.js');