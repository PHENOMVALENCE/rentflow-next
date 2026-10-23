export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
        RentFlow
      </p>
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
        Rental operations, rebuilt on Next.js.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
        The migration foundation is active. Product capabilities will be moved from the Laravel application incrementally with explicit parity validation.
      </p>
    </main>
  );
}
