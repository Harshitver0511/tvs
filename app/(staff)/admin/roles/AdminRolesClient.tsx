"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "@/app/components/Navbar";
import { ShieldCheck, Search, Loader2, Mail, Send, History, Lock } from "lucide-react";
import { ASSIGNABLE_ROLES, ROLE_LABELS, type AssignableRole, type UserRole } from "@/app/lib/roles";

interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  district?: string;
  invited: boolean;
  emailConfirmed: boolean;
  lastSignInAt?: string;
  createdAt: string;
}

interface AuditEntry {
  id: string;
  action: string;
  entityId: string;
  afterState?: {
    targetEmail?: string;
    role?: string;
    before?: { role?: string; district?: string | null };
    after?: { role?: string; district?: string | null };
  };
  timestamp: string;
}

const ROLE_BADGE: Record<UserRole, string> = {
  admin: "bg-[#FF4757] text-white",
  credit_officer: "bg-[#2ED573] text-black",
  field_officer: "bg-[#B8A9FF] text-black",
  farmer: "bg-[#FFD152] text-black",
};

type Draft = { role: AssignableRole; district: string };

export default function AdminRolesClient({ adminId }: { adminId: string }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [history, setHistory] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  const [invite, setInvite] = useState({ email: "", name: "", role: "credit_officer" as "credit_officer" | "field_officer", district: "" });
  const [inviting, setInviting] = useState(false);

  const loadHistory = useCallback(
    () =>
      fetch("/api/audit", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return;
          setHistory(
            (data.logs || [])
              .filter((l: AuditEntry) => l.action === "USER_ROLE_CHANGED" || l.action === "STAFF_INVITED")
              .slice(0, 12)
          );
        })
        .catch(() => {}),
    []
  );

  useEffect(() => {
    fetch("/api/admin/users", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load users");
        setUsers(data.users);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load users"))
      .finally(() => setLoading(false));
    loadHistory();
  }, [loadHistory]);

  const draftFor = (u: ManagedUser): Draft =>
    drafts[u.id] || { role: u.role === "admin" ? "farmer" : u.role, district: u.district || "" };

  const isDirty = (u: ManagedUser) => {
    const d = drafts[u.id];
    if (!d) return false;
    return d.role !== u.role || (d.role === "field_officer" && d.district.trim() !== (u.district || ""));
  };

  const saveRole = async (u: ManagedUser) => {
    const d = draftFor(u);
    setSavingId(u.id);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: u.id,
          role: d.role,
          district: d.role === "field_officer" ? d.district.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");
      setUsers((prev) => prev.map((x) => (x.id === u.id ? data.user : x)));
      setDrafts(({ [u.id]: _, ...rest }) => rest);
      setNotice(`${u.email} is now ${ROLE_LABELS[data.user.role as UserRole]}${data.user.district ? ` (${data.user.district})` : ""}.`);
      loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setSavingId(null);
    }
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...invite,
          district: invite.role === "field_officer" ? invite.district.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invite failed");
      setNotice(`Invitation emailed to ${data.user.email}. They will appear as Invited until they set a password.`);
      setInvite({ email: "", name: "", role: "credit_officer", district: "" });
      setUsers((prev) => [data.user, ...prev.filter((x) => x.id !== data.user.id)]);
      loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invite failed");
    } finally {
      setInviting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (roleFilter === "all" || u.role === roleFilter) &&
        (!q || u.email.includes(q) || u.name.toLowerCase().includes(q) || (u.district || "").toLowerCase().includes(q))
    );
  }, [users, search, roleFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: users.length };
    users.forEach((u) => (c[u.role] = (c[u.role] || 0) + 1));
    return c;
  }, [users]);

  const emailById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u.email])), [users]);

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-[#FF4757]" />
          <div>
            <h1 className="text-3xl font-display font-black uppercase">Staff Access Control</h1>
            <p className="font-mono text-xs text-neutral-600">
              You are the single administrator. Invite staff by email and assign Field Officer / Credit Officer roles. Every change is audit-logged.
            </p>
          </div>
        </div>

        {(error || notice) && (
          <div
            role="status"
            className={`p-3 border-2 font-mono text-xs font-bold ${error ? "bg-red-100 border-red-500 text-red-700" : "bg-green-100 border-green-600 text-green-800"}`}
          >
            {error || notice}
          </div>
        )}

        {/* Invite */}
        <form onSubmit={sendInvite} className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_#000] space-y-3">
          <h2 className="text-lg font-display font-black uppercase flex items-center gap-2">
            <Mail className="w-5 h-5" /> Invite staff member
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 font-mono text-xs">
            <label className="lg:col-span-2">
              <span className="block font-bold uppercase mb-1">Work email</span>
              <input
                type="email"
                required
                value={invite.email}
                onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                placeholder="officer@tvscredit.com"
                className="w-full p-2 border-2 border-black text-sm"
              />
            </label>
            <label>
              <span className="block font-bold uppercase mb-1">Full name</span>
              <input
                required
                value={invite.name}
                onChange={(e) => setInvite({ ...invite, name: e.target.value })}
                className="w-full p-2 border-2 border-black text-sm"
              />
            </label>
            <label>
              <span className="block font-bold uppercase mb-1">Role</span>
              <select
                value={invite.role}
                onChange={(e) => setInvite({ ...invite, role: e.target.value as typeof invite.role })}
                className="w-full p-2 border-2 border-black bg-white font-bold text-xs uppercase"
              >
                <option value="credit_officer">Credit Officer</option>
                <option value="field_officer">Field Officer</option>
              </select>
            </label>
            <label>
              <span className="block font-bold uppercase mb-1">District {invite.role === "field_officer" ? "*" : ""}</span>
              <input
                value={invite.district}
                onChange={(e) => setInvite({ ...invite, district: e.target.value })}
                disabled={invite.role !== "field_officer"}
                required={invite.role === "field_officer"}
                placeholder={invite.role === "field_officer" ? "e.g. Yavatmal" : "All districts"}
                className="w-full p-2 border-2 border-black text-sm disabled:bg-neutral-100"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="pulse-btn px-4 py-2 text-xs bg-[#FFD152] text-black font-display font-black uppercase disabled:opacity-50"
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
            Send invite
          </button>
        </form>

        {/* Users */}
        <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_#000]">
          <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
            <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
              {(["all", "admin", "credit_officer", "field_officer", "farmer"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 border-2 border-black font-bold uppercase cursor-pointer ${roleFilter === r ? "bg-black text-white" : "bg-white"}`}
                >
                  {r === "all" ? "All" : ROLE_LABELS[r]} ({counts[r] || 0})
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="search"
                aria-label="Search users"
                placeholder="Search email, name, district…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 border-2 border-black font-mono text-sm w-64"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#2ED573]" />
            </div>
          ) : (
            <div className="overflow-x-auto border-2 border-black">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-100 border-b-2 border-black font-mono text-xs uppercase">
                    <th className="p-3">User</th>
                    <th className="p-3">Current role</th>
                    <th className="p-3">Assign role</th>
                    <th className="p-3">District</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filtered.map((u) => {
                    const locked = u.role === "admin" || u.id === adminId;
                    const d = draftFor(u);
                    return (
                      <tr key={u.id} className="border-b border-neutral-300 align-middle">
                        <td className="p-3">
                          <div className="font-bold">{u.name}</div>
                          <div className="font-mono text-xs text-neutral-600">{u.email}</div>
                          <div className="font-mono text-[10px] text-neutral-500 mt-0.5">
                            {u.invited ? "Invited · awaiting password" : u.lastSignInAt ? `Last sign-in ${new Date(u.lastSignInAt).toLocaleDateString("en-IN")}` : "Never signed in"}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase border border-black ${ROLE_BADGE[u.role]}`}>
                            {ROLE_LABELS[u.role]}
                          </span>
                          {u.district && <div className="font-mono text-[10px] mt-1">{u.district}</div>}
                        </td>
                        {locked ? (
                          <td className="p-3 font-mono text-xs text-neutral-500" colSpan={3}>
                            <Lock className="w-3.5 h-3.5 inline mr-1" /> Admin account — managed with scripts/create-admin.ts
                          </td>
                        ) : (
                          <>
                            <td className="p-3">
                              <select
                                aria-label={`Role for ${u.email}`}
                                value={d.role}
                                onChange={(e) => setDrafts({ ...drafts, [u.id]: { ...d, role: e.target.value as AssignableRole } })}
                                className="w-full p-2 border-2 border-black bg-white font-bold text-xs uppercase"
                              >
                                {ASSIGNABLE_ROLES.map((r) => (
                                  <option key={r} value={r}>
                                    {ROLE_LABELS[r]}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <input
                                aria-label={`District for ${u.email}`}
                                value={d.role === "field_officer" ? d.district : ""}
                                disabled={d.role !== "field_officer"}
                                onChange={(e) => setDrafts({ ...drafts, [u.id]: { ...d, district: e.target.value } })}
                                placeholder={d.role === "field_officer" ? "Required" : "—"}
                                className="w-full p-2 border-2 border-black text-xs disabled:bg-neutral-100"
                              />
                            </td>
                            <td className="p-3">
                              <button
                                type="button"
                                onClick={() => saveRole(u)}
                                disabled={!isDirty(u) || savingId === u.id || (d.role === "field_officer" && !d.district.trim())}
                                className="px-3 py-2 border-2 border-black bg-[#2ED573] font-bold text-xs uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {savingId === u.id ? "Saving…" : "Save"}
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-neutral-500 font-mono">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Role change history */}
        <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_#000]">
          <h2 className="text-lg font-display font-black uppercase flex items-center gap-2 mb-3">
            <History className="w-5 h-5" /> Recent access changes
          </h2>
          {history.length === 0 ? (
            <p className="font-mono text-xs text-neutral-500">No role changes recorded yet.</p>
          ) : (
            <ul className="font-mono text-xs divide-y divide-neutral-200">
              {history.map((h) => {
                const s = h.afterState || {};
                const who = s.targetEmail || emailById[h.entityId] || h.entityId;
                return (
                  <li key={h.id} className="py-2 flex flex-wrap justify-between gap-2">
                    <span>
                      {h.action === "STAFF_INVITED"
                        ? `Invited ${who} as ${ROLE_LABELS[s.role as UserRole] || s.role}`
                        : `${who}: ${ROLE_LABELS[s.before?.role as UserRole] || s.before?.role} → ${ROLE_LABELS[s.after?.role as UserRole] || s.after?.role}${s.after?.district ? ` (${s.after.district})` : ""}`}
                    </span>
                    <span className="text-neutral-500">{new Date(h.timestamp).toLocaleString("en-IN")}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
