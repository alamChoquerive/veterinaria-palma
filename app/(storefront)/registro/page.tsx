import { redirect } from "next/navigation";

/**
 * /registro redirige a /login?modo=registro: el único formulario de
 * registro es la pestaña "Crear cuenta" del AuthModal.
 */
export default function RegistroPage() {
  redirect("/login?modo=registro");
}
