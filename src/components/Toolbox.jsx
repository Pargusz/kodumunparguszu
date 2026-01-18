import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Trash2, Check, RefreshCw } from 'lucide-react';

const Toolbox = () => {
    const [activeTool, setActiveTool] = useState('json');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const tools = [
        { id: 'json', label: 'JSON Formatter' },
        { id: 'jwt', label: 'JWT Decoder' },
        { id: 'base64', label: 'Base64' },
        { id: 'regex', label: 'Regex Tester' },
        { id: 'sql', label: 'SQL Builder' },
        { id: 'gradient', label: 'CSS Gradient' },
    ];

    const handleProcess = (type) => {
        setError('');
        try {
            if (type === 'json') {
                const formatted = JSON.stringify(JSON.parse(input), null, 2);
                setOutput(formatted);
            } else if (type === 'jwt') {
                const parts = input.split('.');
                if (parts.length !== 3) throw new Error('Geçersiz JWT formatı');
                const header = JSON.parse(atob(parts[0]));
                const payload = JSON.parse(atob(parts[1]));
                setOutput(JSON.stringify({ header, payload }, null, 2));
            } else if (type === 'base64-en') {
                setOutput(btoa(input));
            } else if (type === 'base64-de') {
                setOutput(atob(input));
            } else if (type === 'regex') {
                const match = input.match(/\/(.+)\/(.*)/);
                if (match) {
                    setOutput('Regex Validated');
                }
            }
        } catch (err) {
            setError(err.message);
            setOutput('');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px', maskImage: 'linear-gradient(to right, black 80%, transparent)' }}>
                {tools.map(tool => (
                    <motion.button
                        key={tool.id}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setActiveTool(tool.id); setInput(''); setOutput(''); setError(''); }}
                        className="glass"
                        style={{
                            padding: '12px 24px',
                            border: 'none',
                            borderRadius: '16px',
                            color: activeTool === tool.id ? 'var(--primary)' : 'var(--text-dim)',
                            backgroundColor: activeTool === tool.id ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-card)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            border: activeTool === tool.id ? '1px solid var(--primary)' : '1px solid var(--glass-border)'
                        }}
                    >
                        {tool.label}
                    </motion.button>
                ))}
            </div>

            <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, className: 'outfit' }}>Girdi</h3>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {activeTool === 'base64' && (
                                <>
                                    <button onClick={() => handleProcess('base64-en')} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Encode</button>
                                    <button onClick={() => handleProcess('base64-de')} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Decode</button>
                                </>
                            )}
                            {activeTool !== 'base64' && (
                                <button onClick={() => handleProcess(activeTool)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                                    İşle <RefreshCw size={14} />
                                </button>
                            )}
                            <button onClick={() => setInput('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}>
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`${activeTool.toUpperCase()} verinizi buraya yapıştırın...`}
                        style={{
                            flex: 1,
                            minHeight: '350px',
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '16px',
                            color: 'white',
                            padding: '20px',
                            fontFamily: 'monospace',
                            fontSize: '1rem',
                            resize: 'none',
                            outline: 'none',
                            lineHeight: '1.5'
                        }}
                    />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }} className="glass" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, className: 'outfit' }}>Çıktı</h3>
                        <button
                            onClick={copyToClipboard}
                            disabled={!output}
                            className="glass"
                            style={{ padding: '8px 16px', border: '1px solid var(--glass-border)', color: copied ? '#10b981' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.85rem' }}
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? 'Kopyalandı' : 'Kopyala'}
                        </button>
                    </div>
                    <div
                        style={{
                            flex: 1,
                            minHeight: '350px',
                            backgroundColor: 'rgba(59, 130, 246, 0.03)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '16px',
                            color: error ? '#ef4444' : 'var(--neon-blue)',
                            padding: '20px',
                            fontFamily: 'monospace',
                            fontSize: '1rem',
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.5'
                        }}
                    >
                        {error ? `Hata: ${error}` : output || 'İşlenmiş sonuç burada görünecek...'}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Toolbox;
