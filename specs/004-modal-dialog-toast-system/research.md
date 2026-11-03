# Technical Research & Architecture Decisions: Modal Dialog Root, Confirmations & Toast Notifications

**Feature Key**: `ARL-5`  
**Feature Slug**: `004-modal-dialog-toast-system`  

---

## 1. Stack Alignment & Context

- **Framework**: Next.js 16 (App Router) with React 19.
- **Styling**: Tailwind CSS v4 using semantic design tokens (`lib/tokens.ts`, `app/globals.css`).
- **Target Application**: ARLQ Food Condiments Trading (Toyo, Suka, Patis inventory & sales system).
- **Core Dependencies**: Zero unnecessary external runtime packages. Native React 19 primitives (`createPortal`, `useRef`, `useEffect`, `useCallback`, `useContext`) will be used to maintain minimal bundle weight and eliminate hydration mismatch issues.

---

## 2. Architectural Analysis & Decisions

### Decision 1: React Portal Mounting & Container Lifecycle
- **Problem**: Next.js App Router renders pages within server/client component boundaries. Rendering dialogs inline causes CSS clipping, z-index stacking context anomalies, and layout thrashing.
- **Decision**: 
  - Standardize on `createPortal` mounting directly to dedicated DOM anchors: `#modal-root` and `#toasts`.
  - In `app/layout.tsx` or `components/layout/app-shell.tsx`, provision permanent container elements: `<div id="modal-root" />` and `<div id="toasts" />`.
  - Provide a safe client-side hydration check (`mounted` boolean state) before invoking `createPortal`, preventing Next.js SSR hydration mismatches.

### Decision 2: Focus Trapping & Accessibility (WCAG 2.1 AA)
- **Problem**: When a modal opens, keyboard navigation (Tab / Shift+Tab) can leak into background page elements, violating WCAG 2.1 AA accessibility guidelines.
- **Decision**:
  - Implement a dedicated `useFocusTrap` hook (or integrated trap in `ModalDialog`):
    - On mount, query focusable elements (`button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])`).
    - Focus the first interactive element (or an explicitly flagged element).
    - Intercept `KeyDown` events: cycle focus forward on `Tab` and backward on `Shift+Tab`.
    - Cache the previously focused DOM element (`document.activeElement`) prior to modal mount, and restore focus to that element upon modal close.
    - Intercept `Escape` key to call `onClose()`.

### Decision 3: Body Scroll Locking
- **Problem**: Scrolling while a modal dialog is open causes the background page to move awkwardly beneath the backdrop.
- **Decision**:
  - In the modal lifecycle, store `document.body.style.overflow`.
  - Set `document.body.style.overflow = 'hidden'` on open, and restore the previous value on unmount.
  - Guard against multiple stacked modals by counting active modal instances before restoring body overflow.

### Decision 4: Confirmation Dialog Abstraction (`useConfirm` and `ConfirmDialog`)
- **Problem**: Upcoming features (ARL-7 Category Management, ARL-8 Product Management) require frequent confirmation dialogs before deleting entities or taking irreversible actions.
- **Decision**:
  - Provide both a programmatic hook (`useConfirm()`) returning a promise `const confirmed = await confirm({ title, message, confirmLabel, variant })` and a declarative component (`<ConfirmDialog ... />`).
  - Styled to mirror `mockup/app.js:189-193`:
    - Title: `<h3>${title}</h3>`
    - Body: `<p class="text-text-muted">${message}</p>`
    - Actions: `Cancel` (secondary button) and `Confirm` (e.g. Danger red button for deletions).
    - Zero state mutation if canceled.

### Decision 5: Toast Stacking & Auto-Dismissal
- **Problem**: Multiple user actions or rapid clicks can fire multiple alerts simultaneously.
- **Decision**:
  - Refactor/extend `ToastProvider` and `useToast` to support stacking in the bottom-right corner (`bottom-5 right-6 flex flex-col gap-2 z-90 items-end pointer-events-none`).
  - Provide exact 2.8 second (`2800ms`) auto-dismissal per toast with automatic timer cleanup.
  - Individual toast pills have `pointer-events-auto` so users can interact with them or let them disappear without blocking background clicks.
  - Support variant styling (`success` with checkmark, `danger` with warning icon, `info`).

---

## 3. Reference Implementation Cross-Check (`mockup/app.js`)

```javascript
// Reference Toast from mockup/app.js:181-183
function toast(msg){
  const t=document.createElement('div');t.className='toast';t.innerHTML=ico('check')+esc(msg);
  $('#toasts').appendChild(t);setTimeout(()=>t.remove(),2800);
}

// Reference Modal from mockup/app.js:185-186
function modal(html){ 
  $('#modal-root').innerHTML=`<div class="modal-back" onclick="if(event.target===this)A.closeModal()"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
  const f=$('#modal-root input,#modal-root select'); if(f) f.focus(); 
}

// Reference ConfirmBox from mockup/app.js:188-193
function confirmBox(title,msg,label,cb){
  confirmCb=cb;
  modal(`<h3>${title}</h3><div class="mb"><p class="muted">${msg}</p></div>
  <div class="mf"><button class="btn sec" onclick="A.closeModal()">Cancel</button><button class="btn danger" onclick="A.doConfirm()">${label}</button></div>`);
}
```

The React implementation will replicate this behavior in a type-safe, accessible, and reactive manner.
