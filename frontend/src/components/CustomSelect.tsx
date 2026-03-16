'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    label?: string;
    options: string[] | Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
}

export default function CustomSelect({ label, options, value, onChange, placeholder, required }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const formattedOptions: Option[] = options.map(opt => 
        typeof opt === 'string' ? { value: opt, label: opt.charAt(0).toUpperCase() + opt.slice(1).replace(/-/g, ' ') } : opt
    );

    const selectedOption = formattedOptions.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            {label && <label className="input-label">{label} {required && '*'}</label>}
            
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="input-field"
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    cursor: 'pointer',
                    borderColor: isOpen ? 'var(--accent-purple-light)' : 'var(--glass-border)',
                    background: isOpen ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)',
                }}
            >
                <span style={{ color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {selectedOption ? selectedOption.label : placeholder || 'Select option...'}
                </span>
                <ChevronDown 
                    size={16} 
                    style={{ 
                        transition: 'transform 0.3s ease', 
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: 'var(--text-muted)'
                    }} 
                />
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    background: 'rgba(15, 2, 30, 0.98)',
                    border: '1px solid var(--accent-purple-light)',
                    borderRadius: '12px',
                    padding: '8px',
                    zIndex: 1000,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(20px)',
                    maxHeight: '260px',
                    overflowY: 'auto',
                }}>
                    {formattedOptions.map((opt) => (
                        <div
                            key={opt.value}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            style={{
                                padding: '10px 14px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: value === opt.value ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                                color: value === opt.value ? 'var(--accent-gold)' : 'var(--text-secondary)',
                                transition: 'all 0.2s ease',
                                marginBottom: '2px',
                                fontSize: '0.9rem',
                            }}
                            onMouseEnter={(e) => {
                                if (value !== opt.value) {
                                    (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)';
                                    (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (value !== opt.value) {
                                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                                }
                            }}
                        >
                            {opt.label}
                            {value === opt.value && <Check size={14} color="var(--accent-gold)" />}
                        </div>
                    ))}
                    {formattedOptions.length === 0 && (
                        <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            No options available
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
