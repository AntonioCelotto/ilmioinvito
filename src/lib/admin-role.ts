export function isProjectAdmin(user: { app_metadata?: Record<string, unknown> } | null | undefined) {
  return user?.app_metadata?.app_role === "admin" && user.app_metadata.project_owner === true;
}
