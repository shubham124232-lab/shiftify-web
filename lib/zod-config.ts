import { z } from 'zod';

// zod 4 words a missing field as "Invalid input: expected string, received undefined".
// Keep the short "Required" text the forms showed under zod 3 when a field has no custom message.
z.config({
  customError: (issue) => (issue.code === 'invalid_type' && issue.input === undefined ? 'Required' : undefined),
});
