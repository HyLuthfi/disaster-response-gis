import React, { useState } from 'react';
import { ShieldAlert, Lock, User, ArrowRight, Loader2, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Public');
  const [instansiName, setInstansiName] = useState('');
  const [armadaType, setArmadaType] = useState('Medis / Ambulans (RS)');
  const [agreed, setAgreed] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    if (isRegister) {
      if (password !== confirmPassword) {
        setError('Konfirmasi kata sandi tidak cocok.');
        setIsLoading(false);
        return;
      }
      if (!agreed) {
        setError('Anda harus menyetujui pernyataan dan ketentuan.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username, 
            password, 
            full_name: fullName,
            role: role,
            instansi_name: (role === 'Instansi' || role === 'Satgas') ? instansiName : null,
            armada_type: (role === 'Instansi' || role === 'Satgas') ? armadaType : null
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          onLogin(data.user);
        } else {
          setError(data.detail || 'Registrasi gagal. Coba username lain.');
        }
      } catch (err) {
        setError('Koneksi ke server terputus. Pastikan backend aktif.');
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        const response = await fetch('http://localhost:8000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          onLogin(data.user);
        } else {
          setError(data.detail || 'Username atau password salah.');
        }
      } catch (err) {
        setError('Koneksi ke server terputus. Pastikan backend aktif.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const autofill = (role) => {
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else if (role === 'rs_bob_bazar') {
      setUsername('rs_bob_bazar');
      setPassword('instansi123');
    } else if (role === 'bpbd_lamsel') {
      setUsername('bpbd_lamsel');
      setPassword('instansi123');
    } else if (role === 'ambulance_1') {
      setUsername('ambulance_1');
      setPassword('satgas123');
    } else if (role === 'bpbd_1') {
      setUsername('bpbd_1');
      setPassword('satgas123');
    } else if (role === 'user_1') {
      setUsername('User_1');
      setPassword('user123');
    } else if (role === 'user_2') {
      setUsername('User_2');
      setPassword('user123');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex bg-slate-50 font-sans overflow-hidden">
      
      {/* SISI KIRI: FORM LOGIN & DAFTAR (Sangat Presisi, Rapi, & Premium) */}
      <div className="w-full md:w-[42%] flex flex-col h-full py-10 px-10 md:px-16 bg-slate-50 z-10 overflow-y-auto">
        
        {/* Inner Wrapper - Centered and Slightly Larger */}
        <div className="max-w-[400px] w-full mx-auto flex flex-col my-auto">
          
          {/* Top Header - Brand Logo */}
          <div className="flex items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md shadow-blue-600/10">
                <ShieldAlert size={16} />
              </div>
              <span className="text-xs font-black text-slate-800 tracking-[0.05em] uppercase">DARLAM</span>
            </div>
          </div>

          {/* Main Content (Title + Form + Buttons) */}
          <div className="w-full">

            
            {/* Judul Besar bergaya Trailforge */}
            <div className="mb-8">
              <h1 className="text-[1.95rem] font-black text-slate-900 tracking-tight leading-none">
                {isRegister ? 'DAFTAR' : 'MASUK'}
                <span className="text-[2.65rem] font-black text-blue-600 tracking-tighter leading-[1.05] mt-1 block">
                  COMMAND CENTER
                </span>
              </h1>
              <p className="text-slate-500 text-[13px] font-medium mt-4 leading-relaxed">
                {isRegister 
                  ? 'Buat akun posko kebencanaan baru untuk koordinasi tanggap darurat.' 
                  : 'Akses analisis spasial, koordinasi armada evakuasi, dan pantau rute darurat bencana secara real-time.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 w-full">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-semibold flex items-start gap-2"
                >
                  <Info size={16} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}

              {successMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl text-xs font-semibold flex items-start gap-2"
                >
                  <Info size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <p>{successMessage}</p>
                </motion.div>
              )}

              {isRegister && (
                /* Field Nama Lengkap */
                <div className="space-y-1.5">
                  <label className="text-[9px] font-extrabold text-slate-400 tracking-[0.12em] uppercase block">NAMA LENGKAP</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <User size={14} />
                    </div>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-100/70 hover:bg-slate-100 border-none rounded-xl py-3.5 pl-10 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all text-xs font-semibold shadow-sm"
                      placeholder="Nama Lengkap Anda"
                      required
                    />
                  </div>
                </div>
              )}

              {isRegister && (role === 'Instansi' || role === 'Satgas') && (
                <>
                  {/* Field Nama Instansi */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-extrabold text-slate-400 tracking-[0.12em] uppercase block">NAMA INSTANSI</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        <ShieldAlert size={14} />
                      </div>
                      <input 
                        type="text" 
                        value={instansiName}
                        onChange={(e) => setInstansiName(e.target.value)}
                        className="w-full bg-slate-100/70 hover:bg-slate-100 border-none rounded-xl py-3.5 pl-10 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all text-xs font-semibold shadow-sm"
                        placeholder="Contoh: RSUD Abdul Moeloek, Damkar Kalianda"
                        required
                      />
                    </div>
                  </div>

                  {/* Field Tipe Armada / Pelayanan */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-extrabold text-slate-400 tracking-[0.12em] uppercase block">TIPE ARMADA / PELAYANAN</label>
                    <div className="relative group">
                      <select 
                        value={armadaType}
                        onChange={(e) => setArmadaType(e.target.value)}
                        className="w-full bg-slate-100/70 hover:bg-slate-100 border-none rounded-xl py-3.5 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all text-xs font-semibold shadow-sm appearance-none cursor-pointer"
                        required
                      >
                        <option value="Medis / Ambulans (RS)">Medis / Ambulans (RS)</option>
                        <option value="Pemadam Kebakaran (Damkar)">Pemadam Kebakaran (Damkar)</option>
                        <option value="Penyelamatan & Logistik (BPBD / SAR)">Penyelamatan & Logistik (BPBD / SAR)</option>
                        <option value="Alat Berat & Prasarana (PU)">Alat Berat & Prasarana (PU)</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Field Username */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold text-slate-400 tracking-[0.12em] uppercase block">USERNAME / EMAIL</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <User size={14} />
                  </div>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-100/70 hover:bg-slate-100 border-none rounded-xl py-3.5 pl-10 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all text-xs font-semibold shadow-sm"
                    placeholder="nomaden@hutan.com"
                    required
                  />
                </div>
              </div>

              {/* Field Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-extrabold text-slate-400 tracking-[0.12em] uppercase block">KATA SANDI</label>
                  {!isRegister && (
                    <a href="#lupa" className="text-[9px] font-bold text-slate-400 hover:text-blue-600 transition-colors tracking-wide">Lupa Sandi?</a>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock size={14} />
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-100/70 hover:bg-slate-100 border-none rounded-xl py-3.5 pl-10 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all text-xs font-semibold shadow-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {isRegister && (
                /* Field Konfirmasi Password */
                <div className="space-y-1.5">
                  <label className="text-[9px] font-extrabold text-slate-400 tracking-[0.12em] uppercase block">KONFIRMASI KATA SANDI</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <Lock size={14} />
                    </div>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-100/70 hover:bg-slate-100 border-none rounded-xl py-3.5 pl-10 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all text-xs font-semibold shadow-sm"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              )}

              {isRegister && (
                /* Field Pilihan Peran / Role */
                <div className="space-y-1.5 pt-1">
                  <label className="text-[9px] font-extrabold text-slate-400 tracking-[0.12em] uppercase block">PILIH PERAN (ROLE)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'Public', label: 'User Biasa', desc: 'Warga / Relawan' },
                      { value: 'Satgas', label: 'Satgas', desc: 'Tim Lapangan' },
                      { value: 'Instansi', label: 'Instansi', desc: 'RS / Damkar / BPBD' },
                      { value: 'Super Admin', label: 'Super Admin', desc: 'Dev Website' }
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setRole(item.value)}
                        className={`p-2 rounded-xl text-left border transition-all ${
                          role === item.value 
                            ? 'border-blue-600 bg-blue-50/50 text-blue-700 ring-2 ring-blue-600/10' 
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className="text-[9px] font-black tracking-wide uppercase leading-none mb-1">{item.label}</div>
                        <div className="text-[8px] text-slate-400 font-semibold leading-none">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                  {role !== 'Public' && (
                    <p className="text-[9px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
                      <span className="w-1 h-1 bg-amber-500 rounded-full inline-block animate-pulse"></span>
                      Memerlukan persetujuan Admin sebelum aktif.
                    </p>
                  )}
                </div>
              )}

              {isRegister && (
                /* Persyaratan & Kebijakan */
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="agreed"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors"
                    required
                  />
                  <label htmlFor="agreed" className="text-[9.5px] text-slate-500 font-semibold leading-tight">
                    Saya menyatakan bahwa data yang diisi benar dan siap mematuhi protokol tanggap darurat yang berlaku.
                  </label>
                </div>
              )}

              {/* Stacked Action Buttons */}
              <div className="pt-2 space-y-2.5">
                {isRegister ? (
                  <>
                    {/* Tombol Daftar Utama */}
                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 px-4 rounded-xl text-[10px] tracking-[0.15em] uppercase flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/20"
                    >
                      {isLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <span>DAFTAR</span>
                      )}
                    </motion.button>

                    {/* Tombol Masuk Sekunder */}
                    <motion.button 
                      type="button"
                      onClick={() => {
                        setIsRegister(false);
                        setError('');
                        setSuccessMessage('');
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-3.5 px-4 rounded-xl text-[10px] tracking-[0.15em] uppercase flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>MASUK</span>
                    </motion.button>
                  </>
                ) : (
                  <>
                    {/* Tombol Masuk Utama */}
                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 px-4 rounded-xl text-[10px] tracking-[0.15em] uppercase flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/20"
                    >
                      {isLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <span>MASUK</span>
                      )}
                    </motion.button>

                    {/* Tombol Daftar Sekunder */}
                    <motion.button 
                      type="button"
                      onClick={() => {
                        setIsRegister(true);
                        setError('');
                        setSuccessMessage('');
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-3.5 px-4 rounded-xl text-[10px] tracking-[0.15em] uppercase flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>DAFTAR</span>
                    </motion.button>
                  </>
                )}
              </div>
            </form>

            {/* Akses Uji Coba Cepat */}
            {!isRegister && (
              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs w-full gap-3">
                <span className="text-slate-400 font-extrabold tracking-[0.12em] uppercase text-[9px] w-full sm:w-auto text-center sm:text-left">Akses Cepat:</span>
                <div className="flex flex-wrap justify-center sm:justify-end gap-x-4 gap-y-2">
                  <button 
                    onClick={() => autofill('user_1')}
                    className="text-blue-600 hover:text-blue-700 font-extrabold transition-colors text-[10px] tracking-wide bg-blue-50/50 px-2.5 py-1.5 rounded-lg border border-blue-100"
                  >
                    User 1
                  </button>
                  <button 
                    onClick={() => autofill('user_2')}
                    className="text-blue-600 hover:text-blue-700 font-extrabold transition-colors text-[10px] tracking-wide bg-blue-50/50 px-2.5 py-1.5 rounded-lg border border-blue-100"
                  >
                    User 2
                  </button>
                  <button 
                    onClick={() => autofill('rs_bob_bazar')}
                    className="text-slate-600 hover:text-slate-900 font-extrabold transition-colors text-[10px] tracking-wide border px-2.5 py-1.5 rounded-lg"
                  >
                    Instansi (RS)
                  </button>
                  <button 
                    onClick={() => autofill('bpbd_lamsel')}
                    className="text-slate-600 hover:text-slate-900 font-extrabold transition-colors text-[10px] tracking-wide border px-2.5 py-1.5 rounded-lg"
                  >
                    Instansi (BPBD)
                  </button>
                  <button 
                    onClick={() => autofill('ambulance_1')}
                    className="text-slate-600 hover:text-slate-900 font-extrabold transition-colors text-[10px] tracking-wide border px-2.5 py-1.5 rounded-lg"
                  >
                    Satgas (Ambulance)
                  </button>
                  <button 
                    onClick={() => autofill('bpbd_1')}
                    className="text-slate-600 hover:text-slate-900 font-extrabold transition-colors text-[10px] tracking-wide border px-2.5 py-1.5 rounded-lg"
                  >
                    Satgas (BPBD)
                  </button>
                  <button 
                    onClick={() => autofill('admin')}
                    className="text-slate-600 hover:text-slate-900 font-extrabold transition-colors text-[10px] tracking-wide border px-2.5 py-1.5 rounded-lg"
                  >
                    Super Admin
                  </button>
                </div>
              </div>
            )}
            
          </div>

        </div>
      </div>

      {/* SISI KANAN: GAMBAR TAKTIS (Dengan gradasi pemudar lebar di sisi kiri) */}
      <div className="hidden md:block md:w-[58%] relative h-full">
        {/* Background Image (Disaster Search and Rescue Evacuation Team) */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: "url('/Picture_evakuasi.webp?v=2')" 
          }}
        />
        
        {/* Soft Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-slate-950/40 z-0"></div>

        {/* Vertical Gradient to Darken the Bottom Area for Text Contrast */}
        <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent z-10 pointer-events-none"></div>

        {/* Smooth, Wider and Softer Gradient Transition Overlay at the Left Boundary */}
        <div className="absolute inset-y-0 left-0 w-[45%] bg-gradient-to-r from-slate-50 via-slate-50/30 to-transparent z-10"></div>
        <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-slate-950/60 via-transparent to-transparent z-0"></div>

        {/* Info Teks di Atas Gambar - Diletakkan di Kanan agar tidak tertutup gradasi */}
        <div className="absolute bottom-16 right-16 z-20 text-white max-w-md text-right flex flex-col items-end">
          <div className="w-10 h-1 bg-blue-500 mb-4 rounded-full"></div>
          <h2 className="text-3xl font-black tracking-tight leading-none mb-3 drop-shadow-md">
            SELALU SIAP<br/>
            HADAPI BENCANA
          </h2>
          <p className="text-slate-200/90 text-xs font-semibold leading-relaxed drop-shadow-sm">
            Membantu koordinasi tanggap darurat, penataan jalur distribusi bantuan logistik secara cepat, tepat, dan terintegrasi di Lampung Selatan.
          </p>
        </div>
      </div>

    </div>
  );
}
