import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';

export default function Navbar() {
    const { cart } = useContext(StoreContext);
    const navigate = useNavigate();
    const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);

    return (
        <div className="nav">
            <button className="link logo" onClick={() => navigate('/')}>
                ARAVINDA STORES
                <span> LPG STORE• ALUTHGAMA</span>
            </button>
            <div className="navlinks">
                <Link to="/"><button>Home</button></Link>
                <Link to="/products"><button>LPG Cylinders</button></Link>
                <Link to="/auth"><button>Sign In</button></Link>

            </div>
            <button className="cartbtn" onClick={() => navigate('/cart')}>
                Cart <span className="badge">{cartCount}</span>
            </button>
        </div>
    );
}