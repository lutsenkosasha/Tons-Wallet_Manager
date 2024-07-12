import { Wallet } from './wallet.ts';

export interface WalletGroup {
    name: string;
    wallets: Wallet[];
}