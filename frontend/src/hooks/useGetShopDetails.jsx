import { useState, useEffect } from 'react';
import axios from 'axios';
import { serverUrl } from '../App';

const useGetShopDetails = (shopId) => {
  const [shop, setShop] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shopId) return;

    const fetchShopDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await axios.get(
          `${serverUrl}/api/item/get-by-shop/${shopId}`,
          { withCredentials: true }
        );
        setShop(result.data.shop);
        setItems(result.data.items || []);
      } catch (err) {
        console.error('Error fetching shop details:', err);
        setError(err.response?.data?.message || 'Failed to load shop details');
      } finally {
        setLoading(false);
      }
    };

    fetchShopDetails();
  }, [shopId]);

  return { shop, items, loading, error };
};

export default useGetShopDetails;
