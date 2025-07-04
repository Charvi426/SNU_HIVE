import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LostFoundGrid = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');

  // Update the fetchItems function in your useEffect
useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        let url = 'https://snu-hive-backend.onrender.com/api/lostfound';
        
        if (filter !== 'ALL') {
          url = `https://snu-hive-backend.onrender.com/api/lostfound/status/${filter}`;
        }

        console.log('Fetching from URL:', url); // Debug log

        const response = await axios.get(url);
        
        if (!response.data) {
          throw new Error('No data received from server');
        }

        console.log('Received items:', response.data); // Debug log
        setItems(response.data);
        setError(null);

      } catch (err) {
        console.error('Error details:', err.response || err); // Debug log
        setError(err.response?.data?.message || 'Failed to fetch lost and found items');
        setItems([]); // Clear items on error
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
}, [filter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#432818]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#432818] mb-4">Lost and Found Items</h1>
        
        {/* Filter Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'ALL'
                ? 'bg-[#432818] text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setFilter('LOST')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'LOST'
                ? 'bg-[#432818] text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Lost Items
          </button>
          <button
            onClick={() => setFilter('FOUND')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'FOUND'
                ? 'bg-[#432818] text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Found Items
          </button>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div 
            key={item.item_id} 
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {item.image_path && (
              <div className="h-48 overflow-hidden">
                <img
                  src={item.image_path}
                  alt={item.item_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.png'; // Add a placeholder image
                  }}
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{item.item_name}</h3>
                <span className={`px-2 py-1 rounded-full text-sm ${
                  item.status === 'LOST' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {item.status}
                </span>
              </div>
              <p className="text-gray-600 mb-2">
                <span className="font-semibold">Location:</span> {item.found_location}
              </p>
              <p className="text-gray-600 mb-2">
                <span className="font-semibold">Reported by:</span> {item.s_name}
              </p>
              <p className="text-gray-500 text-sm">
                {new Date(item.report_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No items found</p>
        </div>
      )}
    </div>
  );
};

export default LostFoundGrid;