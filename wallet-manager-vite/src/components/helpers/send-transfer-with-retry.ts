import { TonClient, WalletContractV4, internal } from "ton";

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const sendTransferWithRetry = async (
    client: TonClient,
    generatedWallet: WalletContractV4,
    new_w_key: any,
    main_wallet: any,
    maxRetries: number = 3,
    delayMs: number = 2000
) => {
    let attempts = 0;

    while (attempts < maxRetries) {
        try {
            const walletContract = client.open(generatedWallet);
            const seqno = await walletContract.getSeqno();
            await walletContract.sendTransfer({
                secretKey: new_w_key.secretKey,
                seqno: seqno,
                messages: [
                    internal({
                        to: main_wallet.address,
                        value: "0.04", // 0.04 TON
                        bounce: false
                    })
                ]
            });

            console.log('Transfer successful');
            return; // Успешный перевод, выходим из функции
        } catch (error) {
            // @ts-ignore
            const statusCode = error.response?.status;

            if (statusCode === 500 || 404) {
                attempts++;
                console.error(`Attempt ${attempts} failed with status ${statusCode}. Retrying in ${delayMs}ms...`);
                await delay(delayMs); // Задержка перед повторной попыткой
            } else {
                console.error('Unexpected error:', error);
                throw error; // Прерываем, если ошибка не 500 или 404
            }
        }
    }
    throw new Error(`Failed to send transfer after ${maxRetries} attempts`);
};