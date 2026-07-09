"use client";

// =============================================================
// User Access Page — (admin)/cms/users/page.tsx
// CRUD Pengguna Kasir & Manager (Premium Theme)
// =============================================================

import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  username: string;
  role: string;
  createdAt: string;
}

export default function UserAccessPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CASHIER" | "MANAGER">("CASHIER");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Fetch all cashiers
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Handle Add User
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name || !username || !password) {
      setErrorMsg("Semua field wajib diisi.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password minimal 6 karakter.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, password, role }), // Sertakan Role
      });

      const data = await res.json();

      if (res.ok) {
        setUsers((prev) => [data.user, ...prev]);
        setSuccessMsg(`Akun "${name}" berhasil ditambahkan!`);
        setName("");
        setUsername("");
        setPassword("");
        setRole("CASHIER"); // Reset ke default
        
        // Hilangkan pesan sukses setelah 3 detik
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(data.message || "Gagal menambahkan akun");
      }
    } catch (err) {
      setErrorMsg("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Delete User
  async function handleDelete(id: string, userName: string) {
    if (!confirm(`Are you sure you want to revoke access for "${userName}"?`)) return;

    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else {
        const data = await res.json();
        alert(data.message || "Gagal menghapus akun");
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan");
    }
  }

  return (
    <div className="flex-1 p-8 lg:p-10 overflow-y-auto bg-[#fafbfc] text-[#1a1f36] font-sans selection:bg-[#6C4E31] selection:text-white">
      
      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-[28px] font-black tracking-tight text-[#1a1f36]">
            User Access
          </h1>
          <p className="text-[15px] font-medium text-gray-500 mt-1">
            Manage system access for Cashiers and Managers.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-white px-5 py-2.5 border border-gray-200/80 rounded-2xl text-[13px] font-bold text-gray-600 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" /></svg>
            Today, {todayStr}
          </div>
          <button className="w-11 h-11 bg-white border border-gray-200/80 rounded-2xl flex items-center justify-center text-gray-500 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
          </button>
        </div>
      </div>

      {/* ── CONTENT GRID ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Panel: Add New User */}
        <div className="bg-white border border-gray-100 p-8 rounded-[24px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-[12px] bg-[#1a1f36]/5 flex items-center justify-center text-[#1a1f36]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M11 5a3 3 0 11-6 0 3 3 0 016 0zM2.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 018 18a9.953 9.953 0 01-5.385-1.572zM16.25 5.75a.75.75 0 00-1.5 0v2h-2a.75.75 0 000 1.5h2v2a.75.75 0 001.5 0v-2h2a.75.75 0 000-1.5h-2v-2z" /></svg>
            </div>
            <h3 className="text-[18px] font-black text-[#1a1f36]">Create Account</h3>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50/80 backdrop-blur-sm border border-rose-100 text-rose-600 text-[13px] font-bold rounded-2xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mt-0.5 shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50/80 backdrop-blur-sm border border-emerald-100 text-emerald-700 text-[13px] font-bold rounded-2xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mt-0.5 shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account Role */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1 mb-2">
                Account Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`relative flex flex-col items-center p-3 rounded-2xl border-2 cursor-pointer transition-all ${role === 'CASHIER' ? 'border-[#6C4E31] bg-[#6C4E31]/5 ring-2 ring-[#6C4E31]/10' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="role" value="CASHIER" checked={role === 'CASHIER'} onChange={() => setRole('CASHIER')} className="hidden" />
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-6 h-6 mb-1 ${role === 'CASHIER' ? 'text-[#6C4E31]' : 'text-gray-400'}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                  </svg>
                  <span className={`text-[12px] font-bold ${role === 'CASHIER' ? 'text-[#6C4E31]' : 'text-gray-500'}`}>Cashier</span>
                </label>
                <label className={`relative flex flex-col items-center p-3 rounded-2xl border-2 cursor-pointer transition-all ${role === 'MANAGER' ? 'border-[#1a1f36] bg-[#1a1f36]/5 ring-2 ring-[#1a1f36]/10' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="role" value="MANAGER" checked={role === 'MANAGER'} onChange={() => setRole('MANAGER')} className="hidden" />
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-6 h-6 mb-1 ${role === 'MANAGER' ? 'text-[#1a1f36]' : 'text-gray-400'}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                  </svg>
                  <span className={`text-[12px] font-bold ${role === 'MANAGER' ? 'text-[#1a1f36]' : 'text-gray-500'}`}>Manager</span>
                </label>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Budi Santoso"
                className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl px-4 py-3.5 text-[14px] focus:outline-none focus:border-[#6C4E31]/40 focus:bg-white focus:ring-4 focus:ring-[#6C4E31]/10 transition-all duration-300 placeholder-gray-300"
                required
              />
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-gray-400 font-bold select-none">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="budi_account"
                  className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl pl-9 pr-4 py-3.5 text-[14px] focus:outline-none focus:border-[#6C4E31]/40 focus:bg-white focus:ring-4 focus:ring-[#6C4E31]/10 transition-all duration-300 placeholder-gray-300"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">
                Access Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl px-4 py-3.5 text-[14px] focus:outline-none focus:border-[#6C4E31]/40 focus:bg-white focus:ring-4 focus:ring-[#6C4E31]/10 transition-all duration-300 placeholder-gray-300"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full text-white py-4 mt-2 rounded-2xl text-[14px] font-extrabold shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex justify-center items-center gap-2 ${role === 'MANAGER' ? 'bg-[#1a1f36] hover:bg-[#2a314d]' : 'bg-[#6C4E31] hover:bg-[#583f27]'}`}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Registering...
                </>
              ) : (
                `Add ${role === 'MANAGER' ? 'Manager' : 'Cashier'}`
              )}
            </button>
          </form>
        </div>

        {/* List Panel: User Accounts */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[24px] p-8 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)]">
          <h3 className="text-[18px] font-black text-[#1a1f36] mb-6">Registered Accounts</h3>
          
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-4">
              <svg className="animate-spin h-8 w-8 text-[#6C4E31]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span className="font-bold text-sm">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-3 border-2 border-dashed border-gray-100 rounded-3xl">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              <p className="text-sm font-medium">No accounts found. Create one using the form.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-gray-50/30">
                    <th className="py-4 px-4">Name</th>
                    <th className="py-4 px-4">Username</th>
                    <th className="py-4 px-4">Role</th>
                    <th className="py-4 px-4">Created Date</th>
                    <th className="py-4 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/80">
                  {users.map((u) => {
                    const isManager = u.role === "MANAGER";
                    const isSuperAdmin = u.role === "SUPER_ADMIN";
                    
                    return (
                    <tr key={u.id} className="group hover:bg-gray-50/50 transition-colors duration-200">
                      <td className="py-4 px-4 align-middle">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center font-black text-[13px] shadow-sm border ${isSuperAdmin ? 'bg-gradient-to-tr from-amber-100 to-amber-200 text-amber-900 border-amber-300/50' : isManager ? 'bg-gradient-to-tr from-indigo-100 to-indigo-200 text-indigo-900 border-indigo-300/50' : 'bg-gradient-to-tr from-gray-100 to-gray-200 text-[#1a1f36] border-gray-200/50'}`}>
                            {u.name.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase()}
                          </div>
                          <span className="font-extrabold text-[14.5px] text-[#1a1f36]">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 align-middle">
                        <span className="text-[13px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
                          @{u.username}
                        </span>
                      </td>
                      <td className="py-4 px-4 align-middle">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] tracking-wider uppercase ${isSuperAdmin ? 'bg-amber-100 text-amber-700' : isManager ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-[#1a1f36]'}`}>
                          {isSuperAdmin ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
                          ) : isManager ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" /></svg>
                          )}
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4 align-middle font-medium text-[13px] text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-4 px-4 align-middle text-center">
                        {!isSuperAdmin && (
                          <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                              onClick={() => handleDelete(u.id, u.name)}
                              className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all duration-200"
                              title="Revoke Access"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}