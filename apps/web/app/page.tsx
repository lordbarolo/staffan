import { getHealth } from "./health";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const health = await getHealth();

  return (
    <main>
      <header>
        <p className="eyebrow">Staffan</p>
        <h1>Operations</h1>
        <p className="intro">Den operativa ytan är redo för nästa vertikala slice.</p>
      </header>

      <section aria-labelledby="systemstatus">
        <div>
          <p className="eyebrow">Systemstatus</p>
          <h2 id="systemstatus">Körbar ryggrad</h2>
        </div>
        <p className={health.available ? "status status-ok" : "status status-error"}>
          <span aria-hidden="true" />
          {health.available ? "API och databas är tillgängliga" : health.message}
        </p>
      </section>
    </main>
  );
}
