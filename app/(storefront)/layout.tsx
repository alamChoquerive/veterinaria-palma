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
  // muestra "Iniciar sesión / Registrarse" sin sesión y "Mi cuenta / Cerrar
  // sesión" con sesión, sin setState en effects.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar userEmail={user?.email ?? null} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </CartProvider>
  );
}
