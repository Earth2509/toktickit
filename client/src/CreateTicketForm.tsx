import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  createTicket,
  fetchCategories,
  fetchRelatedSystems,
  requestedPriorities,
  TicketApiError,
  type Category,
  type RelatedSystem,
  type Requester,
  type RequestedPriority,
  type Ticket,
} from "./api";

type CreateTicketFormProps = {
  requester: Requester;
  onViewMyTickets: () => void;
};

type FormValues = {
  categoryId: string;
  relatedSystemId: string;
  summary: string;
  description: string;
  requestedPriority: "" | RequestedPriority;
};

const initialValues: FormValues = {
  categoryId: "",
  relatedSystemId: "",
  summary: "",
  description: "",
  requestedPriority: "",
};

const permittedFileTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const maximumFileSize = 5 * 1024 * 1024;

export default function CreateTicketForm({ requester, onViewMyTickets }: CreateTicketFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [referenceLoading, setReferenceLoading] = useState(true);
  const [referenceError, setReferenceError] = useState("");
  const [values, setValues] = useState<FormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submissionError, setSubmissionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);

  useEffect(() => {
    void loadReferenceData();
  }, []);

  const requesterLabel = useMemo(
    () => `${requester.displayName} (${requester.email})`,
    [requester.displayName, requester.email],
  );

  async function loadReferenceData() {
    setReferenceLoading(true);
    setReferenceError("");

    try {
      const [loadedCategories, loadedRelatedSystems] = await Promise.all([
        fetchCategories(),
        fetchRelatedSystems(),
      ]);
      setCategories(loadedCategories);
      setRelatedSystems(loadedRelatedSystems);
    } catch {
      setReferenceError("Unable to load Ticket reference data. Please retry.");
    } finally {
      setReferenceLoading(false);
    }
  }

  function updateValue(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => withoutFieldError(current, field));
    setSubmissionError("");
    setIdempotencyKey(createIdempotencyKey());
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    const summary = values.summary.trim();
    const description = values.description.trim();

    if (!values.categoryId) errors.categoryId = "Select a Category.";
    if (!values.relatedSystemId) errors.relatedSystemId = "Select a Related System.";
    if (summary.length < 5 || summary.length > 120) errors.summary = "Enter 5-120 characters.";
    if (description.length < 10 || description.length > 2000) errors.description = "Enter 10-2,000 characters.";
    if (!values.requestedPriority) errors.requestedPriority = "Select a Requested Priority.";

    return errors;
  }

  async function submitTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionError("");
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || submitting || referenceLoading || Boolean(referenceError)) return;

    setSubmitting(true);
    try {
      const ticket = await createTicket({
        requesterId: requester.id,
        categoryId: Number(values.categoryId),
        relatedSystemId: Number(values.relatedSystemId),
        summary: values.summary.trim(),
        description: values.description.trim(),
        requestedPriority: values.requestedPriority as RequestedPriority,
        idempotencyKey,
      });
      setCreatedTicket(ticket);
      setFieldErrors({});
    } catch (error) {
      if (error instanceof TicketApiError) {
        setFieldErrors(error.fieldErrors ?? {});
        setSubmissionError(error.message);
      } else {
        setSubmissionError("Unable to create the Ticket. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const validFiles = files.filter(isPermittedFile);
    const rejectedFiles = files.filter((file) => !isPermittedFile(file));

    // FileList cannot be edited. Keep a separate selection of the locally permitted files.
    if (validFiles.length > 0) setSelectedFiles((current) => mergeSelectedFiles(current, validFiles));
    setFileError(rejectedFiles.map(describeRejectedFile).join(" "));
  }

  function createAnotherTicket() {
    setCreatedTicket(null);
    setValues(initialValues);
    setFieldErrors({});
    setSubmissionError("");
    setSelectedFiles([]);
    setFileError("");
    setIdempotencyKey(createIdempotencyKey());
  }

  if (createdTicket) {
    return (
      <section className="ticket-card" aria-labelledby="ticket-success-heading">
        <p className="section-kicker">Ticket saved</p>
        <h1 id="ticket-success-heading">Your request has been created</h1>
        <div className="success-panel" role="status">
          <p><strong>Ticket Number</strong><span>{createdTicket.ticketNumber}</span></p>
          <p><strong>Ticket Date</strong><span>{formatTicketDate(createdTicket.createdAt)}</span></p>
          <p>Attachments were validated locally but are not uploaded in this step. Select them again when attachment upload is available after Ticket creation.</p>
        </div>
        <div className="form-actions">
          <button className="button button-primary" onClick={onViewMyTickets}>View My Tickets</button>
          <button className="button button-secondary" onClick={createAnotherTicket}>Create another Ticket</button>
        </div>
      </section>
    );
  }

  return (
    <section className="ticket-card" aria-labelledby="create-ticket-heading">
      <div className="ticket-card-heading">
        <div>
          <p className="section-kicker">Requester workspace</p>
          <h1 id="create-ticket-heading">Create Ticket</h1>
          <p>Describe the issue clearly. TokTickIT assigns the official Ticket Number after saving.</p>
        </div>
        <div className="readonly-summary" aria-label="System-generated Ticket information">
          <span>Ticket Number</span><strong>Assigned after saving</strong>
          <span>Ticket Date</span><strong>Assigned after saving</strong>
        </div>
      </div>

      {referenceLoading && <p className="status-message" role="status">Loading Ticket reference data...</p>}
      {referenceError && (
        <div className="error-panel" role="alert">
          <p>{referenceError}</p>
          <button type="button" className="button button-secondary" onClick={() => void loadReferenceData()}>Retry</button>
        </div>
      )}
      {submissionError && <div className="error-panel" role="alert"><p>{submissionError}</p></div>}

      <form noValidate onSubmit={submitTicket}>
        <fieldset disabled={referenceLoading || Boolean(referenceError) || submitting}>
          <div className="form-grid">
            <Field label="Requester" id="ticket-requester">
              <input id="ticket-requester" className="readonly-input" value={requesterLabel} readOnly />
            </Field>
            <Field label="Requested Priority" id="requested-priority" error={fieldErrors.requestedPriority} required>
              <select id="requested-priority" value={values.requestedPriority} onChange={(event) => updateValue("requestedPriority", event.target.value)} aria-invalid={Boolean(fieldErrors.requestedPriority)} aria-describedby={describedBy("requested-priority", fieldErrors.requestedPriority)}>
                <option value="">Select a priority</option>
                {requestedPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </Field>
            <Field label="Category" id="category" error={fieldErrors.categoryId} required>
              <select id="category" value={values.categoryId} onChange={(event) => updateValue("categoryId", event.target.value)} aria-invalid={Boolean(fieldErrors.categoryId)} aria-describedby={describedBy("category", fieldErrors.categoryId)}>
                <option value="">Select a Category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </Field>
            <Field label="Related System" id="related-system" error={fieldErrors.relatedSystemId} required>
              <select id="related-system" value={values.relatedSystemId} onChange={(event) => updateValue("relatedSystemId", event.target.value)} aria-invalid={Boolean(fieldErrors.relatedSystemId)} aria-describedby={describedBy("related-system", fieldErrors.relatedSystemId)}>
                <option value="">Select a Related System</option>
                {relatedSystems.map((system) => <option key={system.id} value={system.id}>{system.name}</option>)}
              </select>
            </Field>
            <Field label="Summary" id="summary" error={fieldErrors.summary} required className="full-width">
              <input id="summary" value={values.summary} onChange={(event) => updateValue("summary", event.target.value)} aria-invalid={Boolean(fieldErrors.summary)} aria-describedby={describedBy("summary", fieldErrors.summary, "summary-hint summary-count")} />
              <span id="summary-hint" className="field-hint">5-120 characters</span>
              <span id="summary-count" className="field-hint" aria-live="polite">{values.summary.length}/120 characters</span>
            </Field>
            <Field label="Description" id="description" error={fieldErrors.description} required className="full-width">
              <textarea id="description" value={values.description} onChange={(event) => updateValue("description", event.target.value)} rows={6} aria-invalid={Boolean(fieldErrors.description)} aria-describedby={describedBy("description", fieldErrors.description, "description-hint description-count")} />
              <span id="description-hint" className="field-hint">10-2,000 characters</span>
              <span id="description-count" className="field-hint" aria-live="polite">{values.description.length}/2,000 characters</span>
            </Field>
            <Field label="Attachments" id="attachments" error={fileError} className="full-width">
              <input id="attachments" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" onChange={selectFiles} aria-describedby={describedBy("attachments", fileError, "attachments-hint")} />
              <span id="attachments-hint" className="field-hint">JPEG, PNG, WEBP, or PDF up to 5 MB each. Upload will be available after the Ticket is created.</span>
              {selectedFiles.length > 0 && <ul className="selected-files" aria-label="Selected valid files">{selectedFiles.map((file) => <li key={fileIdentity(file)}>{file.name} ({formatFileSize(file.size)})</li>)}</ul>}
            </Field>
          </div>
        </fieldset>
        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={referenceLoading || Boolean(referenceError) || submitting}>
            {submitting ? "Creating ticket..." : "Submit Ticket"}
          </button>
        </div>
      </form>
    </section>
  );
}

type FieldProps = {
  label: string;
  id: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
};

function Field({ label, id, error, required = false, className = "", children }: FieldProps) {
  return <div className={`form-field ${className}`.trim()}>
    <label htmlFor={id}>{label}{required && <span className="required-marker" aria-hidden="true"> *</span>}</label>
    {children}
    {error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
  </div>;
}

function withoutFieldError(errors: Record<string, string>, field: keyof FormValues): Record<string, string> {
  const key = field === "categoryId" ? "categoryId" : field === "relatedSystemId" ? "relatedSystemId" : field;
  const { [key]: _removed, ...remaining } = errors;
  return remaining;
}

function describedBy(id: string, error?: string, additionalId?: string): string | undefined {
  const ids = [error ? `${id}-error` : "", additionalId ?? ""].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    return (character === "x" ? random : (random & 0x3) | 0x8).toString(16);
  });
}

function formatTicketDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recorded by TokTickIT" : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(bytes < 1024 * 1024 ? 1 : 2)} MB`;
}

function isPermittedFile(file: File): boolean {
  return permittedFileTypes.includes(file.type) && file.size <= maximumFileSize;
}

function describeRejectedFile(file: File): string {
  if (!permittedFileTypes.includes(file.type)) {
    return `${file.name}: unsupported file type. Choose JPEG, PNG, WEBP, or PDF.`;
  }

  return `${file.name}: exceeds the 5 MB limit.`;
}

function mergeSelectedFiles(current: File[], additions: File[]): File[] {
  const uniqueFiles = new Map(current.map((file) => [fileIdentity(file), file]));
  additions.forEach((file) => uniqueFiles.set(fileIdentity(file), file));
  return [...uniqueFiles.values()];
}

function fileIdentity(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}
