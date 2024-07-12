import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import WalletsTable from './components/wallet-table/WalletTable';
import ParallelFunctionExecutor from './components/wallet-create/Creator.tsx';
import WalletsTransactions from './components/wallet-transactions/WalletsTransactions';
import Header from "./components/header/Header.tsx";
import WalletToken from './components/token/Token.tsx';
import TransactionsTable from './components/transactions-table/TransactionsTable.tsx'

const App: React.FC = () => {
    return (
        <div className="App">
            {/*<h1>Wallets</h1>*/}
            {/*<WalletsTable />*/}
            {/*<ParallelFunctionExecutor />*/}
            <Router>
                <Header />
                <Routes>
                    <Route path="/" element={<WalletsTable />} />
                    <Route path="wallets_create" element={<ParallelFunctionExecutor />} />
                    <Route path="wallets_transactions_create" element={<WalletsTransactions />} />
                    <Route path="transactions_table" element={<TransactionsTable />} />
                    <Route path="token" element={<WalletToken />} />
                </Routes>
            </Router>
        </div>
    );
}

export default App;
