export interface Wallet {
    name: string;
    mnemonic: string;
    address: string;
    created: string | null;
}

export interface WalletsResponse {
    wallets: Wallet[];
}

export interface WalletInfo {
    balance: number;
    status: string;
}
