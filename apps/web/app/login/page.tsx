import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-heading">
        <p className="eyebrow">Staffan Operations</p>
        <h1 id="login-heading">Logga in</h1>
        <p className="intro">Endast den konfigurerade operatören har åtkomst till avropsunderlag.</p>
        {error === undefined ? null : <p className="notice notice-error">{error}</p>}
        <form action={login}>
          <label>Användarnamn<input name="username" autoComplete="username" required /></label>
          <label>Lösenord<input name="password" type="password" autoComplete="current-password" required /></label>
          <button type="submit">Logga in</button>
        </form>
      </section>
    </main>
  );
}
