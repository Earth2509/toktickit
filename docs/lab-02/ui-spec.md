# Lab 2 Zen Green UI Specification

**Status:** Draft for peer review  
**Scope:** Development Requester Selection, Create Ticket, My Tickets, Requester Ticket Detail, and Attachments.

## 1. Design Principles

The interface must be calm, professional, and immediately understandable. Reusable components communicate state through text, iconography where helpful, and color. A user must not need to infer validation, loading, failure, ownership, or attachment availability from color alone.

## 2. Zen Green Tokens

| Token | Value | Use |
|---|---|---|
| Primary green | `#006B3C` | Application header, primary actions, strong emphasis |
| Secondary green | `#0B7A46` | Active navigation, links, focus accents, hover states |
| Pale green | `#EAF6EF` | Selected rows, success panels, subtle emphasis |
| Page background | `#F5F7F6` | Quiet application background |
| Surface | `#FFFFFF` | Cards, forms, list/table surfaces |
| Text | dark charcoal-green | Readable body text; do not use pure black by default |
| Error | dark red | Field border and message directly below invalid field |
| Warning | amber | Attachment warning or non-blocking callout only |

Cards use a subtle neutral border, restrained shadow, and consistent spacing. Editable fields are white; read-only values use a distinct soft gray-green or warm ivory surface.

## 3. Application Shell and Navigation

- Header displays TokTickIT identity, selected Development Requester name, My Tickets, Create Ticket, and Change Requester.
- The active route has a visible text and color indication.
- Desktop navigation is horizontal. Mobile navigation remains reachable without horizontal scrolling and uses clear text labels.
- Change Requester returns to the selector and clears requester-scoped client state before loading the replacement context.

## 4. Development Requester Selection

The screen contains TokTickIT title, a concise testing-only explanation, active Requester dropdown, Continue button, and a safe error region.

- Loading: dropdown is disabled and a `role=status` message is visible.
- Empty: explain that no active Development Requesters are available and disable Continue.
- Failure: show a safe retry message; do not expose raw network errors.
- Controls are keyboard accessible with a visible focus ring.
- Copy states: "Select a Development Requester to test requester-specific ticket behavior. This is not a login screen."

## 5. Create Ticket

### Layout

Use a centered card with system-generated/read-only information near the top, classification fields grouped together, full-width Summary and Description, attachment section below them, and actions at the bottom. Requester is read-only and populated from the selected context. Ticket Number and Ticket Date are system-generated, read-only values shown after successful backend creation. Before submission, their reserved positions explain that the backend will assign them after the Ticket is saved.

### Controls and states

- Labels sit above controls. Required fields show a red asterisk and receive a nearby text validation message.
- Inputs share a consistent height. Description is a taller textarea and does not break the layout when resized.
- Submit Ticket is the only primary action. While submitting, it displays text such as "Creating ticket..." and is disabled.
- Initial, loading-reference-data, validation-failure, submitting, success, API-failure, permitted-file, and invalid-file states are explicit.
- A create API failure preserves entered values and selected valid files where browser security permits.
- Success panel displays the backend-generated Ticket Number and links to My Tickets or Ticket Detail.

## 6. My Tickets

- A responsive toolbar contains search, Category, Related System, Requested Priority, and Current Status filters; Sort; Clear filters; and Create Ticket.
- Desktop uses a readable table with Ticket Number, Summary, Category, Requested Priority, Current Status, and Last Updated. Ticket Number/Summary opens detail.
- Tablet may reduce secondary columns while keeping the Ticket identifiable.
- Mobile uses cards or an accessible responsive table with the same essential information and a clear Detail action.
- Loading, empty (no owned tickets), no-results (filters/search return none), and API-failure states use distinct explanations.
- Pagination announces the current page and total result count; disabled previous/next controls are visibly disabled.

## 7. Requester Ticket Detail and Attachments

- Ticket fields are grouped and read-only: Ticket Number, date, Requester, Category, Related System, Summary, Requested Priority, Description, and Current Status.
- Attachment section is visually separate and shows filename, type, size, upload time, and state.
- Active attachments provide Download and Remove controls. Remove requires a visible confirmation and a reason field.
- Removed attachments display retained metadata and a Removed badge; Download/Preview controls are absent or disabled with explanatory text.
- Upload uses a labelled file control and surfaces per-file type, size, maximum-count, upload, and ownership errors adjacent to the attachment section.

## 8. Component and Accessibility Rules

- Every control has a visible label. Icon-only controls have an accessible name and tooltip.
- Focus indicators remain visible. Keyboard order follows the visual form order.
- Buttons include text; destructive removal actions use a clear destructive treatment and confirmation.
- `role=status` communicates loading/submitting/success where appropriate; `role=alert` is reserved for actionable failure.
- Status and priority badges include readable text, not color only.
- Buttons have primary, secondary, tertiary, destructive, disabled, and busy states defined consistently.

## 9. Responsive Rules

| Viewport | Required behavior |
|---|---|
| Desktop >= 992 px | Multi-column forms/list layout where useful; centered max-width content. |
| Tablet 768-991 px | Two columns where practical; Summary and Description retain useful width. |
| Mobile < 768 px | Fields stack, actions are touch-friendly, table becomes usable cards/responsive table, and no page-level horizontal scroll occurs. |

## 10. Visual Inspection Checklist

- No clipped labels, overlapping messages, hidden buttons, unreadable attachment names, or horizontal overflow.
- Zen Green tokens and card/field states are consistent across all three screens.
- Required markers and validation messages appear beside their fields.
- Read-only fields are visually distinct from editable fields.
- Loading, empty, no-results, success, error, removed attachment, and disabled/busy states are visible.
- Desktop, tablet, and mobile screenshots are captured for Create Ticket, My Tickets, and Ticket Detail in the prescribed artifact folders.
