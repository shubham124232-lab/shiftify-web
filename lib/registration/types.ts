// Shared types for the registration wizard step system.

import type { ZodSchema } from 'zod';

export interface StepConfig {
  /** Zero-based index */
  index:       number;
  /** Short title shown in step indicator */
  title:       string;
  /** Subtitle shown below step title */
  description: string;
  /** Icon class (bootstrap-icons) */
  icon:        string;
  /** Zod schema for this step's fields — only these fields are validated on Next */
  schema:      ZodSchema;
  /** If true: final step → submits and redirects to /dashboard */
  isFinal?:    boolean;
  /** Fields required for marketplace access (completion blocker check) */
  requiredForMarketplace?: string[];
}
