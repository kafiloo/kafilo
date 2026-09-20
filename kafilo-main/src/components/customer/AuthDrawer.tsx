'use client';

import { useState } from 'react';
import { usePwaAuthStore } from '@/store/usePwaAuthStore';

interface AuthDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  context?: 'checkout' | 'loyalty';
}

export default function AuthDrawer({ isOpen, onClose, onSuccess, context = 'checkout' }: AuthDrawerProps) {
  const { setCustomer } = usePwaAuthStore();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // --- LOGIKA AUTO-STRIP UNTUK UI ---
  const formatPhone = (raw: string) => {
    if (!raw) return "";
    if (raw.length <= 3) return raw;
    if (raw.length <= 7) return `${raw.slice(0, 3)}-${raw.slice(3)}`;
    return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`;
  };

  const isPhoneValid = phone.length >= 10 && phone.length <= 14;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPhoneValid) return; // Keamanan ganda

    setIsLoading(true);
    setError('');

    // Jika nama kosong, kita otomatis beri tanda strip "-"
    const finalName = name.trim() ? name.trim() : '-';

    try {
      const res = await fetch('/api/v1/pwa/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Menggunakan body persis seperti logikamu sebelumnya
        body: JSON.stringify({ phone, name: finalName }), 
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Gagal login. Silakan coba lagi.');
        setIsLoading(false);
        return;
      }

      // LOGIKA INTI: Tetap menyertakan token agar PWA tahu user sudah login!
      setCustomer({
        id: data.customer.id,
        name: data.customer.name,
        phone: data.customer.phone,
        points: data.customer.points,
        token: data.token, // <- Ini yang tadi tidak sengaja saya hapus
      });

      // Simpan penanda bahwa barusan login
      sessionStorage.setItem("justLoggedIn", "true");

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError('Koneksi terputus. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 relative z-10 animate-in slide-in-from-bottom-full duration-300">
        
        {/* Handle Garis (Visual) */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>

        <div className="text-center mb-6">
          <h2 className="font-extrabold text-xl text-gray-900 mb-1">
            {context === 'checkout' ? 'Detail Pemesan' : 'Daftar Kofilo Loyalty'}
          </h2>
          <p className="text-sm text-gray-500">
            {context === 'checkout' ? 'Silakan lengkapi data berikut untuk proses checkout dan pencetakan setruk.' : 'Masuk untuk mulai mengumpulkan poin dan menukarnya dengan menu gratis!'}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-extrabold text-gray-700 ml-1">
              Nama Lengkap <span className="text-gray-400 font-medium text-xs ml-1">(Opsional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cth: Alex Morgan"
              className="bg-gray-50 border border-gray-200 text-gray-900 text-[15px] font-bold rounded-2xl px-5 py-4 focus:outline-none focus:border-[#7a5c43]/40 focus:ring-4 focus:ring-[#7a5c43]/10 transition-all placeholder-gray-400"
              // required dihapus agar jadi opsional
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-extrabold text-gray-700 ml-1">Nomor WhatsApp</label>
            <div className={`flex border rounded-2xl overflow-hidden transition-all ${
              phone.length > 0 && !isPhoneValid
                ? 'border-red-300 bg-red-50 focus-within:ring-red-100'
                : 'border-gray-200 bg-gray-50 focus-within:border-[#7a5c43]/40 focus-within:ring-4 focus-within:ring-[#7a5c43]/10'
            }`}>
              <span className="flex items-center px-4 bg-gray-100/50 text-gray-500 font-extrabold text-[15px] border-r border-gray-200">
                +62
              </span>
              <input
                type="tel"
                required
                value={formatPhone(phone)}
                onChange={(e) => {
                  let raw = e.target.value.replace(/\D/g, '');
                  // Mencegah user mengetik 0 atau 62 di awal karena sudah ada +62 permanen
                  if (raw.startsWith('62')) raw = raw.slice(2);
                  else if (raw.startsWith('0')) raw = raw.slice(1);
                  
                  raw = raw.slice(0, 14); // Maksimal 14 angka
                  setPhone(raw);
                }}
                placeholder="812-3456-7890"
                className="w-full bg-transparent text-gray-900 text-[15px] font-bold px-4 py-4 focus:outline-none placeholder-gray-400 tracking-wide"
              />
            </div>
            {/* Peringatan text merah di bawah input kalau nomer nanggung */}
            {phone.length > 0 && !isPhoneValid && (
              <p className="text-[11px] text-red-500 font-bold pl-1 mt-1">Minimal 10 angka.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !isPhoneValid}
            className={`mt-4 w-full py-4 rounded-xl font-bold text-[15px] flex items-center justify-center transition-all ${
              isLoading || !isPhoneValid 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-[#7a5c43] text-white hover:bg-[#634832] active:scale-[0.98]'
            }`}
          >
            {isLoading ? 'Memproses...' : 'Lanjut'}
          </button>
        </form>
      </div>
    </div>
  );
}