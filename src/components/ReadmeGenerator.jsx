import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Copy, Eye, Edit2 } from 'lucide-react';

const ReadmeGenerator = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        installation: '',
        usage: '',
        license: 'MIT',
        features: '',
    });

    const generateMarkdown = () => {
        return `# ${formData.title || 'Proje Başlığı'}\n\n${formData.description || 'Proje açıklaması buraya gelecek.'}\n\n![License](https://img.shields.io/badge/license-${formData.license}-blue)\n![Build](https://img.shields.io/badge/build-passing-brightgreen)\n\n## Özellikler\n${formData.features.split('\n').map(f => `- ${f}`).join('\n') || '- Özellik 1\n- Özellik 2'}\n\n## Kurulum\n\`\`\`bash\n${formData.installation || 'npm install'}\n\`\`\`\n\n## Kullanım\n\`\`\`javascript\n${formData.usage || '// Kullanım örneği'}\n\`\`\`\n\n## Lisans\nBu proje [${formData.license}](LICENSE) lisansı ile korunmaktadır.`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid-mobile-1"
            style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '32px' }}
        >
            <div className="glass" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, className: 'outfit' }}>Proje Yapılandırması</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {[
                        { label: 'Proje Başlığı', key: 'title', type: 'input' },
                        { label: 'Açıklama', key: 'description', type: 'textarea' },
                        { label: 'Özellikler (Satır bazlı)', key: 'features', type: 'textarea' },
                        { label: 'Kurulum Komutu', key: 'installation', type: 'input' }
                    ].map(field => (
                        <div key={field.key}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field.label}</label>
                            {field.type === 'input' ? (
                                <input
                                    className="glass"
                                    style={{ width: '100%', padding: '16px', border: '1px solid var(--glass-border)', color: 'white', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '14px', outline: 'none', fontSize: '1rem' }}
                                    value={formData[field.key]}
                                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                />
                            ) : (
                                <textarea
                                    className="glass"
                                    style={{ width: '100%', height: '100px', padding: '16px', border: '1px solid var(--glass-border)', color: 'white', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '14px', resize: 'none', outline: 'none', fontSize: '1rem', lineHeight: '1.5' }}
                                    value={formData[field.key]}
                                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', border: '1px solid var(--primary-glow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Canlı Önizleme</h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            className="btn-primary"
                            style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                            onClick={() => {
                                navigator.clipboard.writeText(generateMarkdown());
                                alert('Markdown kopyalandı!');
                            }}
                        >
                            <Copy size={16} /> Kopyala
                        </button>
                    </div>
                </div>
                <div style={{
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    padding: '30px',
                    borderRadius: '18px',
                    flex: 1,
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.95rem',
                    color: 'var(--neon-blue)',
                    whiteSpace: 'pre-wrap',
                    border: '1px solid var(--glass-border)',
                    lineHeight: '1.6',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
                }}>
                    {generateMarkdown()}
                </div>
            </div>
        </motion.div>
    );
};

export default ReadmeGenerator;
