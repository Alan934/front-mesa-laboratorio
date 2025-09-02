import Link from "next/link";
import { auth0 } from "@/lib/auth0";

export default async function Home() {
  const session = await auth0.getSession();
  const user = session?.user;
  return (
    <main className="px-4 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl text-center rounded-2xl bg-white/70 dark:bg-gray-900/50 shadow-sm ring-1 ring-slate-200/70 dark:ring-gray-800/70 backdrop-blur px-6 sm:px-10 py-10 sm:py-14">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">Bienvenido/a</span>
        </h1>
        <p className="mt-3 sm:mt-4 text-slate-600 dark:text-gray-300 text-base sm:text-lg">
          Demo simple de turnos con Auth0 + Spring Boot.
        </p>

        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          {user ? (
            <>
              <Link
                className="inline-flex items-center justify-center rounded-md bg-slate-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2.5 text-sm sm:text-base font-semibold shadow-sm hover:opacity-90 active:opacity-80 transition w-full sm:w-auto"
                href="/appointments"
              >
                Ir a mis turnos
              </Link>
              <a
                className="inline-flex items-center justify-center rounded-md border border-slate-300/70 dark:border-gray-700 px-4 py-2.5 text-sm sm:text-base font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-800 transition w-full sm:w-auto"
                href="/auth/logout"
              >
                Cerrar sesión
              </a>
            </>
          ) : (
            <a
              className="inline-flex items-center justify-center rounded-md bg-slate-900 text-white dark:bg-white dark:text-gray-900 px-5 py-2.5 text-sm sm:text-base font-semibold shadow-sm hover:opacity-90 active:opacity-80 transition w-full sm:w-auto"
              href="/auth/login"
            >
              Ingresar con Auth0
            </a>
          )}
        </div>
      </section>
    </main>
  );
}
