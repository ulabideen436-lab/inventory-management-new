const fs = require('fs');
const path = require('path');

// Read the Sales.js file
const filePath = path.join(__dirname, 'frontend', 'src', 'components', 'Sales.js');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Fixing all malformed span tags...');

// Fix malformed span tags with missing closing >
content = content.replace(
  /<span className="mr-2" <\/span>/g,
  '<span className="mr-2"></span>'
);

// Also fix any other malformed span patterns
content = content.replace(
  /<span className="([^"]*)" <\/span>/g,
  '<span className="$1"></span>'
);

// Write the fixed content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed all malformed span tags in Sales.js');