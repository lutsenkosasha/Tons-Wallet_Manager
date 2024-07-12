import { mnemonicToWalletKey } from "ton-crypto";
import { WalletContractV3R2, WalletContractV4} from 'ton';

export const toNano = (balance: number): number => balance / 1e9;

export const createWalletContract = async (mnemonic: string, w_interface: string) => {
    const walletKey = await mnemonicToWalletKey(mnemonic.split(" "));

    let walletContract;
    switch (w_interface) {
        case 'wallet_v3r2':
            walletContract = WalletContractV3R2.create({ publicKey: walletKey.publicKey, workchain: 0 });
            break;
        case 'wallet_v4r2':
            walletContract = WalletContractV4.create({ publicKey: walletKey.publicKey, workchain: 0 });
            break;
        default:
            throw new Error(`Unsupported wallet interface: ${w_interface}`);
    }

    return { walletContract, walletKey };
};
