import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Plus, Trash } from 'lucide-react';

export default function ListDetailsPage() {
    const { id } = useParams();
    const [list, setList] = useState(null);
    const [contacts, setContacts] = useState([]);
    
    const [newContact, setNewContact] = useState({
        contact_name: '',
        contact_number_or_id: '',
        platform: 'whatsapp',
        custom_message: '',
        ai_enabled: false
    });

    useEffect(() => {
        fetchListAndContacts();
    }, [id]);

    const fetchListAndContacts = async () => {
        try {
            const listRes = await api.get('/lists');
            const currentList = listRes.data.find(l => l.id.toString() === id);
            setList(currentList);

            const contactsRes = await api.get(`/lists/${id}/contacts`);
            setContacts(contactsRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddContact = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/lists/${id}/contacts`, newContact);
            setNewContact({
                contact_name: '',
                contact_number_or_id: '',
                platform: 'whatsapp',
                custom_message: '',
                ai_enabled: false
            });
            fetchListAndContacts();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteContact = async (contactId) => {
        if(window.confirm('Bu əlaqəni silməyə əminsiniz?')) {
            await api.delete(`/contacts/${contactId}`);
            fetchListAndContacts();
        }
    };

    if (!list) return <div style={{padding: '40px'}}>Yüklənir...</div>;

    return (
        <div>
            <div className="page-header justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/lists" className="btn btn-outline" style={{padding: '8px'}}><ArrowLeft size={16}/></Link>
                    <h2 className="page-title">{list.title} ({list.date_mm_dd})</h2>
                </div>
            </div>

            <div className="card mb-6">
                <h3 className="mb-4" style={{ fontWeight: 600 }}>Yeni Əlaqə Əlavə Et</h3>
                <form onSubmit={handleAddContact}>
                    <div className="flex gap-4 mb-4">
                        <div className="form-group flex-1" style={{ marginBottom: 0 }}>
                            <label className="form-label">Ad/Soyad</label>
                            <input className="form-control" value={newContact.contact_name} onChange={e=>setNewContact({...newContact, contact_name: e.target.value})} placeholder="Ad Soyad" />
                        </div>
                        <div className="form-group flex-1" style={{ marginBottom: 0 }}>
                            <label className="form-label">Nömrə / ID</label>
                            <input className="form-control" value={newContact.contact_number_or_id} onChange={e=>setNewContact({...newContact, contact_number_or_id: e.target.value})} placeholder="994501234567" required />
                        </div>
                        <div className="form-group" style={{ width: '150px', marginBottom: 0 }}>
                            <label className="form-label">Platforma</label>
                            <select className="form-control" value={newContact.platform} onChange={e=>setNewContact({...newContact, platform: e.target.value})}>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="telegram">Telegram</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group mb-4">
                        <label className="form-label">Xüsusi Mesaj (Boş buraxıla bilər)</label>
                        <textarea className="form-control" value={newContact.custom_message} onChange={e=>setNewContact({...newContact, custom_message: e.target.value})} rows="2" placeholder="Siyahıdakı ümumi mesajı əvəz edəcək..."></textarea>
                    </div>
                    <div className="form-group mb-4 flex items-center gap-2">
                        <input type="checkbox" id="aiEnabled" checked={newContact.ai_enabled} onChange={e=>setNewContact({...newContact, ai_enabled: e.target.checked})} />
                        <label htmlFor="aiEnabled" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>Gələn mesaja AI ilə avtomatik cavab ver</label>
                    </div>
                    <button className="btn btn-primary" type="submit"><Plus size={16}/> Əlavə Et</button>
                </form>
            </div>

            <div className="card">
                <h3 className="mb-4" style={{ fontWeight: 600 }}>Siyahıdakı Əlaqələr ({contacts.length})</h3>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Ad</th>
                            <th>Nömrə / ID</th>
                            <th>Platforma</th>
                            <th>Xüsusi Mesaj</th>
                            <th>AI</th>
                            <th>Sil</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.length === 0 && (
                            <tr><td colSpan="6" style={{textAlign:'center'}}>Heç bir əlaqə yoxdur.</td></tr>
                        )}
                        {contacts.map(c => (
                            <tr key={c.id}>
                                <td>{c.contact_name || '-'}</td>
                                <td>{c.contact_number_or_id}</td>
                                <td style={{textTransform:'capitalize'}}>{c.platform}</td>
                                <td>{c.custom_message ? 'Var' : 'Yoxdur'}</td>
                                <td>{c.ai_enabled ? 'Aktiv' : 'Deaktiv'}</td>
                                <td>
                                    <button className="btn btn-danger" onClick={() => handleDeleteContact(c.id)} style={{padding: '6px'}}><Trash size={14} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
