import React, { useState } from 'react';
import { createWallet } from '../helpers/create-wallet';
import './ParallelFunctionExecutor.css';

const ParallelFunctionExecutor: React.FC = () => {
    const [n, setN] = useState<number>();
    const [logs, setLogs] = useState<string[]>([]);
    const [walletName, setWalletName] = useState<string>('');

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setN(Number(event.target.value));
    };

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setWalletName(event.target.value);
    };

    const setWalletCount = (count: number) => {
        setN(count);
    };

    const executeFunctions = async () => {
        setLogs([]);
        for (let index = 0; index < n; index++) {
            await createWallet(index, walletName, setLogs);
        }
    };

    return (
        <div className="container">
            <div className="card">
                <h2 className="card-title">Wallet Generator</h2>
                
                <input
                    type="number"
                    value={n}
                    onChange={handleInputChange}
                    placeholder="Enter number of wallets"
                    className="input"
                />
                <div className="quick-buttons">
                    <button className="quick-button" onClick={() => setWalletCount(5)}>5</button>
                    <button className="quick-button" onClick={() => setWalletCount(10)}>10</button>
                    <button className="quick-button" onClick={() => setWalletCount(20)}>20</button>
                    <button className="quick-button" onClick={() => setWalletCount(100)}>100</button>
                    <button className="quick-button" onClick={() => setWalletCount(1000)}>1000</button>
                </div>
                <input
                    type="text"
                    value={walletName}
                    onChange={handleNameChange}
                    placeholder="Enter wallet name"
                    className="input"
                />
                <button onClick={executeFunctions} className="button">Execute</button>
                <div className="logs-container">
                    {logs.map((log, index) => (
                        <div key={index} className="log">{log}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ParallelFunctionExecutor;
