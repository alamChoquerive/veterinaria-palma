export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center py-20">
      <h1 className="text-3xl font-semibold mb-4">Veterinaria Palma</h1>
      <p className="mb-8">Tu tienda para mascotas y turnos veterinarios online.</p>
      <a href="/catalogo" className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
        Ir al catálogo
      </a>
    </main>
  );
}
