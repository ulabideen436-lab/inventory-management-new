import fs from 'fs';

// Read the comprehensive test file
const filePath = 'd:/Inventory managment/comprehensive-test.js';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all axios.delete calls with deleteWithPassword calls
const deleteCalls = [
    // Products
    /await axios\.delete\(`\$\{baseURL\}\/products\/\$\{testProductId\}`, \{ headers \}\)/g,
    /await axios\.delete\(`\$\{baseURL\}\/products\/\$\{testProductId\}`, \{ headers \}\)/g,

    // Customers  
    /await axios\.delete\(`\$\{baseURL\}\/customers\/\$\{testCustomerId\}`, \{ headers \}\)/g,

    // Sales
    /await axios\.delete\(`\$\{baseURL\}\/sales\/\$\{testSaleId\}`, \{ headers \}\)/g,
];

const replacements = [
    'await deleteWithPassword(`${baseURL}/products/${testProductId}`, { headers })',
    'await deleteWithPassword(`${baseURL}/products/${testProductId}`, { headers })',
    'await deleteWithPassword(`${baseURL}/customers/${testCustomerId}`, { headers })',
    'await deleteWithPassword(`${baseURL}/sales/${testSaleId}`, { headers })',
];

// Replace all axios.delete patterns
content = content.replace(/await axios\.delete\(`\$\{baseURL\}\/products\/\$\{[^}]+\}`, \{ headers \}\)/g,
    'await deleteWithPassword(`${baseURL}/products/${testProductId}`, { headers })');

content = content.replace(/await axios\.delete\(`\$\{baseURL\}\/customers\/\$\{[^}]+\}`, \{ headers \}\)/g,
    'await deleteWithPassword(`${baseURL}/customers/${testCustomerId}`, { headers })');

content = content.replace(/await axios\.delete\(`\$\{baseURL\}\/sales\/\$\{[^}]+\}`, \{ headers \}\)/g,
    'await deleteWithPassword(`${baseURL}/sales/${testSaleId}`, { headers })');

// Fix conditional deletions
content = content.replace(/if \(testSaleId\) await axios\.delete\(`\$\{baseURL\}\/sales\/\$\{testSaleId\}`, \{ headers \}\)/g,
    'if (testSaleId) await deleteWithPassword(`${baseURL}/sales/${testSaleId}`, { headers })');

content = content.replace(/if \(testProductId\) await axios\.delete\(`\$\{baseURL\}\/products\/\$\{testProductId\}`, \{ headers \}\)/g,
    'if (testProductId) await deleteWithPassword(`${baseURL}/products/${testProductId}`, { headers })');

content = content.replace(/if \(testCustomerId\) await axios\.delete\(`\$\{baseURL\}\/customers\/\$\{testCustomerId\}`, \{ headers \}\)/g,
    'if (testCustomerId) await deleteWithPassword(`${baseURL}/customers/${testCustomerId}`, { headers })');

// Write the updated content
fs.writeFileSync(filePath, content);

console.log('✅ Updated all deletion calls in comprehensive-test.js to use password authentication');