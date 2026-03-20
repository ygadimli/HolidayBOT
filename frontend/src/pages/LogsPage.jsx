import React, { useState, useEffect } from 'react';
import api from '../api';
import { Trash } from 'lucide-react';

export default function LogsPage() {
    const [logs, setLogs] = useState('');

    const fetchLogs = async () => {
        try {
            const res = await api.get('/logs');
            setLogs(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleClear = async () => {
        if(window.confirm('Bütün xətaları silmək istəyirsiniz?')) {
            await api.post('/logs/clear');
            fetchLogs();
        }
    };

    return (
        <div>
            <div className="page-header">
                <h2 className="page-title">Xəta.log</h2>
                <button className="btn btn-danger" onClick={handleClear}><Trash size={16}/> Təmizlə</button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <pre style={{ 
                    margin: 0, 
                    padding: '24px', 
                    backgroundColor: '#111', 
                    color: '#0f0', 
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    minHeight: '400px',
                    maxHeight: '600px',
                    overflowY: 'auto'
                }}>
                    {logs || 'Heç bir xəta yoxdur.'}
                </pre>
            </div>
        </div>
    );
}
