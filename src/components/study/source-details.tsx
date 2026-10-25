export function SourceDetails({ sourceId }: { sourceId: string }) {
  return (
    <details className="source-details">
      <summary>
        Sources & checks <span aria-hidden="true">↗</span>
      </summary>
      <div className="source-content">
        <span className="badge badge-unknown">Fictional source</span>
        <p>
          <strong>Example admissions reference</strong>
        </p>
        <p>
          This illustrates an official-source record. It is not an official page
          or evidence for a real program.
        </p>
        <dl>
          <div>
            <dt>Reference</dt>
            <dd>{sourceId}</dd>
          </div>
          <div>
            <dt>Example check date</dt>
            <dd>
              <time dateTime="2026-10-05">05 Oct 2026</time> · simulated
            </dd>
          </div>
          <div>
            <dt>Live URL</dt>
            <dd>None — fictional reference</dd>
          </div>
        </dl>
      </div>
    </details>
  );
}
