export interface StepProps {
  /** Error messages keyed by question ID, shown after the user tries to continue. */
  errors: Record<string, string>;
}
