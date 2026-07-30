/** Resolve connection string for local Render / scripts */
export function getDatabaseUrl() {
  const url =
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_PUBLIC ||
    process.env.DATABASE_URL_PRIVATE ||
    ""

  if (!url) {
    console.error(
      "Defina DATABASE_URL (Render) ou DATABASE_URL_PUBLIC / DATABASE_URL_PRIVATE"
    )
    process.exit(1)
  }

  return url
}
