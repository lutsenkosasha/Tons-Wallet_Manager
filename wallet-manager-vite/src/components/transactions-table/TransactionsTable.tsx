import React, { useEffect, useState } from 'react';
import styles from './TransactionsTable.module.css';
import { fetchTransactions } from '../../api/transactionAPI';
import { fetchWalletInfo} from '../../api/walletAPI.ts';
import { WalletInfo } from '../helpers/fetch-wallet-info.ts'
import { fromNano } from 'ton';
import { Transaction } from '../../interfaces/transaction';

const TransactionsTable: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [walletInfo, setWalletInfo] = useState<{ [key: string]: WalletInfo }>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [filterMinAmount, setFilterMinAmount] = useState<string>('');
    const [filterMaxAmount, setFilterMaxAmount] = useState<string>('');
    const [sortByDateOrder, setSortByDateOrder] = useState<'asc' | 'desc'>('asc');

    const transactionsPerPage = 20;

    useEffect(() => {
        const fetchAllTransactions = async () => {
            try {
                const response = await fetchTransactions();
                const transactions = response.transactions.map((transaction: any) => ({
                    sender: transaction.from_w,
                    receiver: transaction.to_ws,
                    amount: transaction.amount,
                    status: transaction.status,
                    created: transaction.created,
                }));
                console.log('API response data:', transactions); // Логирование данных для отладки

                const cleanTransactions = transactions.filter(
                    (transaction: Transaction) => transaction.sender && transaction.receiver
                );
                if (cleanTransactions.length < transactions.length) {
                    console.warn(`${transactions.length - cleanTransactions.length} transactions filtered out due to missing addresses`);
                }

                setTransactions(cleanTransactions);
                setFilteredTransactions(cleanTransactions);
            } catch (error) {
                setError('Error fetching data');
            } finally {
                setLoading(false);
            }
        };

        fetchAllTransactions();
    }, []);

    useEffect(() => {
        console.log('Transactions:', transactions); // Логирование транзакций
        if (transactions.length > 0) {
            fetchAllWalletInfo();
        }
    }, [transactions]);

    const fetchAllWalletInfo = async () => {
        const walletInfoData: { [key: string]: WalletInfo } = {};
        for (const transaction of transactions) {
            const addresses = [transaction.sender, transaction.receiver];
            for (const address of addresses) {
                if (address) { // Проверка на undefined
                    console.log('Fetching wallet info for address:', address); // Логирование адреса
                    if (!walletInfoData[address]) {
                        try {
                            const info = await fetchWalletInfo(address);
                            walletInfoData[address] = {
                                balance: fromNano(info.balance),
                                status: info.status,
                            };
                        } catch (error) {
                            console.error(`Error fetching wallet info for ${address}: ${error}`);
                        }
                    }
                } else {
                    console.warn('Undefined address found in transaction:', transaction);
                }
            }
        }
        setWalletInfo(walletInfoData);
    };

    const indexOfLastTransaction = currentPage * transactionsPerPage;
    const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
    const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const sortTransactionsByAmount = () => {
        const sortedTransactions = [...filteredTransactions].sort((a, b) => {
            const amountA = parseFloat(a.amount) || 0;
            const amountB = parseFloat(b.amount) || 0;

            if (sortOrder === 'asc') {
                return amountA - amountB;
            } else {
                return amountB - amountA;
            }
        });

        setFilteredTransactions(sortedTransactions);
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    const sortTransactionsByDate = () => {
        const sortedTransactions = [...filteredTransactions].sort((a, b) => {
            const dateA = new Date(a.created).getTime();
            const dateB = new Date(b.created).getTime();

            if (sortByDateOrder === 'asc') {
                return dateA - dateB;
            } else {
                return dateB - dateA;
            }
        });

        setFilteredTransactions(sortedTransactions);
        setSortByDateOrder(sortByDateOrder === 'asc' ? 'desc' : 'asc');
    };

    const handleFilterMinAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilterMinAmount(event.target.value);
    };

    const handleFilterMaxAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilterMaxAmount(event.target.value);
    };

    const filterTransactionsByAmount = () => {
        const min = filterMinAmount === '' ? 0 : parseFloat(filterMinAmount);
        const max = filterMaxAmount === '' ? Infinity : parseFloat(filterMaxAmount);
        const filtered = transactions.filter(transaction => {
            const amount = parseFloat(transaction.amount) || 0;
            return amount >= min && amount <= max;
        });
        setFilteredTransactions(filtered);
        setCurrentPage(1); // Сбросить на первую страницу при фильтрации
    };

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <div className={styles.tableContainer}>
            <div className={styles.filterContainer}>
                <label>
                    Min Amount:
                    <input
                        type="number"
                        value={filterMinAmount}
                        onChange={handleFilterMinAmountChange}
                        className={styles.filterInput}
                    />
                </label>
                <label>
                    Max Amount:
                    <input
                        type="number"
                        value={filterMaxAmount}
                        onChange={handleFilterMaxAmountChange}
                        className={styles.filterInput}
                    />
                </label>
                <button onClick={filterTransactionsByAmount} className={styles.filterButton}>
                    Filter by Amount
                </button>
                <button className={styles.sortButton} onClick={sortTransactionsByAmount}>
                    Sort by Amount {sortOrder === 'asc' ? '▲' : '▼'}
                </button>
                <button className={styles.sortButton} onClick={sortTransactionsByDate}>
                    Sort by Date {sortByDateOrder === 'asc' ? '▲' : '▼'}
                </button>
            </div>
            <table className={styles.table}>
                <thead className={styles.thead}>
                    <tr>
                        <th className={styles.th}>#</th>
                        <th className={styles.th}>Sender</th>
                        <th className={styles.th}>Receiver</th>
                        <th className={styles.th}>Created</th>
                        <th className={styles.th}>Amount</th>
                        <th className={styles.th}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {currentTransactions.map((transaction, index) => (
                        <tr key={index} className={styles.tr}>
                            <td className={styles.td}>{indexOfFirstTransaction + index + 1}</td>
                            <td className={styles.td}>
                                <a href={`https://tonscan.com/${transaction.sender}?tab=transactions`} target="_blank" rel="noopener noreferrer">
                                    {transaction.sender}
                                </a>
                            </td>
                            <td className={styles.td}>
                                <a href={`https://tonscan.com/${transaction.receiver}?tab=transactions`} target="_blank" rel="noopener noreferrer">
                                    {transaction.receiver}
                                </a>
                            </td>
                            <td className={styles.td}>{new Date(transaction.created).toLocaleString()}</td>
                            <td className={styles.td}>{transaction.amount}</td>
                            <td className={styles.td}>{transaction.status}</td>
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
                    disabled={currentPage === Math.ceil(filteredTransactions.length / transactionsPerPage)}
                    className={styles.paginationButton}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default TransactionsTable;