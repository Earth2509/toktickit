import { type ChangeEvent, type ReactNode, useEffect, useState } from "react";
import {
  downloadTicketAttachment,
  fetchTicket,
  removeTicketAttachment,
  TicketApiError,
  uploadTicketAttachment,
  type Attachment,
  type Requester,
  type TicketDetail as TicketDetailModel,
} from "./api";

type TicketDetailProps = {
  requester: Requester;
  ticketId: number;
  onBack: () => void;
};

const permittedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const maximumSize = 5 * 1024 * 1024;

export default function TicketDetail({ requester, ticketId, onBack }: TicketDetailProps) {
  const [ticket, setTicket] = useState<TicketDetailModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [removalReason, setRemovalReason] = useState("");
  const [removalError, setRemovalError] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setTicket(null);

    void fetchTicket(ticketId, requester.id)
      .then((loadedTicket) => {
        if (active) setTicket(loadedTicket);
      })
      .catch(() => {
        if (active) setError("Unable to load this Ticket. It may no longer be available.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [requester.id, ticketId]);

  async function selectUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setUploadMessage("");
    if (!file || !ticket || uploading) return;

    if (!permittedTypes.includes(file.type)) {
      setUploadMessage(`${file.name}: choose a JPEG, PNG, WEBP, or PDF file.`);
      return;
    }
    if (file.size > maximumSize) {
      setUploadMessage(`${file.name}: the file exceeds the 5 MB limit.`);
      return;
    }
    if (activeAttachmentCount(ticket.attachments) >= 5) {
      setUploadMessage("This Ticket already has five active attachments. Remove one before uploading another.");
      return;
    }

    setUploading(true);
    try {
      const attachment = await uploadTicketAttachment(ticket.id, requester.id, file);
      setTicket((current) => current ? { ...current, attachments: [attachment, ...current.attachments] } : current);
      setUploadMessage(`${attachment.originalFilename} was uploaded successfully.`);
      setFileInputKey((current) => current + 1);
    } catch (uploadError) {
      setUploadMessage(uploadError instanceof TicketApiError ? uploadError.message : "Unable to upload the attachment. Please retry.");
    } finally {
      setUploading(false);
    }
  }

  async function downloadAttachment(attachment: Attachment) {
    if (!ticket || attachment.removedAt || downloadingId !== null) return;
    setUploadMessage("");
    setDownloadingId(attachment.id);
    try {
      await downloadTicketAttachment(ticket.id, attachment.id, requester.id, attachment.originalFilename);
    } catch {
      setUploadMessage("Unable to download the attachment. Please retry.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function confirmRemoval(attachment: Attachment) {
    if (!ticket || removingId !== attachment.id) return;
    const trimmedReason = removalReason.trim();
    if (trimmedReason.length < 5 || trimmedReason.length > 250) {
      setRemovalError("Enter a removal reason between 5 and 250 characters.");
      return;
    }

    setRemovalError("");
    try {
      const removed = await removeTicketAttachment(ticket.id, attachment.id, requester.id, trimmedReason);
      setTicket((current) => current
        ? { ...current, attachments: current.attachments.map((item) => item.id === removed.id ? removed : item) }
        : current);
      setUploadMessage(`${attachment.originalFilename} was removed. Its audit metadata is retained.`);
      setRemovingId(null);
      setRemovalReason("");
    } catch (removeError) {
      setRemovalError(removeError instanceof TicketApiError ? removeError.message : "Unable to remove the attachment. Please retry.");
    }
  }

  if (loading) return <section className="ticket-card"><p className="status-message" role="status">Loading Ticket details...</p></section>;

  if (error || !ticket) {
    return <section className="ticket-card">
      <div className="error-panel" role="alert"><p>{error || "Ticket details are unavailable."}</p></div>
      <button className="button button-secondary" type="button" onClick={onBack}>Back to My Tickets</button>
    </section>;
  }

  const activeCount = activeAttachmentCount(ticket.attachments);

  return <>
    <div className="page-breadcrumb">
      <p><span>My Tickets</span><span aria-hidden="true">/</span><strong>Ticket Detail</strong></p>
      <button className="button button-secondary" type="button" onClick={onBack}>Back to My Tickets</button>
    </div>
    <section className="ticket-card ticket-detail-card" aria-labelledby="ticket-detail-heading">
    <div className="ticket-card-heading">
      <div>
        <p className="section-kicker">Requester workspace</p>
        <h1 id="ticket-detail-heading">Ticket Detail</h1>
        <p>Review saved Ticket information and manage permitted attachments.</p>
      </div>
    </div>

    <dl className="ticket-detail-grid">
      <DetailField label="Ticket Number" value={ticket.ticketNumber} />
      <DetailField label="Ticket Date" value={formatDate(ticket.createdAt)} />
      <DetailField label="Category" value={ticket.category.name} />
      <DetailField label="Related System" value={ticket.relatedSystem.name} />
      <DetailField label="Requester" value={`${ticket.requester.displayName} (${ticket.requester.email})`} />
      <DetailField label="Requested Priority" value={<span className={`priority-badge priority-${ticket.requestedPriority.toLowerCase()}`}>{ticket.requestedPriority}</span>} />
      <DetailField label="Current Status" value={<span className="status-badge">{ticket.currentStatus}</span>} />
      <DetailField label="Last Updated" value={formatDate(ticket.updatedAt)} />
      <DetailField label="Summary" value={ticket.summary} fullWidth />
      <DetailField label="Description" value={ticket.description} fullWidth />
    </dl>

    <section className="attachment-section" aria-labelledby="attachments-heading">
      <div className="attachment-heading">
        <div><h2 id="attachments-heading">Attachments</h2><p>{activeCount} of 5 active attachments</p></div>
      </div>
      {uploadMessage && <p className={uploadMessage.includes("successfully") || uploadMessage.includes("was removed") ? "attachment-success" : "field-error"} role="status">{uploadMessage}</p>}
      <label className="attachment-upload-label" htmlFor="ticket-attachment">Upload an attachment</label>
      <input
        key={fileInputKey}
        id="ticket-attachment"
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={selectUpload}
        disabled={uploading || activeCount >= 5}
        aria-describedby="ticket-attachment-hint"
      />
      <p id="ticket-attachment-hint" className="field-hint">JPEG, PNG, WEBP, or PDF up to 5 MB. Upload one file at a time.</p>
      {uploading && <p className="status-message" role="status">Uploading attachment...</p>}

      {ticket.attachments.length === 0 ? <p className="empty-panel" role="status">No attachments have been added to this Ticket.</p> : (
        <ul className="attachment-list" aria-label="Ticket attachments">
          {ticket.attachments.map((attachment) => <li key={attachment.id} className="attachment-item">
            <div className="attachment-metadata">
              <strong>{attachment.originalFilename}</strong>
              <span>{attachment.mimeType} · {formatFileSize(attachment.sizeBytes)} · Uploaded {formatDate(attachment.createdAt)}</span>
              {attachment.removedAt && <span className="removed-badge">Removed · {attachment.removalReason}</span>}
            </div>
            {!attachment.removedAt && removingId !== attachment.id && <div className="attachment-actions">
              <button className="button button-secondary" type="button" onClick={() => void downloadAttachment(attachment)} disabled={downloadingId !== null}>{downloadingId === attachment.id ? "Downloading..." : "Download"}</button>
              <button className="button button-secondary" type="button" onClick={() => { setRemovingId(attachment.id); setRemovalReason(""); setRemovalError(""); }}>Remove</button>
            </div>}
            {removingId === attachment.id && <div className="remove-confirmation">
              <label htmlFor={`remove-reason-${attachment.id}`}>Removal reason</label>
              <input id={`remove-reason-${attachment.id}`} value={removalReason} onChange={(event) => setRemovalReason(event.target.value)} aria-invalid={Boolean(removalError)} aria-describedby={removalError ? `remove-reason-${attachment.id}-error` : undefined} />
              {removalError && <p id={`remove-reason-${attachment.id}-error`} className="field-error" role="alert">{removalError}</p>}
              <div className="attachment-actions"><button className="button button-primary" type="button" onClick={() => void confirmRemoval(attachment)}>Confirm removal</button><button className="button button-secondary" type="button" onClick={() => { setRemovingId(null); setRemovalReason(""); setRemovalError(""); }}>Cancel</button></div>
            </div>}
          </li>)}
        </ul>
      )}
    </section>
    </section>
  </>;
}

function DetailField({ label, value, fullWidth = false }: { label: string; value: ReactNode; fullWidth?: boolean }) {
  return <div className={fullWidth ? "detail-field detail-field-wide" : "detail-field"}><dt>{label}</dt><dd>{value}</dd></div>;
}

function activeAttachmentCount(attachments: Attachment[]): number {
  return attachments.filter((attachment) => !attachment.removedAt).length;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(bytes < 1024 * 1024 ? 1 : 2)} MB`;
}
