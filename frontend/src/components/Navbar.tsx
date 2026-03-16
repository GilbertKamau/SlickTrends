'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X, User, LogOut, ChevronDown, Star, Sun, Moon, Megaphone } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

const categories = [
    { label: 'Robes', href: '/products?category=robes' },
    { label: 'Onesies', href: '/products?category=onesies' },
    { label: 'Pajamas', href: '/products?category=pajamas' },
    { label: 'Night Dresses', href: '/products?category=night-dresses' },
    { label: 'Baby Onesies', href: '/products?category=baby-onesies' },
    { label: 'Pre-Teen Robes', href: '/products?category=pre-teen-robes' },
    { label: 'Baby Robes', href: '/products?category=baby-robes' },
];

export default function Navbar() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const itemCount = useCartStore((s) => s.itemCount());
    const [mobileOpen, setMobileOpen] = useState(false);
    const [catOpen, setCatOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
        // Load theme after mount
        const savedTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
        if (savedTheme) setTheme(savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        setUserOpen(false);
    };

    return (
        <nav style={{
            position: 'sticky', top: 0, zIndex: 1000,
            background: 'rgba(10, 0, 18, 0.92)',
            borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
            backdropFilter: 'blur(20px)',
        }}>
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70 }}>
                {/* Logo */}
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #d4af37, #f0d060)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Star size={18} fill="#0a0012" color="#0a0012" />
                        </div>
                        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700 }}>
                            <span className="gradient-text">Slick</span>
                            <span style={{ color: '#b8a9d0', marginLeft: 4 }}>Trends</span>
                        </span>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="desktop-nav">
                    <Link href="/" style={{ color: pathname === '/' ? '#d4af37' : '#b8a9d0', textDecoration: 'none', padding: '8px 14px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s' }}>Home</Link>
                    
                    {(user?.role === 'admin' || user?.role === 'superadmin') && (
                        <Link href="/admin" style={{ color: '#a855f7', textDecoration: 'none', padding: '8px 14px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 700, border: '1px solid rgba(168, 85, 247, 0.3)', background: 'rgba(168, 85, 247, 0.1)' }}>Dashboard</Link>
                    )}

                    {/* Categories Dropdown */}
                    <div style={{ position: 'relative' }} onMouseEnter={() => setCatOpen(true)} onMouseLeave={() => setCatOpen(false)}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#b8a9d0', background: 'none', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer' }}>
                            Shop <ChevronDown size={14} />
                        </button>
                        {catOpen && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, minWidth: 200,
                                background: 'rgba(17, 0, 35, 0.98)', border: '1px solid rgba(124,58,237,0.25)',
                                borderRadius: 12, padding: '8px', backdropFilter: 'blur(20px)',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                            }}>
                                {categories.map((c) => (
                                    <Link key={c.label} href={c.href} style={{ display: 'block', padding: '9px 14px', color: '#b8a9d0', textDecoration: 'none', borderRadius: 8, fontSize: '0.875rem', transition: 'all 0.2s' }}
                                        onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#d4af37'; (e.target as HTMLElement).style.background = 'rgba(212,175,55,0.08)'; }}
                                        onMouseLeave={(e) => { (e.target as HTMLElement).style.color = '#b8a9d0'; (e.target as HTMLElement).style.background = 'transparent'; }}>
                                        {c.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link href="/products" style={{ color: '#b8a9d0', textDecoration: 'none', padding: '8px 14px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 500 }}>All Products</Link>
                </div>

                {/* Right Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Cart */}
                    <Link href="/cart" style={{ position: 'relative', textDecoration: 'none', color: '#b8a9d0', display: 'flex', alignItems: 'center', padding: '8px' }}>
                        <ShoppingBag size={22} />
                        {hasMounted && itemCount > 0 && (
                            <span style={{
                                position: 'absolute', top: 0, right: 0,
                                background: '#d4af37', color: '#0a0012',
                                width: 18, height: 18, borderRadius: '50%',
                                fontSize: '0.7rem', fontWeight: 800,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>{itemCount}</span>
                        )}
                    </Link>

                    {/* Theme Toggle */}
                    <button onClick={toggleTheme} style={{
                        background: 'none', border: 'none', color: '#b8a9d0',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px'
                    }}>
                        {hasMounted && (theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />)}
                    </button>

                    {/* User Menu */}
                    {hasMounted && user ? (
                        <div style={{ position: 'relative' }}>
                            <button onClick={() => setUserOpen(!userOpen)} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
                                borderRadius: 8, padding: '8px 14px', color: '#f5f0ff', cursor: 'pointer', fontSize: '0.875rem',
                            }}>
                                <User size={15} /> {user.name.split(' ')[0]}
                            </button>
                            {userOpen && (
                                <div style={{
                                    position: 'absolute', top: '110%', right: 0, minWidth: 180,
                                    background: 'rgba(17, 0, 35, 0.98)', border: '1px solid rgba(124,58,237,0.25)',
                                    borderRadius: 12, padding: 8, backdropFilter: 'blur(20px)',
                                }}>
                                    <Link href="/profile" style={{ display: 'block', padding: '9px 14px', color: '#b8a9d0', textDecoration: 'none', borderRadius: 8, fontSize: '0.875rem' }} onClick={() => setUserOpen(false)}>My Profile</Link>
                                    <Link href="/orders" style={{ display: 'block', padding: '9px 14px', color: '#b8a9d0', textDecoration: 'none', borderRadius: 8, fontSize: '0.875rem' }} onClick={() => setUserOpen(false)}>My Orders</Link>
                                    {(user.role === 'admin' || user.role === 'superadmin') && (
                                        <Link href="/admin" style={{ display: 'block', padding: '9px 14px', color: '#a855f7', textDecoration: 'none', borderRadius: 8, fontSize: '0.875rem' }} onClick={() => setUserOpen(false)}>Admin Panel</Link>
                                    )}
                                    {user.role === 'superadmin' && (
                                        <Link href="/superadmin" style={{ display: 'block', padding: '9px 14px', color: '#d4af37', textDecoration: 'none', borderRadius: 8, fontSize: '0.875rem' }} onClick={() => setUserOpen(false)}>Super Admin</Link>
                                    )}
                                    {user.role === 'superadmin' && (
                                        <Link href="/superadmin/promotions" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', color: '#10b981', textDecoration: 'none', borderRadius: 8, fontSize: '0.875rem' }} onClick={() => setUserOpen(false)}>
                                            <Megaphone size={14} /> Manage Ads
                                        </Link>
                                    )}
                                    <div style={{ height: 1, background: 'rgba(124,58,237,0.2)', margin: '6px 0' }} />
                                    <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', color: '#ef4444', background: 'none', border: 'none', borderRadius: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
                                        <LogOut size={14} /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : hasMounted ? (
                        <Link href="/auth/login" className="btn-primary" style={{ padding: '9px 20px', fontSize: '0.875rem', textDecoration: 'none' }}>Sign In</Link>
                    ) : null}

                    {/* Mobile Menu Toggle */}
                    <button onClick={() => setMobileOpen(!mobileOpen)} style={{ display: 'none', background: 'none', border: 'none', color: '#b8a9d0', cursor: 'pointer' }} className="mobile-toggle">
                        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            <div className={`mobile-drawer-overlay ${mobileOpen ? 'active' : ''}`} onClick={() => setMobileOpen(false)} />
            <div className={`mobile-drawer ${mobileOpen ? 'active' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-gold)' }}>Menu</span>
                    <button onClick={() => setMobileOpen(false)} style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={20} />
                    </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Link href="/" style={{ padding: '14px 16px', color: pathname === '/' ? 'var(--accent-gold)' : 'var(--text-secondary)', textDecoration: 'none', borderRadius: 12, background: pathname === '/' ? 'rgba(176,141,26,0.1)' : 'transparent', fontWeight: 600 }} onClick={() => setMobileOpen(false)}>Home</Link>
                    <Link href="/products" style={{ padding: '14px 16px', color: pathname === '/products' ? 'var(--accent-gold)' : 'var(--text-secondary)', textDecoration: 'none', borderRadius: 12, background: pathname === '/products' ? 'rgba(176,141,26,0.1)' : 'transparent', fontWeight: 600 }} onClick={() => setMobileOpen(false)}>All Products</Link>
                    
                    <div style={{ height: 1, background: 'var(--glass-border)', margin: '8px 0' }} />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, padding: '0 16px', marginBottom: 4 }}>Categories</p>
                    
                    {categories.map((c) => (
                        <Link key={c.label} href={c.href} style={{ padding: '12px 16px', color: 'var(--text-secondary)', textDecoration: 'none', borderRadius: 12, fontSize: '0.95rem', fontWeight: 500 }} onClick={() => setMobileOpen(false)}>{c.label}</Link>
                    ))}

                    <div style={{ height: 1, background: 'var(--glass-border)', margin: '8px 0' }} />
                    {!user ? (
                        <Link href="/auth/login" className="btn-primary" style={{ marginTop: 8, justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>Sign In</Link>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Link href="/profile" style={{ padding: '12px 16px', color: 'var(--text-secondary)', textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>My Profile</Link>
                            <Link href="/orders" style={{ padding: '12px 16px', color: 'var(--text-secondary)', textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>My Orders</Link>
                            <button onClick={handleLogout} style={{ padding: '12px 16px', color: '#dc2626', background: 'none', border: 'none', textAlign: 'left', fontSize: '1rem', cursor: 'pointer', fontWeight: 500 }}>Logout</button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
