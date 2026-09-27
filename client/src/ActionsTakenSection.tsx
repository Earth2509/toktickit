import { useEffect, useState } from "react";
import {
  createActionTaken,
  fetchActionsTaken,
  fetchStaffAssignees,
  TicketApiError,
  updateActionTaken,
  type ActionTaken,
  type ActionTakenCreateInput,
  type ActionTakenPage,
  type ActionTakenPatchInput,
  type AuthUser,
} from "./api";

type ActionForm = {
  actionAt: string;
  description: string;
  assignedToId: string;
  followUpRequired: boolean;
  followUpNote: string;
  attachmentNotes: string;
  result: string;
  status: "OPEN" | "COMPLETED" | "CANCELLED";
};

type Props = {
  ticketId: number;
  user: AuthUser;
  readOnly?: boolean;
  canWrite?: boolean;
  onChanged?: () => void;
};

const displayDate = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });
const actionsPageSize = 10;

function emptyForm(userId: number): ActionForm {
  return {
    actionAt: toInputDate(new Date().toISOString()),
    description: "",
    assignedToId: String(userId),
    followUpRequired: false,
    followUpNote: "",
    attachmentNotes: "",
    result: "",
    status: "OPEN",
  };
}

function actionForm(action: ActionTaken): ActionForm {
  return {
    actionAt: toInputDate(action.actionAt),
    description: action.description,
    assignedToId: String(action.assignedTo.id),
    followUpRequired: action.followUpRequired,
    followUpNote: action.followUpNote ?? "",
    attachmentNotes: action.attachmentNotes ?? "",
    result: action.result ?? "",
    status: action.status,
  };
}

export default function ActionsTakenSection({ ticketId, user, readOnly = false, canWrite = true, onChanged }: Props) {
  const [items, setItems] = useState<ActionTaken[]>([]);
  const [loadedPage, setLoadedPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [assignees, setAssignees] = useState<Array<Pick<AuthUser, "id" | "displayName" | "role">>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<ActionForm>(() => emptyForm(user.id));
  const [editing, setEditing] = useState<ActionTaken | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => newIdempotencyKey());

  const load = (nextPage = 1, append = false) => {
    let active = true;
    setLoading(true);
    setError("");
    const tasks: [Promise<ActionTakenPage>, Promise<Array<Pick<AuthUser, "id" | "displayName" | "role">>>?] = readOnly
      ? [fetchActionsTaken(ticketId, { page: nextPage, pageSize: actionsPageSize })]
      : [fetchActionsTaken(ticketId, { page: nextPage, pageSize: actionsPageSize }), fetchStaffAssignees()];
    void Promise.all(tasks).then(([page, users]) => {
      if (!active) return;
      setItems(current => append ? [...current, ...page.items].sort(sortActions) : page.items);
      setLoadedPage(page.page);
      setTotalItems(page.totalItems);
      setTotalPages(page.totalPages);
      setAssignees(users ?? []);
    }).catch((caught) => {
      if (active) setError(caught instanceof TicketApiError ? caught.message : "Unable to load Actions Taken. Please retry.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  };

  useEffect(() => load(), [ticketId, readOnly]);

  function startCreate() {
    setEditing(null);
    setForm(emptyForm(user.id));
    setIdempotencyKey(newIdempotencyKey());
    setFormError("");
    setShowForm(true);
  }

  function startEdit(action: ActionTaken, status: ActionForm["status"] = "OPEN") {
    setEditing(action);
    setForm({ ...actionForm(action), status });
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setEditing(null);
    setFormError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const isTransition = editing !== null && form.status !== "OPEN";
    const parsedAssignee = Number(form.assignedToId);
    if (!isTransition && (!Number.isSafeInteger(parsedAssignee) || parsedAssignee <= 0)) {
      setFormError("Choose an active IT Staff member or Administrator.");
      return;
    }
    if (!isTransition && !form.description.trim()) {
      setFormError("Enter an Action description.");
      return;
    }
    if (!isTransition && form.followUpRequired && !form.followUpNote.trim()) {
      setFormError("Enter a follow-up note when follow-up is required.");
      return;
    }
    if (form.status === "COMPLETED" && !form.result.trim()) {
      setFormError("Enter a result before completing this Action.");
      return;
    }
    const actionAt = new Date(form.actionAt);
    if (!isTransition && Number.isNaN(actionAt.getTime())) {
      setFormError("Enter a valid action date and time.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (!editing) {
        const input: ActionTakenCreateInput = {
          actionAt: actionAt.toISOString(),
          description: form.description.trim(),
          assignedToId: parsedAssignee,
          followUpRequired: form.followUpRequired,
          followUpNote: form.followUpRequired ? form.followUpNote.trim() : null,
          attachmentNotes: form.attachmentNotes.trim() || null,
        };
        const created = await createActionTaken(ticketId, input, idempotencyKey);
        setItems(current => [created, ...current].sort(sortActions));
      } else {
        const input: ActionTakenPatchInput = isTransition
          ? {
              version: editing.version,
              status: form.status as Exclude<ActionForm["status"], "OPEN">,
              ...(form.status === "COMPLETED" ? { result: form.result.trim() } : {}),
            }
          : {
              version: editing.version,
              description: form.description.trim(),
              assignedToId: parsedAssignee,
              followUpRequired: form.followUpRequired,
              followUpNote: form.followUpRequired ? form.followUpNote.trim() : null,
              attachmentNotes: form.attachmentNotes.trim() || null,
            };
        const updated = await updateActionTaken(ticketId, editing.id, input);
        setItems(current => current.map(item => item.id === updated.id ? updated : item).sort(sortActions));
      }
      setShowForm(false);
      setEditing(null);
      setFormError("");
      onChanged?.();
    } catch (caught) {
      const api = caught instanceof TicketApiError ? caught : undefined;
      setFormError(api?.status === 409 ? "This Action changed or is no longer editable. Reload the Ticket and try again." : api?.message ?? "Unable to save the Action Taken. Please retry.");
    } finally {
      setSaving(false);
    }
  }

  const canEdit = (action: ActionTaken) => user.role === "ADMINISTRATOR" || action.performedBy.id === user.id;
  const canTransition = (action: ActionTaken) => canEdit(action) || action.assignedTo.id === user.id;
  const isTransition = editing !== null && form.status !== "OPEN";
  const disableOpenFields = saving || (editing !== null && (!canEdit(editing) || isTransition));

  return <section className="actions-taken-section" aria-labelledby="actions-taken-heading">
    <div className="section-heading-row">
      <div><h2 id="actions-taken-heading">Actions Taken</h2><p>Recorded work associated with this Ticket.</p></div>
      {!readOnly && canWrite && !showForm && <button className="button button-primary" type="button" onClick={startCreate}>Add action</button>}
    </div>
    {readOnly && <p className="field-hint">Actions Taken are visible for transparency. Only IT Staff and Administrators can make changes.</p>}
    {error && <div className="error-panel" role="alert"><p>{error}</p><button className="button button-secondary" type="button" onClick={() => load()}>Retry</button></div>}
    {showForm && !readOnly && canWrite && <form className="action-form" onSubmit={submit} noValidate>
      <h3>{editing ? form.status === "COMPLETED" ? "Complete action" : form.status === "CANCELLED" ? "Cancel action" : "Edit action" : "Add action"}</h3>
      <div className="form-grid">
        <div className="form-field"><label htmlFor="action-at">Action date and time <span className="required-marker">*</span></label><input id="action-at" type="datetime-local" value={form.actionAt} onChange={event => setForm(current => ({ ...current, actionAt: event.target.value }))} disabled={saving || editing !== null} /></div>
        <div className="form-field"><label htmlFor="action-assignee">Assignee <span className="required-marker">*</span></label><select id="action-assignee" value={form.assignedToId} onChange={event => setForm(current => ({ ...current, assignedToId: event.target.value }))} disabled={disableOpenFields}>{assignees.map(person => <option key={person.id} value={person.id}>{person.displayName} ({person.role.replaceAll("_", " ")})</option>)}</select></div>
        <div className="form-field full-width"><label htmlFor="action-description">Action description <span className="required-marker">*</span></label><textarea id="action-description" maxLength={2000} value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} disabled={disableOpenFields} /></div>
        <div className="form-field full-width"><label className="checkbox-label" htmlFor="action-follow-up"><input id="action-follow-up" type="checkbox" checked={form.followUpRequired} onChange={event => setForm(current => ({ ...current, followUpRequired: event.target.checked }))} disabled={disableOpenFields} /> Follow-up required</label></div>
        {form.followUpRequired && <div className="form-field full-width"><label htmlFor="action-follow-up-note">Follow-up note <span className="required-marker">*</span></label><textarea id="action-follow-up-note" maxLength={1000} value={form.followUpNote} onChange={event => setForm(current => ({ ...current, followUpNote: event.target.value }))} disabled={disableOpenFields} /></div>}
        <div className="form-field full-width"><label htmlFor="action-attachment-notes">Attachment notes</label><textarea id="action-attachment-notes" maxLength={1000} value={form.attachmentNotes} onChange={event => setForm(current => ({ ...current, attachmentNotes: event.target.value }))} disabled={disableOpenFields} /><p className="field-hint">Describe related files here. This does not upload an attachment.</p></div>
        {form.status === "COMPLETED" && <div className="form-field full-width"><label htmlFor="action-result">Result <span className="required-marker">*</span></label><textarea id="action-result" maxLength={2000} value={form.result} onChange={event => setForm(current => ({ ...current, result: event.target.value }))} disabled={saving} /></div>}
      </div>
      {formError && <p className="field-error" role="alert">{formError}</p>}
      <div className="form-actions"><button className="button button-primary" type="submit" disabled={saving}>{saving ? "Saving action..." : form.status === "COMPLETED" ? "Complete action" : form.status === "CANCELLED" ? "Cancel action" : "Save action"}</button><button className="button button-secondary" type="button" onClick={closeForm} disabled={saving}>Cancel</button></div>
    </form>}
    {loading && items.length === 0 ? <p className="status-message" role="status">Loading Actions Taken...</p> : items.length === 0 ? <p className="empty-panel" role="status">No Actions Taken have been recorded for this Ticket.</p> : <><ul className="action-list" aria-label="Actions Taken">
      {items.map(action => <li key={action.id} className="action-item">
        <div className="action-item-header"><div><h3>{action.description}</h3><p>Action date/time {displayDate.format(new Date(action.actionAt))}</p></div><span className={`action-status action-status-${action.status.toLowerCase()}`}>{action.status}</span></div>
        <dl className="action-metadata"><ActionField label="Performed by" value={action.performedBy.displayName} /><ActionField label="Assignee" value={action.assignedTo.displayName} /><ActionField label="Recorded at" value={displayDate.format(new Date(action.createdAt))} /><ActionField label="Completed" value={action.completedAt ? displayDate.format(new Date(action.completedAt)) : "Not completed"} /><ActionField label="Follow-up" value={action.followUpRequired ? action.followUpNote ?? "Required" : "Not required"} />{action.result && <ActionField label="Result" value={action.result} />}{action.attachmentNotes && <ActionField label="Attachment notes" value={action.attachmentNotes} />}</dl>
        {!readOnly && canWrite && action.status === "OPEN" && !showForm && <div className="action-controls">{canEdit(action) && <button className="button button-secondary" type="button" onClick={() => startEdit(action)}>Edit action</button>}{canTransition(action) && <><button className="button button-primary" type="button" onClick={() => startEdit(action, "COMPLETED")}>Complete action</button><button className="button button-secondary" type="button" onClick={() => startEdit(action, "CANCELLED")}>Cancel action</button></>}</div>}
      </li>)}
    </ul><p className="field-hint">Showing {items.length} of {totalItems} Actions Taken.</p>{loadedPage < totalPages && <button className="button button-secondary" type="button" onClick={() => load(loadedPage + 1, true)} disabled={loading}>Load more actions</button>}</>}
  </section>;
}

function ActionField({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function sortActions(first: ActionTaken, second: ActionTaken) {
  return new Date(second.actionAt).getTime() - new Date(first.actionAt).getTime() || second.id - first.id;
}

function toInputDate(value: string) {
  const date = new Date(value);
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

function newIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}
