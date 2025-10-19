import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';

function SoldProducts() {
  const [sales, setSales] = useState([]);
  const [filters, setFilters] = usePersistentState('sold_products_filters', {
    status: '',
    product_name: '',
    category: '',
    start_date: '',
    end_date: ''
  });
  const [loading, setLoading] = useState(false);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v)
      );
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/sales', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      setSales(res.data);
    } catch (err) {
      alert('Failed to fetch sales');
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleChange = e => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilter = e => {
    e.preventDefault();
    fetchSales();
  };

  return (
    <div>
      <h2>Sold Products (Owner View)</h2>
      <form onSubmit={handleFilter} style={{ marginBottom: 16 }}>
        <input name="product_name" placeholder="Product Name" value={filters.product_name} onChange={handleChange} />
        <input name="category" placeholder="Category" value={filters.category} onChange={handleChange} />
        <input name="start_date" type="date" value={filters.start_date} onChange={handleChange} />
        <input name="end_date" type="date" value={filters.end_date} onChange={handleChange} />
        <select name="status" value={filters.status} onChange={handleChange}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
        <button type="submit">Filter</button>
      </form>
      {loading ? <div>Loading...</div> : (
        <table border="1" cellPadding="6" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Sale ID</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total Amount</th>
              <th>Products</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => (
              <tr key={sale.id}>
                <td>{sale.id}</td>
                <td>{sale.created_at ? sale.created_at.substring(0, 10) : ''}</td>
                <td>{sale.status}</td>
                <td>{sale.total_amount}</td>
                <td>
                  <ul>
                    {sale.items && sale.items.map(item => (
                      <li key={item.id}>
                        {item.name} ({item.category}) x{item.quantity}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default SoldProducts;
