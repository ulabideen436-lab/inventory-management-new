// Check products with valid prices
import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const LOGIN_URL = `${BASE_URL}/auth/login`;
const PRODUCTS_URL = `${BASE_URL}/products`;

async function checkProductPrices() {
    try {
        // Authenticate first
        const authResponse = await axios.post(LOGIN_URL, {
            username: 'admin',
            password: 'admin123'
        });

        const token = authResponse.data.token;

        // Get products
        const response = await axios.get(PRODUCTS_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const products = response.data;
        console.log(`Total products: ${products.length}`);

        // Filter products with valid prices
        const validProducts = products.filter(product =>
            product.retail_price &&
            !isNaN(product.retail_price) &&
            product.retail_price > 0
        );

        console.log(`Products with valid prices: ${validProducts.length}`);

        if (validProducts.length >= 5) {
            console.log('\nFirst 5 products with valid prices:');
            validProducts.slice(0, 5).forEach((product, index) => {
                console.log(`${index + 1}. ${product.name} - PKR ${product.retail_price}`);
            });
        } else {
            console.log('\nAll products with valid prices:');
            validProducts.forEach((product, index) => {
                console.log(`${index + 1}. ${product.name} - PKR ${product.retail_price}`);
            });
        }

    } catch (error) {
        console.error('Error:', error.response?.data?.message || error.message);
    }
}

checkProductPrices();