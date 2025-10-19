// Simple test to verify the sanitizeNumericField function logic
function sanitizeNumericField(value) {
    if (value === '' || value === null || value === undefined) return null;
    return value;
}

console.log('🧪 Testing sanitizeNumericField function...\n');

// Test cases
const testCases = [
    { input: '', expected: null, description: 'Empty string' },
    { input: null, expected: null, description: 'Null value' },
    { input: undefined, expected: undefined, description: 'Undefined value' }, // Note: this becomes null due to === check
    { input: '100', expected: '100', description: 'Valid string number' },
    { input: 100, expected: 100, description: 'Valid number' },
    { input: '0', expected: '0', description: 'Zero as string' },
    { input: 0, expected: 0, description: 'Zero as number' }
];

testCases.forEach((testCase, index) => {
    const result = sanitizeNumericField(testCase.input);
    const expected = testCase.input === undefined ? null : testCase.expected; // undefined becomes null
    const passed = result === expected;

    console.log(`Test ${index + 1}: ${testCase.description}`);
    console.log(`  Input: ${JSON.stringify(testCase.input)}`);
    console.log(`  Expected: ${JSON.stringify(expected)}`);
    console.log(`  Got: ${JSON.stringify(result)}`);
    console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

// Test the SQL query structure
console.log('📝 Example SQL query with sanitized values:');
const exampleData = {
    name: 'Test Customer',
    credit_limit: '', // This will become null
    opening_balance: '500.00',
    id: 1
};

const sanitizedCreditLimit = sanitizeNumericField(exampleData.credit_limit);
const sanitizedOpeningBalance = sanitizeNumericField(exampleData.opening_balance);

console.log('Query parameters:');
console.log('  credit_limit:', JSON.stringify(sanitizedCreditLimit));
console.log('  opening_balance:', JSON.stringify(sanitizedOpeningBalance));

console.log('\n🎉 Function logic test complete!');
console.log('Empty strings will be converted to NULL, preventing the "Incorrect decimal value" error.');