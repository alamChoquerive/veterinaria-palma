export default function CheckoutExitoLoading() {
  return (
    <main className="max-w-2xl mx-auto py-10 px-4 text-center">
      <div
        className="w-16 h-16 rounded-full bg-muted border border-border flex items-center justify-center mx-auto mb-6 text-3xl text-muted-foreground"
        aria-hidden="true"
      >
        …
      </div>
      <h1 className="text-2xl font-bold mb-2">Verificando tu pago…</h1>
      <p className="text-muted-foreground">
        Estamos consultando el estado del pago con Mercado Pago.
      </p>
    </main>
  );
}
