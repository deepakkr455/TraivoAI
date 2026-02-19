
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const CustomerLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* <Navbar /> */}
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
};

export default CustomerLayout;
