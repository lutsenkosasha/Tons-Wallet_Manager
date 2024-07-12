import React, { useEffect, useState } from 'react';
import {fromNano} from 'ton';
import styles from './WalletsTable.module.css';
import {Wallet} from "../../interfaces/wallet.ts";
import { WalletInfo } from '../helpers/fetch-wallet-info.ts';
import { fetchWallets, fetchWalletInfo } from '../../api/walletAPI.ts';

const WalletsTable: React.FC = () => {
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [walletInfo, setWalletInfo] = useState<{ [key: string]: WalletInfo }>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [minBalance, setMinBalance] = useState<string>('');
    const [maxBalance, setMaxBalance] = useState<string>('');
    const [filteredWallets, setFilteredWallets] = useState<Wallet[]>([]); // Отфильтрованные кошельки

    const walletsPerPage = 20;

    useEffect(() => {
        const fetchAllWallets = async () => {
            try {
                const wallets = await fetchWallets();
                setWallets(wallets);
                setFilteredWallets(wallets); // Изначально все кошельки отображаются
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
                        balance: fromNano(info.balance),
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

    const handleCopyClick = (mnemonic: string) => {
        navigator.clipboard.writeText(mnemonic).then(
            () => {
                alert('Mnemonic copied to clipboard!');
            },
            () => {
                alert('Failed to copy mnemonic.');
            }
        );
    };

    const indexOfLastWallet = currentPage * walletsPerPage;
    const indexOfFirstWallet = indexOfLastWallet - walletsPerPage;
    const currentWallets = filteredWallets.slice(indexOfFirstWallet, indexOfLastWallet);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const sortWalletsByBalance = () => {
        const sortedWallets = [...filteredWallets].sort((a, b) => {
            const balanceA = parseFloat(walletInfo[a.address]?.balance) || 0;
            const balanceB = parseFloat(walletInfo[b.address]?.balance) || 0;
    
            if (sortOrder === 'asc') {
                return balanceA - balanceB;
            } else {
                return balanceB - balanceA;
            }
        });
    
        setFilteredWallets(sortedWallets);
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    const handleMinBalanceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMinBalance(event.target.value);
    };

    const handleMaxBalanceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMaxBalance(event.target.value);
    };

    const filterWalletsByBalance = () => {
        const min = parseFloat(minBalance) || 0;
        const max = parseFloat(maxBalance) || Infinity;
        const filtered = wallets.filter(wallet => {
            const balance = parseFloat(walletInfo[wallet.address]?.balance) || 0;
            return balance >= min && balance <= max;
        });
        setFilteredWallets(filtered);
        setCurrentPage(1); // Сбросить на первую страницу при фильтрации
    };

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <div>
            <div className={styles.filterContainer}>
                <label>
                    Min Balance:
                    <input
                        type="number"
                        value={minBalance}
                        onChange={handleMinBalanceChange}
                        className={styles.filterInput}
                    />
                </label>
                <label>
                    Max Balance:
                    <input
                        type="number"
                        value={maxBalance}
                        onChange={handleMaxBalanceChange}
                        className={styles.filterInput}
                    />
                </label>
                <button onClick={filterWalletsByBalance} className={styles.filterButton}>
                    Filter by Balance
                </button>
                <button className={styles.sortButton} onClick={sortWalletsByBalance}>
                    Sort by Balance {sortOrder === 'asc' ? '▲' : '▼'}
                </button>
            </div>
            <table className={styles.table}>
                <thead className={styles.thead}>
                    <tr>
                        <th className={styles.th}>#</th>
                        <th className={styles.th}>Name</th>
                        <th className={styles.th}>Mnemonic</th>
                        <th className={styles.th}>Address</th>
                        <th className={styles.th}>Created</th>
                        <th className={styles.th}>Balance</th>
                        <th className={styles.th}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {currentWallets.map((wallet, index) => (
                        <tr key={index} className={styles.tr}>
                            <td className={styles.td}>{indexOfFirstWallet + index + 1}</td>
                            <td className={styles.td}>{wallet.name}</td>
                            <td className={styles.td}>
                                <button className={styles.copyButton} onClick={() => handleCopyClick(wallet.mnemonic)}>
                                    Copy
                                </button>
                            </td>
                            <td className={styles.td}>
                                <a href={`https://tonscan.com/${wallet.address}?tab=transactions`} target="_blank" rel="noopener noreferrer">
                                    {wallet.address}
                                </a>
                            </td>
                            <td className={styles.td}>{wallet.created ? new Date(wallet.created).toLocaleString() : 'N/A'}</td>
                            <td className={styles.td}>
                                {walletInfo[wallet.address] !== undefined ? walletInfo[wallet.address].balance : 'Loading...'}
                            </td>
                            <td className={styles.td}>
                                {walletInfo[wallet.address] !== undefined ? walletInfo[wallet.address].status : 'Loading...'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className={styles.pagination}>
                <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={styles.paginationButton}
                >
                    Previous
                </button>
                <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === Math.ceil(filteredWallets.length / walletsPerPage)}
                    className={styles.paginationButton}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default WalletsTable;