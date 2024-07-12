import axios from 'axios';
import { Address } from 'ton';
import { Wallet, WalletInfo, WalletsResponse } from '../interfaces/wallet.ts';
import { delay } from '../utils/delay.ts';

export const fetchWalletInfo = async (address: string): Promise<WalletInfo> => {
    try {
        const response = await axios.get(`http://127.0.0.1:8000/api/v1/transactions/balance/${address}`);
        const { balance, status } = response.data;
        return {
            balance,
            status,
        };
    } catch (error) {
        // @ts-ignore
        if (error.response && error.response.status === 409) {
            await delay(1000);
            return fetchWalletInfo(address);
        } else {
            throw error;
        }
    }
};

export const fetchWallets = async (): Promise<Wallet[]> => {
    const response = await axios.get<WalletsResponse>('http://127.0.0.1:8000/api/wallets/all');
    return response.data.wallets;
};