import { useEffect, useState } from "react";
import { TicketApiError, type DiscussionEntry, type DiscussionPage } from "./api";

type Props = {
  title: string;
  ticketId: number;
  privateLabel?: boolean;
  load: (ticketId: number) => Promise<DiscussionPage>;
  create: (ticketId: number, content: string) => Promise<DiscussionEntry>;
};

export default function DiscussionPanel({ title, ticketId, privateLabel = false, load, create }: Props) {
  const [items, setItems] = useState<DiscussionEntry[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = () => {
    setLoading(true); setError("");
    void load(ticketId).then(page => setItems(page.items)).catch(caught => setError(caught instanceof TicketApiError ? caught.message : "Unable to load this discussion.")).finally(() => setLoading(false));
  };
  useEffect(refresh, [ticketId]);

  async function submit() {
    const trimmed = content.trim();
    if (trimmed.length < 1 || trimmed.length > 2000) { setError("Enter 1 to 2000 characters."); return; }
    setSaving(true); setError("");
    try { const entry = await create(ticketId, trimmed); setItems(current => [entry, ...current]); setContent(""); }
    catch (caught) { setError(caught instanceof TicketApiError ? caught.message : "Unable to save your entry."); }
    finally { setSaving(false); }
  }

  return <section className="discussion-section" aria-labelledby={`${privateLabel ? "internal" : "public"}-discussion-heading`}>
    <h2 id={`${privateLabel ? "internal" : "public"}-discussion-heading`}>{title}</h2>
    {privateLabel && <p className="field-hint">Visible to IT Staff and Administrators only.</p>}
    {error && <p className="field-error" role="alert">{error}</p>}
    <label htmlFor={`${privateLabel ? "note" : "comment"}-content`}>{privateLabel ? "Internal note" : "Public comment"}</label>
    <textarea id={`${privateLabel ? "note" : "comment"}-content`} value={content} disabled={saving} onChange={event => setContent(event.target.value)} maxLength={2000} />
    <button className="button button-secondary" type="button" disabled={saving} onClick={() => void submit()}>{saving ? "Saving..." : privateLabel ? "Add internal note" : "Post comment"}</button>
    {loading ? <p className="status-message" role="status">Loading discussion...</p> : items.length === 0 ? <p className="empty-panel">No entries yet.</p> : <ul className="discussion-list">{items.map(item => <li key={item.id}><strong>{item.author.displayName}</strong><span>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</span><p>{item.content}</p></li>)}</ul>}
  </section>;
}
