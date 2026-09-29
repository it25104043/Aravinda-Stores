import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserService } from '../../api/services';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                // Execute Login
                const res = await UserService.login({ email, password });
                const user = res.data;

                // Route user based on role
                if (user.role === 'CUSTOMER') {
                    navigate('/products');
                } else {
                    navigate('/admin/customers-orders');
                }
            } else {
                // Execute Registration (Defaulting new sign-ups to CUSTOMER role)
                const payload = {
                    fullName,
                    email,
                    phone,
                    passwordHash: password, // Maps directly to your Spring Boot User entity
                    role: 'CUSTOMER',
                    active: true
                };

                await UserService.register(payload);
                alert("Account created successfully. Please log in.");
                setIsLogin(true); // Flip back to the login view
                setPassword('');
            }
        } catch (err) {
            setError(isLogin
                ? "Invalid credentials. Please try again."
                : "Registration failed. Email might already be in use."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="view active">
            <Navbar />

            <section className="section" style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="panel form" style={{ width: '100%', maxWidth: '400px', marginTop: '40px' }}>

                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <div className="eyebrow">Aravinda Stores</div>
                        <h2 style={{ marginTop: '5px' }}>
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h2>
                    </div>

                    {error && (
                        <div style={{ background: '#fee8e8', color: 'var(--red)', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                        {!isLogin && (
                            <>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required={!isLogin}
                                />
                                <input
                                    type="text"
                                    placeholder="Mobile Number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required={!isLogin}
                                />
                            </>
                        )}

                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <button type="submit" className="primary" disabled={loading} style={{ marginTop: '10px' }}>
                            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <button
                            className="link"
                            style={{ border: 0, background: 'none', color: 'var(--muted)' }}
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                            }}
                        >
                            {isLogin ? "Don't have an account? Register" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}