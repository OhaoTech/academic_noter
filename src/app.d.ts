/// <reference types="@sveltejs/kit" />

declare namespace App {
  interface Locals {}
  interface Platform {}
  interface Session {}
  interface Stuff {}

  interface CellChangeEvent {
    id: string;
    content: string;
  }

  interface CellExecuteEvent {
    id: string;
    type: 'markdown' | 'python' | 'javascript' | 'latex' | 'shader';
    content: string;
  }

  interface CustomEvents {
    'change': CustomEvent<CellChangeEvent>;
    'execute': CustomEvent<CellExecuteEvent>;
    'toggle-edit': CustomEvent<void>;
  }
} 