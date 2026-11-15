import { esRedirectInterno } from "@/lib/redirect";
import { LoginPageModal } from "@/components/auth/login-page-modal";
import type { AuthTab } from "@/components/auth/auth-modal";

/**
 * /login queda como URL delgada que monta el AuthModal: el modal es el
 * único formulario de login/registro del sitio.
 *
 * La URL /login SE MANTIENE porque de ella dependen la seguridad existente:
 * el proxy manda acá (?redirect=...) al entrar sin sesión a rutas
 * protegidas (/cuenta, /admin, /empleado), logoutAction vuelve acá, y los
 * layouts de admin/empleado mandan ?error=... cuando el rol no alcanza.
 *
 * ?redirect se valida como ruta interna (anti open redirect) y "/" cuenta
 * como "sin redirect pedido". ?modo=registro abre la pestaña de registro.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const redirectRaw = Array.isArray(sp["redirect"])
    ? sp["redirect"][0]
    : sp["redirect"];
  const redirectDestino =
    esRedirectInterno(redirectRaw) && redirectRaw !== "/" ? redirectRaw : null;
  const errorRaw = Array.isArray(sp["error"]) ? sp["error"][0] : sp["error"];
  const tabInicial: AuthTab = sp["modo"] === "registro" ? "registro" : "login";

  return (
    <main className="flex items-center justify-center py-20 px-4 min-h-[60vh]">
      <LoginPageModal
        redirectDestino={redirectDestino}
        errorInicial={typeof errorRaw === "string" ? errorRaw : null}
        tabInicial={tabInicial}
      />
    </main>
  );
}
