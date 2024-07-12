import axios from 'axios';

export const fetchTransactions = async () => {
    const response = await axios.get('http://127.0.0.1:8000/api/v1/transactions/all');
    return response.data;
};