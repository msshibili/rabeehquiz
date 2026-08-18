"use client";

import { useEffect, useState } from "react";
import { Users, Download, Search, CheckCircle2, Clock, XCircle, RefreshCw, Trash2, Edit, X, Save, Phone, User, Mail } from "lucide-react";

export default function AdminParticipantsPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Edit Modal State
  const [editingReg, setEditingReg] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    registrationId: "",
    name: "",
    phone: "",
    email: "",
    place: "",
    institution: "",
    course: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/participants?status=${statusFilter}`);
      const data = await res.json();
      setRegistrations(data.registrations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [statusFilter]);

  const handleExportCsv = () => {
    window.open(`/api/admin/participants?export=true&status=${statusFilter}`, "_blank");
  };

  const handleOpenEdit = (reg: any) => {
    setEditingReg(reg);
    setEditFormData({
      registrationId: reg.registrationId,
      name: reg.user?.name || "",
      phone: reg.user?.phone || "",
      email: reg.user?.email || "",
      place: reg.place || "",
      institution: reg.institution || "",
      course: reg.course || "",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);

    try {
      const res = await fetch("/api/admin/participants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update participant");

      setEditingReg(null);
      fetchParticipants();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteUser = async (reg: any) => {
    const userName = reg.user?.name || reg.registrationId;
    if (!confirm(`Are you sure you want to permanently delete user "${userName}" (${reg.registrationId})? This will delete all payments, results, and user data.`)) {
      return;
    }

    setDeletingId(reg.registrationId);
    try {
      const res = await fetch(`/api/admin/participants?registrationId=${reg.registrationId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");

      alert(`User "${userName}" deleted successfully.`);
      fetchParticipants();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-xs">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" /> Participant Directory ({registrations.length})
          </h1>
          <p className="text-xs text-slate-400">
            View candidates, edit phone numbers & details, export reports, and manage accounts
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="p-4 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          {["ALL", "APPROVED", "PENDING_VERIFICATION", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                statusFilter === st
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <button
          onClick={fetchParticipants}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* PARTICIPANTS TABLE */}
      <div className="p-6 rounded-3xl glass-card border border-slate-800 space-y-4">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : registrations.length === 0 ? (
          <p className="text-xs text-slate-500 p-8 text-center">No participants found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Registration ID</th>
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Institution / Course</th>
                  <th className="py-3 px-4">City / Place</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Best Score</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {registrations.map((r) => {
                  const p = r.payments?.[0];
                  const att = r.attempts?.[0];
                  const isDeleting = deletingId === r.registrationId;

                  return (
                    <tr key={r.id} className="hover:bg-slate-900/40">
                      <td className="py-3.5 px-4 font-mono text-indigo-400">{r.registrationId}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{r.user?.name}</div>
                        <div className="text-[11px] text-slate-400">{r.user?.email || "No Email"}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-indigo-300 font-bold">
                        {r.user?.phone}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div>{r.institution || "N/A"}</div>
                        <div className="text-[11px] text-slate-400">{r.course || "N/A"}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{r.place || "N/A"}</td>
                      <td className="py-3.5 px-4">
                        {r.status === "APPROVED" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                            APPROVED
                          </span>
                        ) : r.status === "REJECTED" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold">
                            REJECTED
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-indigo-300">
                        {att ? `${att.score} pts (${att.percentage}%)` : "No Attempt"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold text-[11px] flex items-center gap-1 transition-all"
                            title="Edit Phone & Info"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDeleteUser(r)}
                            disabled={isDeleting}
                            className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-[11px] flex items-center gap-1 transition-all"
                            title="Delete User"
                          >
                            {isDeleting ? (
                              <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT PARTICIPANT MODAL */}
      {editingReg && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full glass-panel p-8 rounded-3xl border border-slate-800 space-y-6 relative text-xs">
            <button
              onClick={() => setEditingReg(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-400" /> Edit Participant Details
              </h3>
              <p className="text-slate-400 mt-0.5">Registration ID: <code className="text-indigo-400 font-bold">{editingReg.registrationId}</code></p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" /> Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono font-bold text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    City / Place
                  </label>
                  <input
                    type="text"
                    value={editFormData.place}
                    onChange={(e) => setEditFormData({ ...editFormData, place: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Institution
                  </label>
                  <input
                    type="text"
                    value={editFormData.institution}
                    onChange={(e) => setEditFormData({ ...editFormData, institution: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingReg(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-900 text-slate-400 font-semibold border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg flex items-center justify-center gap-2"
                >
                  {savingEdit ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
