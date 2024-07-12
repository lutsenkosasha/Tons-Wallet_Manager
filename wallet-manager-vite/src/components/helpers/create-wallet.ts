import { mnemonicToWalletKey, mnemonicNew } from "ton-crypto";
import { WalletContractV4, internal, WalletContractV3R2, fromNano } from "ton";
import { sendTransferWithRetry, delay } from './send-transfer-with-retry';
import getTonClient from "../wallet-create/ton-client.ts";

export const createWallet = async (
    index: number,
    walletName: string,
    setLogs: React.Dispatch<React.SetStateAction<string[]>>
) => {
    const main_mnemonic = "quality response tube bounce word poverty beef south daring gadget wheel wire owner fee west obtain drill edit name theme lion van round shiver"; // your 24 secret words
    const main_key = await mnemonicToWalletKey(main_mnemonic.split(" "));
    const main_wallet = WalletContractV3R2.create({ publicKey: main_key.publicKey, workchain: 0 });

    try {
        // init ton client
        const client = getTonClient();
        try {
            // query balance from chain
            const balance = await client.getBalance(main_wallet.address);
            const balance_message = `current balance: ${fromNano(balance)}`;
            setLogs((prevLogs) => [...prevLogs, balance_message]);
        } catch (error) {
            const errorMessage = (error as Error).message || 'Unknown error';
            const message = `Error find balance main wallet: ${errorMessage}`;
            setLogs((prevLogs) => [...prevLogs, message]);
            throw error;
        }
        try {
            // query seqno from chain
            const test_walletContract = client.open(main_wallet);
            const test_seqno = await test_walletContract.getSeqno();
            const seqno_message = `current seqno: ${test_seqno}`;
            setLogs((prevLogs) => [...prevLogs, seqno_message]);
        } catch (error) {
            const errorMessage = (error as Error).message || 'Unknown error';
            const message = `Error find seqno main wallet: ${errorMessage}`;
            setLogs((prevLogs) => [...prevLogs, message]);
            throw error;
        }

        // generate new wallet things
        const new_w_mnemonic = await mnemonicNew();
        const new_w_key = await mnemonicToWalletKey(new_w_mnemonic);
        const generatedWallet = WalletContractV4.create({ publicKey: new_w_key.publicKey, workchain: 0 });
        const message = `Wallet ${index + 1} generated: ${generatedWallet.address.toString()}\n
        mnemonic: ${new_w_mnemonic}\n`;
        setLogs((prevLogs) => [...prevLogs, message]);

        // Create purchase main -> new wallet
        try {
            let walletContract = client.open(main_wallet);
            let seqno = await walletContract.getSeqno();
            await walletContract.sendTransfer({
                secretKey: main_key.secretKey,
                seqno: seqno,
                messages: [
                    internal({
                        to: generatedWallet.address,
                        value: "0.05", // 0.05 TON
                        bounce: false,
                    })
                ]
            });
            const message = `Sent 0.05 TON to New Wallet ${index + 1}: ${generatedWallet.address.toString()}`;
            setLogs((prevLogs) => [...prevLogs, message]);
        } catch (e) {
            const errorMessage = (e as Error).message || 'Unknown error';
            const message = `Error to send ton to new wallet: ${errorMessage}`;
            setLogs((prevLogs) => [...prevLogs, message]);
            throw e;
        }

        // and wait how balance init
        while (true) {
            const new_w_balance = await client.getBalance(generatedWallet.address);
            setLogs((prevLogs) => [...prevLogs, `Wallet ${index + 1} balance: ${fromNano(new_w_balance)}`]);
            if (parseFloat(fromNano(new_w_balance)) !== 0) {
                break;
            }
            await delay(2000); // Задержка в 2 секунды
        }
        const new_w_balance = await client.getBalance(generatedWallet.address);
        setLogs((prevLogs) => [...prevLogs, `Wallet ${index + 1} has non-zero balance: ${fromNano(new_w_balance)}`]);

        // If balance non-zero try to payload transaction
        await sendTransferWithRetry(client, generatedWallet, new_w_key, main_wallet);

        // Отправить POST-запрос
        const response = await fetch('http://127.0.0.1:8000/api/wallets/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: `${walletName} ${index + 1}`,
                address: generatedWallet.address.toString(),
                mnemonic: new_w_mnemonic.join(" "),
                created: null
            })
        });

        if (!response.ok) {
            throw new Error('Failed to send POST request');
        }
        setLogs((prevLogs) => [...prevLogs, `POST request successful for wallet ${index + 1}`]);
    } catch (error: any) {
        const errorMessage = error.message || 'Unknown error';
        setLogs((prevLogs) => [...prevLogs, `Error creating wallet ${index + 1}: ${errorMessage}`]);
    }
};