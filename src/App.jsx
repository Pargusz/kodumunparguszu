import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Wrench,
    FileText,
    BrainCircuit,
    MessageSquareCode,
    Zap,
    ChevronRight,
    UserRound,
    MessageSquare,
    Menu,
    Github
} from 'lucide-react';
import './index.css';

import Toolbox from './components/Toolbox';
import ReadmeGenerator from './components/ReadmeGenerator';
import AiPromptLibrary from './components/AiPromptLibrary';
import InterviewSimulator from './components/InterviewSimulator';

const App = () => {
    // Initialize active tab from URL hash or default to 'dashboard'
    const getTabFromHash = () => {
        const hash = window.location.hash.replace('#', '');
        return hash || 'dashboard';
    };

    const [activeTab, setActiveTab] = useState(getTabFromHash);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Update active tab when hash changes (e.g. back/forward button)
    React.useEffect(() => {
        const handleHashChange = () => {
            setActiveTab(getTabFromHash());
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Update hash when active tab changes
    React.useEffect(() => {
        window.location.hash = activeTab;
    }, [activeTab]);

    const menuItems = [
        { id: 'dashboard', label: 'Ana Sayfa', icon: LayoutDashboard },
        { id: 'toolbox', label: 'Teknik Araçlar', icon: Wrench },
        { id: 'readme', label: 'README Oluşturucu', icon: FileText },
        { id: 'ai-prompts', label: 'AI Prompt Kütüphanesi', icon: BrainCircuit },
        { id: 'interview', label: 'Mülakat Simülatörü', icon: MessageSquareCode },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-deep)', position: 'relative', overflow: 'hidden' }}>
            {/* Background Blobs for depth */}
            <div className="bg-blob" style={{ top: '-100px', left: '-100px' }}></div>
            <div className="bg-blob bg-blob-2"></div>

            {/* Mobile Header */}
            <div className="glass mobile-header" style={{
                display: 'none',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                padding: '16px',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 0,
                borderLeft: 'none',
                borderRight: 'none',
                borderTop: 'none'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={24} color="var(--neon-blue)" />
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>PARGUSZU</span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                >
                    <Menu size={28} />
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`glass ${!isMobileMenuOpen ? 'sidebar-collapsed' : ''}`} style={{
                width: '280px',
                margin: '20px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '32px',
                position: 'fixed',
                height: 'calc(100vh - 40px)',
                zIndex: 50,
                boxShadow: '0 0 40px rgba(0,0,0,0.5)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-purple))',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 15px var(--primary-glow)'
                    }}>
                        <Zap size={24} color="#fff" />
                    </div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '1px' }} className="shimmer-text">PARGUSZU</h2>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsMobileMenuOpen(false);
                            }}
                            className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                width: '100%',
                                padding: '14px 18px',
                                background: activeTab === item.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                                border: 'none',
                                borderRadius: '12px',
                                color: activeTab === item.id ? 'var(--primary)' : 'var(--text-dim)',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                fontWeight: activeTab === item.id ? '700' : '500',
                                textAlign: 'left'
                            }}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto', padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '12px' }}>
                        Açık Kaynak v2.0 <span style={{ color: '#10b981', fontWeight: 'bold' }}>(Updated: {new Date().toLocaleTimeString()})</span>
                    </p>
                    <a href="https://github.com" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', textDecoration: 'none', fontWeight: 600 }}>
                        <Github size={18} /> GitHub'da Yıldızla
                    </a>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content-mobile" style={{
                flex: 1,
                marginLeft: '320px',
                padding: '40px',
                minHeight: '100vh',
                position: 'relative'
            }}>
                <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.5px' }}>
                            {menuItems.find(i => i.id === activeTab)?.label}
                        </h1>
                        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>Geliştirici Odaklı Araç Seti</p>
                    </div>
                    <div className="glass" style={{ padding: '8px 16px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Tüm sistemler aktif</span>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
                        {activeTab === 'toolbox' && <Toolbox />}
                        {activeTab === 'readme' && <ReadmeGenerator />}
                        {activeTab === 'ai-prompts' && <AiPromptLibrary />}
                        {activeTab === 'interview' && <InterviewSimulator />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

const DashboardView = ({ setActiveTab }) => {
    const stats = [
        { label: 'Araçlar', value: '24+', color: 'var(--primary)', icon: Zap },
        { label: 'Kullanıcılar', value: '1.2k', color: '#10b981', icon: UserRound },
        { label: 'Promptlar', value: '150+', color: 'var(--accent)', icon: MessageSquare },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
        >
            <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        variants={item}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        className="glass"
                        style={{ padding: '32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
                    >
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05 }}>
                            <stat.icon size={80} color={stat.color} />
                        </div>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>{stat.label}</p>
                        <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: stat.color, filter: `drop-shadow(0 0 10px ${stat.color}33)` }}>{stat.value}</h3>
                    </motion.div>
                ))}
            </div>

            <motion.div
                variants={item}
                className="glass neon-glow"
                style={{
                    padding: '50px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05))',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
            >
                <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '100%', background: 'radial-gradient(circle at center, var(--primary-glow) 0%, transparent 70%)', opacity: 0.3 }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.5px' }}>Geliştirici Gücünü Serbest Bırak</h2>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '32px', maxWidth: '650px', fontSize: '1.1rem', lineHeight: '1.6' }}>
                        Kodumun Parguszu, modern geliştiriciler için tasarlanmış hepsi bir arada bir merkezdir.
                        Güvenli, hızlı ve tamamen tarayıcı tabanlı araçlarla her gün daha verimli çalışın.
                    </p>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button className="btn-primary" onClick={() => setActiveTab('toolbox')} style={{ padding: '16px 32px' }}>
                            Hemen Başla <ChevronRight size={20} />
                        </button>
                        <button className="glass" style={{ padding: '16px 32px', border: '1px solid var(--glass-border)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                            Dokümantasyon
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default App;
