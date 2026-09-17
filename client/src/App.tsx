import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { changePassword, fetchCurrentUser, login, logout, sessionExpiredEvent, TicketApiError, type AuthSession, type AuthUser } from "./api";
import CreateTicketForm from "./CreateTicketForm";
import MyTickets from "./MyTickets";
import TicketDetail from "./TicketDetail";
import StaffTicketQueue from "./StaffTicketQueue";
import StaffTicketDetail from "./StaffTicketDetail";
import UserManagement from "./UserManagement";

function BrandClockIcon() {
  return <svg className="brand-mark" viewBox="0 0 48 48" aria-hidden="true"><path d="M15 7.5A19 19 0 1 1 7.2 17" /><path d="M7 7v10h10" /><path d="M24 13v12h9" /></svg>;
}
function TicketsIcon() {
  return <svg className="header-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>;
}
function AddTicketIcon() {
  return <svg className="header-nav-icon header-add-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>;
}
function ProfileIcon() {
  return <svg className="profile-avatar" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" /><circle cx="14" cy="10" r="4" /><path d="M6.5 23c.7-4 3.5-6.2 7.5-6.2s6.8 2.2 7.5 6.2" /></svg>;
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;
    void fetchCurrentUser().then((current) => { if (active) setSession(current); }).catch(() => { if (active) setSession(null); }).finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const expireSession = () => setSession(null);
    window.addEventListener(sessionExpiredEvent, expireSession);
    return () => window.removeEventListener(sessionExpiredEvent, expireSession);
  }, []);

  if (checkingSession) return <PublicFrame><section className="auth-card"><p className="status-message" role="status">Checking your session...</p></section></PublicFrame>;
  if (!session) return <PublicFrame><LoginScreen onAuthenticated={setSession} /></PublicFrame>;
  if (session.user.mustChangePassword) return <PublicFrame><ChangePasswordScreen mandatory user={session.user} onChanged={setSession} onLogout={() => setSession(null)} /></PublicFrame>;
  return <AuthenticatedWorkspace session={session} onSessionChanged={setSession} onLoggedOut={() => setSession(null)} />;
}

function PublicFrame({ children }: { children: ReactNode }) {
  return <main className="app-page application-page auth-page"><header className="application-header public-header"><div className="application-brand"><BrandClockIcon /><div><p className="application-product">TokTickIT</p><p className="application-title">IT Service Desk</p></div></div></header>{children}</main>;
}

function LoginScreen({ onAuthenticated }: { onAuthenticated: (session: AuthSession) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Enter your password.";
    setFieldErrors(errors); setError("");
    if (Object.keys(errors).length) return;
    setSubmitting(true);
    try { onAuthenticated(await login(email, password)); setPassword(""); }
    catch (caught) {
      const apiError = caught instanceof TicketApiError ? caught : undefined;
      setFieldErrors(apiError?.fieldErrors ?? {});
      if (apiError?.code === "ACCOUNT_INACTIVE") setError("This account is deactivated. Contact your administrator.");
      else if (apiError?.status === 429) setError(`Too many attempts. Try again in ${apiError.retryAfter ?? "a few"} seconds.`);
      else if (apiError?.status === 401) setError("Unable to sign in. Check your credentials or contact your administrator.");
      else setError("Unable to sign in right now. Please try again.");
    } finally { setPassword(""); setSubmitting(false); }
  }

  return <section className="auth-card" aria-labelledby="login-heading"><p className="section-kicker">Secure access</p><h1 id="login-heading">Sign in to TokTickIT</h1><p>Use the account provided by your system administrator.</p>{error && <div className="error-panel" role="alert"><p>{error}</p></div>}<form className="auth-form" onSubmit={submit} noValidate><label htmlFor="login-email">Email address</label><input id="login-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "login-email-error" : undefined} disabled={submitting} />{fieldErrors.email && <p id="login-email-error" className="field-error">{fieldErrors.email}</p>}<label htmlFor="login-password">Password</label><input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "login-password-error" : undefined} disabled={submitting} />{fieldErrors.password && <p id="login-password-error" className="field-error">{fieldErrors.password}</p>}<button className="button button-primary" type="submit" disabled={submitting}>{submitting ? "Signing in..." : "Sign in"}</button></form></section>;
}

function ChangePasswordScreen({ user, mandatory = false, onChanged, onCancel, onLogout }: { user: AuthUser; mandatory?: boolean; onChanged: (session: AuthSession) => void; onCancel?: () => void; onLogout: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function signOut() { setError(""); try { await logout(); onLogout(); } catch { setError("Unable to sign out. Please retry."); } }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const errors: Record<string, string> = {};
    const length = Array.from(newPassword).length;
    if (!currentPassword) errors.currentPassword = "Enter your current password.";
    if (length < 12 || length > 128 || !newPassword.trim()) errors.newPassword = "Use 12 to 128 characters and not only whitespace.";
    if (confirmPassword !== newPassword) errors.confirmPassword = "The confirmation does not match the new password.";
    setFieldErrors(errors); setError("");
    if (Object.keys(errors).length) return;
    setSaving(true);
    try { onChanged(await changePassword(currentPassword, newPassword, confirmPassword)); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }
    catch (caught) { const apiError = caught instanceof TicketApiError ? caught : undefined; setFieldErrors(apiError?.fieldErrors ?? {}); setError(apiError?.status === 429 ? `Too many attempts. Try again in ${apiError.retryAfter ?? "a few"} seconds.` : apiError?.message ?? "Unable to change your password. Please retry."); }
    finally { setSaving(false); }
  }

  return <section className="auth-card" aria-labelledby="change-password-heading"><p className="section-kicker">{mandatory ? "Required security step" : "Account security"}</p><h1 id="change-password-heading">{mandatory ? "Change your initial password" : "Change password"}</h1><p>Signed in as <strong>{user.displayName}</strong> ({roleLabel(user.role)}).</p>{mandatory && <div className="info-panel" role="status">You must choose a private password before opening TokTickIT.</div>}<p className="field-hint">Use 12–128 characters. The password cannot contain only whitespace and must differ from your current password.</p>{error && <div className="error-panel" role="alert"><p>{error}</p></div>}<form className="auth-form" onSubmit={submit} noValidate><PasswordField id="current-password" label="Current password" value={currentPassword} onChange={setCurrentPassword} error={fieldErrors.currentPassword} disabled={saving} autoComplete="current-password" /><PasswordField id="new-password" label="New password" value={newPassword} onChange={setNewPassword} error={fieldErrors.newPassword} disabled={saving} autoComplete="new-password" /><PasswordField id="confirm-password" label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} error={fieldErrors.confirmPassword} disabled={saving} autoComplete="new-password" /><div className="auth-actions"><button className="button button-primary" type="submit" disabled={saving}>{saving ? "Saving password..." : "Save password"}</button>{onCancel && <button className="button button-secondary" type="button" onClick={onCancel} disabled={saving}>Cancel</button>}<button className="button button-secondary" type="button" onClick={() => void signOut()} disabled={saving}>Logout</button></div></form></section>;
}

function PasswordField({ id, label, value, onChange, error, disabled, autoComplete }: { id: string; label: string; value: string; onChange: (value: string) => void; error?: string; disabled: boolean; autoComplete: string }) {
  return <><label htmlFor={id}>{label}</label><input id={id} type="password" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />{error && <p id={`${id}-error`} className="field-error">{error}</p>}</>;
}

function AuthenticatedWorkspace({ session, onSessionChanged, onLoggedOut }: { session: AuthSession; onSessionChanged: (session: AuthSession) => void; onLoggedOut: () => void }) {
  const [view, setView] = useState<"create" | "tickets" | "detail" | "queue" | "staff-detail" | "users" | "password">(session.user.role === "ADMINISTRATOR" ? "users" : session.user.role === "IT_STAFF" ? "queue" : "tickets");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [logoutError, setLogoutError] = useState("");
  async function signOut() { setLogoutError(""); try { await logout(); onLoggedOut(); } catch { setLogoutError("Unable to sign out. Please retry."); } }
  if (view === "password") return <PublicFrame><ChangePasswordScreen user={session.user} onChanged={onSessionChanged} onCancel={() => setView(session.user.role === "ADMINISTRATOR" ? "users" : session.user.role === "IT_STAFF" ? "queue" : "tickets")} onLogout={onLoggedOut} /></PublicFrame>;

  const isRequester = session.user.role === "REQUESTER";
  const canUseQueue = session.user.role === "IT_STAFF" || session.user.role === "ADMINISTRATOR";
  return <main className="app-page application-page"><header className="application-header"><div className="application-brand"><BrandClockIcon /><div><p className="application-product">TokTickIT</p><p className="application-title">IT Service Desk</p></div></div><nav className="application-navigation" aria-label={`${roleLabel(session.user.role)} workspace`}>{isRequester && <><button className={`button header-nav-button ${view === "tickets" || view === "detail" ? "header-nav-button-active" : ""}`} onClick={() => setView("tickets")}><TicketsIcon />My Tickets</button><button className={`button header-nav-button ${view === "create" ? "header-nav-button-active" : ""}`} onClick={() => setView("create")}><AddTicketIcon />Create Ticket</button></>}{canUseQueue && <button className={`button header-nav-button ${view === "queue" || view === "staff-detail" ? "header-nav-button-active" : ""}`} type="button" onClick={() => setView("queue")}><TicketsIcon />Ticket Queue</button>}{session.user.role === "ADMINISTRATOR" && <button className={`button header-nav-button ${view === "users" ? "header-nav-button-active" : ""}`} type="button" onClick={() => setView("users")}><ProfileIcon />Users</button>}</nav><div className="authenticated-profile"><ProfileIcon /><span><strong>{session.user.displayName}</strong><small>{roleLabel(session.user.role)}</small></span><button className="button header-account-action" type="button" onClick={() => setView("password")}>Change Password</button><button className="button header-account-action" type="button" onClick={() => void signOut()}>Logout</button></div></header>{logoutError && <div className="error-panel global-alert" role="alert"><p>{logoutError}</p></div>}{isRequester && view === "create" && <CreateTicketForm requester={session.user} onViewMyTickets={() => setView("tickets")} />}{isRequester && view === "tickets" && <MyTickets requester={session.user} onCreateTicket={() => setView("create")} onViewTicket={(id) => { setSelectedTicketId(id); setView("detail"); }} />}{isRequester && view === "detail" && selectedTicketId !== null && <TicketDetail requester={session.user} ticketId={selectedTicketId} onBack={() => setView("tickets")} />}{canUseQueue && view === "queue" && <StaffTicketQueue onViewTicket={(id) => { setSelectedTicketId(id); setView("staff-detail"); }} />}{canUseQueue && view === "staff-detail" && selectedTicketId !== null && <StaffTicketDetail user={session.user} ticketId={selectedTicketId} onBack={() => setView("queue")} />}{session.user.role === "ADMINISTRATOR" && view === "users" && <UserManagement currentUser={session.user} onSessionInvalidated={onLoggedOut} />}</main>;
}

function roleLabel(role: AuthUser["role"]): string {
  if (role === "IT_STAFF") return "IT Staff";
  if (role === "ADMINISTRATOR") return "Administrator";
  return "Requester";
}
