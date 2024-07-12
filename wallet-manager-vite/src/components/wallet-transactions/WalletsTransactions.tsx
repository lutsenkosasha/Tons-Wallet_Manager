import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './WalletsTransactions.module.css';
import { Wallet, WalletInfo } from "../../interfaces/wallet.ts";
import { fetchWalletInfo, fetchWallets } from "../../api/walletAPI.ts";
import { fromNano } from "ton";

const TransactionsCreator: React.FC = () => {
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [walletInfo, setWalletInfo] = useState<{ [key: string]: WalletInfo }>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFromWallets, setSelectedFromWallets] = useState<string[]>([]);
    const [selectedToWallets, setSelectedToWallets] = useState<string[]>([]);
    const [selectedToGroups, setSelectedToGroups] = useState<string[]>([]);
    const [amount, setAmount] = useState<string>('0');
    const [logs, setLogs] = useState<string[]>([]);
    const [groupName, setGroupName] = useState<string>('');
    const [walletGroups, setWalletGroups] = useState<{ name: string, wallets: Wallet[] }[]>([]);
    const [selectedGroupToDelete, setSelectedGroupToDelete] = useState<string>('');

    useEffect(() => {
        const fetchAllWallets = async () => {
            try {
                const wallets = await fetchWallets();
                setWallets(wallets);
            } catch (error) {
                setError('Error fetching data');
            } finally {
                setLoading(false);
            }
        };

        fetchAllWallets();
    }, []);

    useEffect(() => {
        const fetchAllWalletInfo = async () => {
            const walletInfoData: { [key: string]: WalletInfo } = {};
            for (const wallet of wallets) {
                try {
                    const info = await fetchWalletInfo(wallet.address);
                    walletInfoData[wallet.address] = {
                        balance: parseFloat(String(fromNano(info.balance))),
                        status: info.status,
                    };
                } catch (error) {
                    console.error(`Error fetching wallet info for ${wallet.address}: ${error}`);
                }
            }
            setWalletInfo(walletInfoData);
        };

        if (wallets.length > 0) {
            fetchAllWalletInfo();
        }
    }, [wallets]);

    useEffect(() => {
        const storedGroups = localStorage.getItem('walletGroups');
        if (storedGroups) {
            setWalletGroups(JSON.parse(storedGroups));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('walletGroups', JSON.stringify(walletGroups));
    }, [walletGroups]);

    const handleFromWalletsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = event.target;
        setSelectedFromWallets(prev =>
            checked ? [...prev, value] : prev.filter(wallet => wallet !== value)
        );
    };

    const handleToWalletsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = event.target;
        setSelectedToWallets(prev =>
            checked ? [...prev, value] : prev.filter(wallet => wallet !== value)
        );
    };

    const handleToGroupsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = event.target;
        setSelectedToGroups(prev =>
            checked ? [...prev, value] : prev.filter(group => group !== value)
        );
    };

    const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (/^\d*\.?\d*$/.test(value)) {
            setAmount(value);
        }
    };

    const logMessage = (message: string) => {
        setLogs(prevLogs => [...prevLogs, message]);
    };

    const handleTransaction = async () => {
        logMessage('Starting transaction process...');
        logMessage(`From Wallets: ${selectedFromWallets}`);
        logMessage(`To Wallets: ${selectedToWallets}`);
        logMessage(`To Groups: ${selectedToGroups}`);
        logMessage(`Amount: ${amount}`);
    
        const allToWallets = [...selectedToWallets];
    
        selectedToGroups.forEach(groupName => {
            const group = walletGroups.find(g => g.name === groupName);
            if (group) {
                group.wallets.forEach(wallet => {
                    if (!allToWallets.includes(wallet.address)) {
                        allToWallets.push(wallet.address);
                    }
                });
            }
        });
    
        console.log('Sending transaction with data:', {
            from_w: selectedFromWallets.join(','),
            to_ws: allToWallets.join(','),
            amount
        });
    
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/v1/transactions/transfer_ton', {
                from_w: selectedFromWallets.join(','),
                to_ws: allToWallets.join(','),
                amount
            });
    
            if (response.status === 200) {
                logMessage('Transaction successful!');
            } else {
                logMessage(`Transaction failed with status: ${response.status}`);
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                logMessage(`Transaction failed: ${error.message}`);
                console.error('Transaction error:', error);
            } else {
                logMessage('An unexpected error occurred.');
                console.error('Unexpected error:', error);
            }
        }
    
        logMessage('Transaction process completed.');
    };

    const handleCreateGroup = () => {
        if (!groupName || selectedToWallets.length === 0) return;

        const selectedWalletObjects = wallets.filter(wallet => selectedToWallets.includes(wallet.address));
        const newGroup = {
            name: groupName,
            wallets: selectedWalletObjects
        };
        setWalletGroups([...walletGroups, newGroup]);
        setGroupName('');
        setSelectedToWallets([]);
    };

    const handleDeleteGroup = () => {
        setWalletGroups(walletGroups.filter(group => group.name !== selectedGroupToDelete));
        setSelectedGroupToDelete('');
    };

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <h2>Wallets Transactions Generator</h2>
                <div className={styles.tablesContainer}>
                    <div className={styles.tableWrapper}>
                        <h3>From Wallets</h3>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Select</th>
                                    <th>Wallet</th>
                                    <th>Balance (TON)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {wallets.map(wallet => (
                                    <tr key={wallet.address}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                value={wallet.address}
                                                onChange={handleFromWalletsChange}
                                                checked={selectedFromWallets.includes(wallet.address)}
                                            />
                                        </td>
                                        <td>{wallet.name}</td>
                                        <td>{walletInfo[wallet.address]?.balance.toFixed(5) || 'Loading...'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className={styles.tableWrapper}>
                        <h3>To Wallets</h3>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Select</th>
                                    <th>Wallet</th>
                                    <th>Balance (TON)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {wallets.map(wallet => (
                                    <tr key={wallet.address}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                value={wallet.address}
                                                onChange={handleToWalletsChange}
                                                checked={selectedToWallets.includes(wallet.address)}
                                            />
                                        </td>
                                        <td>{wallet.name}</td>
                                        <td>{walletInfo[wallet.address]?.balance.toFixed(5) || 'Loading...'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className={styles.tableWrapper}>
                        <h3>To Group Wallets</h3>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Select</th>
                                    <th>Wallet Group</th>
                                    <th>Balance (TON)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {walletGroups.map(group => (
                                    <tr key={group.name}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                value={group.name}
                                                onChange={handleToGroupsChange}
                                                checked={selectedToGroups.includes(group.name)}
                                            />
                                        </td>
                                        <td>{group.name}</td>
                                        <td>
                                            {group.wallets.reduce((total, wallet) =>
                                                total + (walletInfo[wallet.address]?.balance || 0), 0
                                            ).toFixed(5)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className={styles.actionsContainer}>
                    <div className={styles.groupCreation}>
                        <input
                            type="text"
                            placeholder="Group Name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className={styles.input}
                        />
                        <button onClick={handleCreateGroup} className={styles.button}>Create Group</button>
                    </div>
                    <div className={styles.groupDeletion}>
                        <select
                            value={selectedGroupToDelete}
                            onChange={(e) => setSelectedGroupToDelete(e.target.value)}
                            className={styles.input}
                        >
                            <option value="">Select Group to Delete</option>
                            {walletGroups.map(group => (
                                <option key={group.name} value={group.name}>{group.name}</option>
                            ))}
                        </select>
                        <button onClick={handleDeleteGroup} className={styles.button}>Delete Group</button>
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="amount">Amount:</label>
                    <input
                        type="text"
                        id="amount"
                        value={amount}
                        onChange={handleAmountChange}
                        className={styles.input}
                    />
                </div>
                <button onClick={handleTransaction} className={styles.button}>Send Transaction</button>
                <div className={styles.logsContainer}>
                    {logs.map((log, index) => (
                        <div key={index} className={styles.log}>{log}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TransactionsCreator;