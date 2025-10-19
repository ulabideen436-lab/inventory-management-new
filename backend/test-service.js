import { getDeletedItems, getDeletionStats } from './src/services/deletedItemsService.js';

async function testService() {
    try {
        console.log('Testing getDeletedItems...');
        const items = await getDeletedItems({});
        console.log('✅ getDeletedItems works:', items.length, 'items found');

        console.log('Testing getDeletionStats...');
        const stats = await getDeletionStats();
        console.log('✅ getDeletionStats works:', stats);

        process.exit(0);
    } catch (error) {
        console.error('❌ Service error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testService();