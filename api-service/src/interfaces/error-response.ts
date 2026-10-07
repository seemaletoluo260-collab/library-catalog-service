import type MessageResponse from "./message-response.js";

type ErrorResponse = {
  errors?: Record<string, string>;
  field?: string;
} & MessageResponse;
export default ErrorResponse;
