# Data Model & State Machine: Floating Launcher & Minimalist Chat Shell

**Feature Key**: `ARL-30`  
**Feature Slug**: `016-floating-launcher-chat-shell`  

---

## 1. Entities & Types

### 1.1 Chat Message (`ChatMessage`)

Represents a single conversational turn in the chat history.

```typescript
export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string; // ISO 8601 string
  status?: 'sending' | 'delivered' | 'error';
}
```

### 1.2 Assistant Status (`AssistantStatus`)

Describes the operational status of the in-app assistant.

```typescript
export type AssistantStatus = 'idle' | 'loading' | 'error';
```

### 1.3 Assistant Shell State (`AssistantShellState`)

Describes the complete client-side state of the floating launcher and chat popover.

```typescript
export interface AssistantShellState {
  isOpen: boolean;
  status: AssistantStatus;
  messages: ChatMessage[];
  inputValue: string;
}
```

---

## 2. Finite State Machine (FSM)

The chat shell operates as a deterministic finite state machine:

```
                       +-------------------+
                       |    COLLAPSED      | <------+
                       | (Launcher Pill)   |        |
                       +-------------------+        |
                                 |                  |
                          click / toggle            |
                                 v                  |
                       +-------------------+        |
                       |     EXPANDED      |        |
                       | (Popover Window)  |        |
                       +-------------------+        |
                         |        |       |         |
                  submit |        | clear |         |
                         v        |       |         |
                     [LOADING]    |       |         |
                         |        |       |         |
                  receive|        |       |         |
                         v        v       |         |
                     [IDLE] <-----+       |         |
                         |                |         |
                         +----------------+---------+
                              Esc key / close click
```

### Transitions:

1. **`TOGGLE_OPEN`**: Inverts `isOpen`. If opening, focuses input. If closing, sets focus back to launcher.
2. **`SEND_MESSAGE`**:
   - Trims `inputValue`. If non-empty and `status !== 'loading'`:
   - Appends user message to `messages`.
   - Clears `inputValue`.
   - Sets `status = 'loading'`.
   - Appends assistant response and sets `status = 'idle'`.
3. **`CLEAR_MESSAGES`**:
   - Resets `messages` to default initial state (or empty array with default welcome placeholder).
   - Resets `status = 'idle'`.
4. **`SET_INPUT_VALUE`**: Updates draft input text in state.
5. **`CLOSE_ON_ESC`**: When `isOpen === true` and `Escape` is pressed, sets `isOpen = false`.

---

## 3. Storage Persistence Schema (`sessionStorage`)

- Key: `arlq_assistant_messages`
  - Serialized JSON array of `ChatMessage[]`.
- Key: `arlq_assistant_open`
  - Serialized boolean `"true" | "false"`.
