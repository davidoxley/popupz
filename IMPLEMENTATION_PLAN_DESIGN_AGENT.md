# Implementation Plan - Design Agent

This plan outlines the steps to create a **Design Agent** within the Popupz platform that progressively builds a storefront JSON config.

## 1. Define Design State Schema
- Define a comprehensive JSON schema for the storefront configuration including brand details, theme settings (colors, radius), layout preferences, and content.

## 2. Update Zustand Store (`store/useStore.ts`)
- Replace individual state variables with a unified `config` object.
- Add an `updateConfig` method that handles partial updates (Delta).
- Maintain chat history if needed for the agent.

## 3. Enhance API Route (`app/api/chat/route.ts`)
- Update the system prompt to instruct Gemini to act as a Design Agent.
- Implement a more structured toolset for updating specific parts of the config.
- Use Gemini 1.5 Flash (or stay with Gemini 3 if preferred, but user mentioned 1.5 Flash).
- Ensure the agent asks one question at a time.

## 4. Update Chat UI (`components/chat/ChatPanel.tsx`)
- Reflect the changes in the Zustand store.
- Ensure smooth handling of tool calls and UI updates.

## 5. Refactor Canvas UI (`components/canvas/CanvasPanel.tsx`)
- Make the UI truly dynamic by consuming the new `config` object.
- Map `theme` variables to CSS variables or inline styles.

## 6. Create `useDesignAgent` Hook (Optional but requested)
- Encapsulate the chat and config update logic in a reusable hook.

## 7. Polish Aesthetics
- Ensure the agent's messages and the resulting storefront look premium.
