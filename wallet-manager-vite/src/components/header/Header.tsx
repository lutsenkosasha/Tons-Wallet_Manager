import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/icons/logo.png';
import './header-styles.css';

const Header: React.FC = () => {
    return (
        <div className="header-container">
            <nav className="header-nav">
                <ul className="header-nav-list">
                    <li className="header-list-item">
                        <Link to="/">
                            <img src={logo} alt="logo" className="header-logo" />
                        </Link>
                    </li>
                    <li className="header-list-item">
                        <Link to="/" className="header-list-item-link"> Wallet Table </Link>
                    </li>
                    <li className="header-list-item">
                        <Link to="/wallets_create" className="header-list-item-link"> Wallet Creator </Link>
                    </li>
                    <li className="header-list-item">
                        <Link to="/transactions_table" className="header-list-item-link"> Transactions Table </Link>
                    </li>
                    <li className="header-list-item">
                        <Link to="/wallets_transactions_create" className="header-list-item-link"> Transactions Creator </Link>
                    </li>
                    <li className="header-list-item">
                        <Link to="/token" className="header-list-item-link"> Token </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Header;
