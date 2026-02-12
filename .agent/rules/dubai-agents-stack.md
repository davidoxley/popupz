# Dubai Agents Stack Rules

This workspace follows the "dubai-agents" shell technology stack blueprint for the Popupz project.

## Architectural Constraints

- **Framework**: Next.js (App Router) with strict TypeScript.
- **Styling**: Tailwind CSS, shadcn/ui, and Framer Motion.
- **State Management**: Zustand (used for decoupling AI JSON streams from UI renders).
- **AI Integration**: Vercel AI SDK (structured Generative UI outputs and `useChat`).
- **UI Principles**: 
  - All components must be modular and modern.
  - Use glassmorphism where appropriate (frosted glass effects).
  - Prioritize smooth micro-interactions and transitions using Framer Motion.

## Directory Structure

- `/components/chat`: Chat-related components.
- `/components/canvas`: Live preview/canvas components.
- `/store`: Zustand store definitions.
- `/app`: Next.js App Router pages.
- `/lib`: Utility functions and shared logic.

## Implementation Guidelines

- Ensure high-impact, premium aesthetics.
- Use curated, harmonious color palettes (avoid generic colors).
- Implement responsive designs.
- Prioritize visual excellence and "wow" factor.
