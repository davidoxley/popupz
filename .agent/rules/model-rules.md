# AI Model Reliability and Notification Rules

1.  **Strict Model Adherence**: ALWAYS use the model specified by the USER or the `GOOGLE_GENERATIVE_AI_MODEL` environment variable.
2.  **Failure Notification**: If the specified model fails (e.g., 404 Model Not Found, 500 API Error), the application MUST explicitly notify the USER of the failure immediately. Do NOT attempt to fallback to other models or perform silent retries with different IDs unless explicitly requested.
3.  **Error Transparency**: API errors related to model availability must be bubbled up to the UI so the USER is aware of the specific failure point.
