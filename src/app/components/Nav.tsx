import Link from "next/link";
import { auth0 } from "@/lib/auth0";

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(payload, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default async function Nav() {
  const session = await auth0.getSession();
  const user = session?.user as Record<string, unknown> | undefined;
  const rolesClaim = process.env.NEXT_PUBLIC_AUTH0_ROLES_CLAIM || "roles";

  let roles: string[] = [];
  const claimValue = user && (user as any)[rolesClaim as string];
  if (Array.isArray(claimValue) && claimValue.every((v) => typeof v === "string")) {
    roles = claimValue as string[];
  }
  // Fallback: si la sesión no trae el claim en el ID token, lo leemos del access token
  if (roles.length === 0) {
    try {
      const { token } = await auth0.getAccessToken();
      if (token) {
        const payload = decodeJwtPayload(token);
        const atClaim = payload && payload[rolesClaim as string];
        if (Array.isArray(atClaim) && atClaim.every((v: unknown) => typeof v === "string")) {
          roles = atClaim as string[];
        }
      }
    } catch {
      // ignore
    }
  }

  const isAdmin = roles.includes("ADMIN");

  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-950/60 bg-white/80 dark:bg-gray-950/80 border-b border-slate-200/60 dark:border-gray-800/60">
      <nav className="flex items-center justify-between py-3 sm:py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="inline-block h-8 w-8 rounded-md bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500" />
            <span className="text-base sm:text-lg font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-gray-400">
              Appointments
            </span>
          </Link>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-gray-300">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Home</Link>
            {user && (
              <Link href="/appointments" className="hover:text-slate-900 dark:hover:text-white transition-colors">My Appointments</Link>
            )}
            {isAdmin && (
              <>
                <Link href="/admin/appointments" className="hover:text-slate-900 dark:hover:text-white transition-colors">Admin</Link>
                <Link href="/admin/users" className="hover:text-slate-900 dark:hover:text-white transition-colors">Gestionar Usuarios</Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!session ? (
              <a
                href="/auth/login"
                className="inline-flex items-center rounded-md bg-slate-900 text-white dark:bg-white dark:text-gray-900 px-3 py-2 text-sm font-medium shadow-sm hover:opacity-90 active:opacity-80 transition"
              >
                Login
              </a>
            ) : (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-sm text-slate-700 dark:text-gray-300">{String((user as any)?.name || '')}</span>
                <a
                  href="/auth/logout"
                  className="inline-flex items-center rounded-md bg-slate-900 text-white dark:bg-white dark:text-gray-900 px-3 py-2 text-sm font-medium shadow-sm hover:opacity-90 active:opacity-80 transition"
                >
                  Logout
                </a>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
