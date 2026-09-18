import { useEffect, useState, type FormEvent } from "react";
import {
  createAdminUser,
  fetchAdminUsers,
  resetAdminUserInitialPassword,
  TicketApiError,
  updateAdminUser,
  type AdminUser,
  type AdminUserInput,
  type UserRole,
} from "./api";

const roles: Array<{ value: UserRole; label: string }> = [
  { value: "REQUESTER", label: "Requester" },
  { value: "IT_STAFF", label: "IT Staff" },
  { value: "ADMINISTRATOR", label: "Administrator" },
];

type FormState = AdminUserInput & { initialPassword: string };
const blankForm = (): FormState => ({ displayName: "", email: "", role: "REQUESTER", isActive: true, initialPassword: "" });

export default function UserManagement({ currentUser, onSessionInvalidated }: { currentUser: AdminUser | { id: number; displayName: string }; onSessionInvalidated: () => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try { setUsers((await fetchAdminUsers({ search, ...(role ? { role } : {}) })).items); }
    catch (caught) { setError(caught instanceof TicketApiError ? caught.message : "Unable to load users. Please retry."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  function clearFilters() { setSearch(""); setRole(""); setNotice(""); setError(""); void refresh("", ""); }
  async function refresh(nextSearch = search, nextRole = role) {
    setLoading(true); setError("");
    try { setUsers((await fetchAdminUsers({ search: nextSearch, ...(nextRole ? { role: nextRole } : {}) })).items); }
    catch (caught) { setError(caught instanceof TicketApiError ? caught.message : "Unable to load users. Please retry."); }
    finally { setLoading(false); }
  }

  function openCreate() { setEditing(null); setForm(blankForm()); setFormOpen(true); setFieldErrors({}); setError(""); setNotice(""); }
  function openEdit(user: AdminUser) {
    setEditing(user);
    setForm({ displayName: user.displayName, email: user.email, role: user.role, isActive: user.isActive, initialPassword: "" });
    setFormOpen(true); setFieldErrors({}); setError(""); setNotice("");
  }
  function closeForm() { setEditing(null); setForm(blankForm()); setFormOpen(false); setFieldErrors({}); }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.displayName.trim() || form.displayName.trim().length > 100) errors.displayName = "Enter a name from 1 to 100 characters.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Enter a valid email address.";
    if (!editing && (Array.from(form.initialPassword).length < 12 || Array.from(form.initialPassword).length > 128 || !form.initialPassword.trim())) errors.initialPassword = "Use 12 to 128 characters and not only whitespace.";
    setFieldErrors(errors); setError(""); setNotice("");
    if (Object.keys(errors).length) return;
    setSaving(true);
    try {
      if (editing) await updateAdminUser(editing.id, { displayName: form.displayName, email: form.email, role: form.role, isActive: form.isActive, version: editing.version });
      else await createAdminUser(form);
      if (editing?.id === currentUser.id && editing.role !== form.role) { onSessionInvalidated(); return; }
      setNotice(editing ? "User account updated." : "User account created. The user must change the initial password at next login.");
      closeForm(); await refresh();
    } catch (caught) { showFormError(caught, setFieldErrors, setError); }
    finally { setSaving(false); }
  }

  async function resetPassword() {
    if (!editing) return;
    const passwordError = Array.from(form.initialPassword).length < 12 || Array.from(form.initialPassword).length > 128 || !form.initialPassword.trim()
      ? "Use 12 to 128 characters and not only whitespace." : undefined;
    if (passwordError) { setFieldErrors({ initialPassword: passwordError }); return; }
    setResetting(true); setError(""); setNotice("");
    try {
      await resetAdminUserInitialPassword(editing.id, form.initialPassword, editing.version);
      if (editing.id === currentUser.id) { onSessionInvalidated(); return; }
      setNotice("Initial password reset. Existing sessions were revoked and the user must change this password at next login.");
      closeForm(); await refresh();
    } catch (caught) { showFormError(caught, setFieldErrors, setError); }
    finally { setResetting(false); }
  }

  return <section className="workspace-card ticket-list-card" aria-labelledby="users-heading">
    <div className="ticket-card-heading"><div><p className="section-kicker">Administrator workspace</p><h1 id="users-heading">User Management</h1><p>Search, create and maintain accounts. Passwords are never displayed after saving.</p></div><button className="button button-primary" type="button" onClick={openCreate}>Create User</button></div>
    {notice && <div className="success-panel" role="status"><p>{notice}</p></div>}
    {error && <div className="error-panel" role="alert"><p>{error}</p><button className="button button-secondary" type="button" onClick={() => void refresh()}>Retry</button></div>}
    <form className="ticket-toolbar" onSubmit={(event) => { event.preventDefault(); void refresh(); }} aria-label="User filters">
      <div className="ticket-filter search-filter"><label htmlFor="user-search">Search name or email</label><input id="user-search" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={120} /></div>
      <div className="ticket-filter"><label htmlFor="user-role">Role</label><select id="user-role" value={role} onChange={(event) => setRole(event.target.value as UserRole | "")}><option value="">All roles</option>{roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      <div className="ticket-toolbar-actions"><button className="button button-primary" type="submit" disabled={loading}>Search</button><button className="button button-secondary" type="button" onClick={clearFilters} disabled={loading}>Clear filters</button></div>
    </form>
    {formOpen && <form className="admin-user-form" onSubmit={submit} noValidate aria-busy={saving || resetting}>
      <h2>{editing ? `Edit ${editing.displayName}` : "Create User"}</h2>
      <div className="form-grid"><FormField label="Display name" id="user-name" value={form.displayName} error={fieldErrors.displayName} onChange={(value) => setForm({ ...form, displayName: value })} disabled={saving || resetting} /><FormField label="Email address" id="user-email" type="email" value={form.email} error={fieldErrors.email} onChange={(value) => setForm({ ...form, email: value })} disabled={saving || resetting} /><div className="form-field"><label htmlFor="user-role-edit">Role</label><select id="user-role-edit" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })} disabled={saving || resetting}>{roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>{fieldErrors.role && <p className="field-error">{fieldErrors.role}</p>}</div><div className="form-field"><label><input type="checkbox" checked={form.isActive} disabled={saving || resetting || editing?.id === currentUser.id} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Active account</label>{editing?.id === currentUser.id && <p className="field-hint">You cannot deactivate your own account.</p>}</div></div>
      {!editing && <PasswordInput value={form.initialPassword} error={fieldErrors.initialPassword} disabled={saving} onChange={(value) => setForm({ ...form, initialPassword: value })} />}
      {editing && <div className="reset-password-panel"><h3>Set new initial password</h3><p>Use this only when the user needs a new password. It revokes their existing sessions and requires a password change at next login.</p><PasswordInput value={form.initialPassword} error={fieldErrors.initialPassword} disabled={saving || resetting} onChange={(value) => setForm({ ...form, initialPassword: value })} /><button className="button button-secondary" type="button" disabled={saving || resetting} onClick={() => void resetPassword()}>{resetting ? "Resetting password..." : "Set new initial password"}</button></div>}
      {fieldErrors.form && <p className="field-error">{fieldErrors.form}</p>}<div className="form-actions"><button className="button button-primary" type="submit" disabled={saving || resetting}>{saving ? "Saving user..." : editing ? "Save changes" : "Create user"}</button><button className="button button-secondary" type="button" onClick={closeForm} disabled={saving || resetting}>Cancel</button></div>
    </form>}
    {loading ? <p className="status-message" role="status">Loading users...</p> : users.length === 0 ? <div className="empty-state"><h2>{search || role ? "No matching users" : "No users available"}</h2><p>{search || role ? "Try clearing or changing the filters." : "Create the first account to begin."}</p></div> : <div className="ticket-table-wrapper"><table className="ticket-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td data-label="Name"><strong>{user.displayName}</strong></td><td data-label="Email">{user.email}</td><td data-label="Role">{roleLabel(user.role)}</td><td data-label="Status"><span className={user.isActive ? "status-badge" : "removed-badge"}>{user.isActive ? "Active" : "Inactive"}</span></td><td data-label="Actions"><button className="button button-secondary ticket-detail-button" type="button" onClick={() => openEdit(user)}>Edit</button></td></tr>)}</tbody></table></div>}
  </section>;
}

function FormField({ label, id, value, error, disabled, onChange, type = "text" }: { label: string; id: string; value: string; error?: string; disabled: boolean; onChange: (value: string) => void; type?: string }) { return <div className="form-field"><label htmlFor={id}>{label}</label><input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />{error && <p className="field-error" id={`${id}-error`}>{error}</p>}</div>; }
function PasswordInput({ value, error, disabled, onChange }: { value: string; error?: string; disabled: boolean; onChange: (value: string) => void }) { return <FormField label="Initial password" id="user-initial-password" value={value} error={error} disabled={disabled} onChange={onChange} type="password" />; }
function roleLabel(role: UserRole) { return roles.find((item) => item.value === role)?.label ?? role; }
function showFormError(caught: unknown, setFieldErrors: (value: Record<string, string>) => void, setError: (value: string) => void) { const apiError = caught instanceof TicketApiError ? caught : undefined; setFieldErrors(apiError?.fieldErrors ?? {}); setError(apiError?.message ?? "Unable to save the user. Please retry."); }
