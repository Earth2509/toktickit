const requiredRuntimeVariables = ["DATABASE_URL", "AUTH_CSRF_SECRET"] as const;

export function validateRuntimeConfiguration(environment: NodeJS.ProcessEnv = process.env): void {
  const missing = requiredRuntimeVariables.filter((name) => !environment[name]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}. See server/.env.example.`);
  }
}
