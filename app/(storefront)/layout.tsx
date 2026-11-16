import { Navbar } from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { CartProvider } from "@/components/carrito/cart-context";
import { createClient } from "@/core/supabase/server";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // La sesión se lee en el server y se pasa como prop: el Navbar (client)
  // muestra "Iniciar sesión / Registrarse" sin sesión y el ícono de cuenta
  // con sesión (apuntando al panel del rol si es admin/empleado), sin setState
  // en effects.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rol del perfil propio (RLS permite leerlo) para decidir el destino del
  // ícono de cuenta: staff → su panel, cliente → /cuenta
  let rol: string | null = null;
  if (user) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .maybeSingle();
    rol = perfil?.rol ?? null;
  }

  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar userEmail={user?.email ?? null} userRol={rol} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </CartProvider>
  );
}
