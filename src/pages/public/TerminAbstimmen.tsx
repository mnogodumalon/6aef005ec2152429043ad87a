import { useEffect, useMemo, useState } from 'react';
import { PublicShell } from '@/components/PublicShell';
import {
  loadPublicPagesConfig,
  type PublicPagesConfig,
  type PublicPageConfig,
} from '@/lib/publicClient';
import {
  useStepForm,
  useJourneySubmit,
  useLiveList,
  fieldText,
  fieldDate,
  fieldRef,
  fieldLookup,
  recordIdOf,
  type JourneyPort,
  type JourneyRecord,
  type PlanStep,
} from '@/lib/journey';
import { createPublicPort } from '@/lib/journey/publicPort';
import { Bound } from '@/components/blocks/Bound';
import { FieldErrorSummary } from '@/components/blocks/FieldErrorSummary';
import { LoadProblem } from '@/components/blocks/LoadProblem';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { Button } from '@/components/ui/button';
import { tx } from '@/i18n';

const SLUG = 'termin-abstimmen';

type Choice = 'zeit' | 'vielleicht' | 'keine_zeit';

export default function TerminAbstimmen() {
  const [cfg, setCfg] = useState<PublicPagesConfig | null>(null);
  const [page, setPage] = useState<PublicPageConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicPagesConfig(SLUG).then(c => {
      setCfg(c);
      setPage(c?.pages[SLUG] ?? null);
      setLoading(false);
    });
  }, []);

  if (loading || !cfg || !page) {
    return <PublicShell loading={loading} unavailable={!loading} />;
  }
  return (
    <PublicShell title={page.title} description={page.description} fullBleed>
      <Poll cfg={cfg} page={page} />
    </PublicShell>
  );
}

function Poll({ cfg, page }: { cfg: PublicPagesConfig; page: PublicPageConfig }) {
  const port = useMemo(() => createPublicPort(cfg, page), [cfg, page]);
  const [umfrageId, setUmfrageId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const umfragen = useLiveList(port, 'umfragen', { intervalMs: 0 });

  if (!umfragen.loaded && umfragen.error) return <LoadProblem onRetry={umfragen.reload} />;

  const umfrage = umfragen.records.find(r => r.id === umfrageId) ?? (picking ? null : umfragen.records[0] ?? null);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
      {!umfrage ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{tx('Wähle eine Umfrage')}</h2>
          {!umfragen.loaded ? (
            <p className="text-sm text-muted-foreground">{tx('Lade Umfragen …')}</p>
          ) : umfragen.records.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tx('Aktuell ist keine Umfrage offen.')}</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {umfragen.records.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setUmfrageId(r.id);
                    setPicking(false);
                  }}
                  className="min-w-0 rounded-xl border bg-card p-4 text-left shadow-sm transition hover:border-primary"
                >
                  <div className="font-medium">{fieldText(r, 'titel')}</div>
                  {fieldText(r, 'ort') && (
                    <div className="mt-1 text-sm text-muted-foreground">{fieldText(r, 'ort')}</div>
                  )}
                  {fieldText(r, 'beschreibung') && (
                    <div className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {fieldText(r, 'beschreibung')}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <PollForm
          key={umfrage.id}
          port={port}
          umfrage={umfrage}
          onBack={() => {
            setUmfrageId(null);
            setPicking(true);
          }}
        />
      )}
    </div>
  );
}

function PollForm({
  port,
  umfrage,
  onBack,
}: {
  port: JourneyPort;
  umfrage: JourneyRecord;
  onBack: () => void;
}) {
  const termine = useLiveList(port, 'terminvorschlaege', { intervalMs: 0 });
  const antworten = useLiveList(port, 'terminantworten', { intervalMs: 0 });
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [missingChoice, setMissingChoice] = useState(false);

  const f = useStepForm('antworten', {
    fields: ['umfrage', 'teilnehmer_vorname', 'teilnehmer_nachname', 'kommentar'],
    autoComplete: true,
    initial: { umfrage: umfrage.id },
  });

  const dates = useMemo(
    () =>
      termine.records
        .filter(r => recordIdOf(fieldRef(r, 'umfrage')) === umfrage.id)
        .sort((a, b) => (fieldDate(a, 'beginn') ?? '').localeCompare(fieldDate(b, 'beginn') ?? '')),
    [termine.records, umfrage.id],
  );

  const plan: PlanStep[] = useMemo(
    () => [
      { key: 'antwort', entity: 'antworten', form: f, primary: true },
      ...dates.map((d): PlanStep => ({
        key: `ta-${d.id}`,
        entity: 'terminantworten',
        needs: ['antwort'],
        values: { terminvorschlag: d.id, auswahl: choices[d.id] ?? 'keine_zeit' },
        link: { antwort: 'antwort' },
      })),
    ],
    [f, dates, choices],
  );
  const submit = useJourneySubmit(port, plan, { draftKey: `termin-abstimmen-${umfrage.id}` });

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of antworten.records) {
      if (fieldLookup(a, 'auswahl')?.key !== 'zeit') continue;
      const id = recordIdOf(fieldRef(a, 'terminvorschlag'));
      if (id) m[id] = (m[id] ?? 0) + 1;
    }
    return m;
  }, [antworten.records]);

  if (!termine.loaded && termine.error) return <LoadProblem onRetry={termine.reload} />;

  if (submit.result) {
    return (
      <SuccessStep
        result={submit.result}
        forms={[f]}
        title={tx('Danke, deine Antwort ist gespeichert')}
        submit={submit}
        next={[{ label: tx('Zurück zur Auswahl'), onClick: onBack }]}
      />
    );
  }

  const options: { key: Choice; label: string; active: string }[] = [
    { key: 'zeit', label: tx('Zeit'), active: 'bg-emerald-500 text-white border-emerald-500' },
    { key: 'vielleicht', label: tx('Vielleicht'), active: 'bg-amber-400 text-black border-amber-400' },
    { key: 'keine_zeit', label: tx('Keine Zeit'), active: 'bg-rose-500 text-white border-rose-500' },
  ];

  const send = async () => {
    const ok = f.validate();
    const complete = dates.length > 0 && dates.every(d => choices[d.id]);
    setMissingChoice(!complete);
    if (!ok || !complete) return;
    await submit.run();
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">{fieldText(umfrage, 'titel')}</h2>
          {fieldText(umfrage, 'ort') && (
            <p className="text-sm text-muted-foreground">{fieldText(umfrage, 'ort')}</p>
          )}
          {fieldText(umfrage, 'beschreibung') && (
            <p className="mt-1 text-sm">{fieldText(umfrage, 'beschreibung')}</p>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          {tx('Andere Umfrage')}
        </Button>
      </div>

      {!termine.loaded ? (
        <p className="text-sm text-muted-foreground">{tx('Lade Terminvorschläge …')}</p>
      ) : dates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {tx('Für diese Umfrage gibt es noch keine Terminvorschläge.')}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Bound form={f} name="teilnehmer_vorname" />
            <Bound form={f} name="teilnehmer_nachname" />
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50">
                  {dates.map(d => (
                    <th key={d.id} className="min-w-[9rem] border-b px-3 py-2 text-left align-top font-medium">
                      {fieldText(d, 'bezeichnung') && <div>{fieldText(d, 'bezeichnung')}</div>}
                      <div className="text-xs font-normal text-muted-foreground">
                        {fieldText(d, 'beginn')}
                      </div>
                      <div className="text-xs font-normal text-muted-foreground">
                        {tx('bis')} {fieldText(d, 'ende')}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {dates.map(d => (
                    <td key={d.id} className="border-b px-2 py-2 align-top">
                      <div className="flex flex-col gap-1" role="group" data-key="terminvorschlag">
                        {options.map(o => (
                          <button
                            key={o.key}
                            type="button"
                            aria-pressed={choices[d.id] === o.key}
                            onClick={() => setChoices(c => ({ ...c, [d.id]: o.key }))}
                            className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
                              choices[d.id] === o.key ? o.active : 'bg-background hover:bg-muted'
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-muted/30">
                  {dates.map(d => (
                    <td key={d.id} className="px-3 py-2 text-xs text-muted-foreground">
                      {tx`${counts[d.id] ?? 0} mit Zeit`}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>

          <Bound form={f} name="kommentar" />

          <FieldErrorSummary forms={[f]} />
          {missingChoice && (
            <p className="text-sm text-destructive" role="alert">
              {tx('Bitte wähle für jeden Termin Zeit, Vielleicht oder Keine Zeit.')}
            </p>
          )}
          {submit.error && !submit.offline && (
            <p className="text-sm text-destructive" role="alert">
              {tx('Das Senden hat nicht geklappt. Bitte versuche es noch einmal.')}
            </p>
          )}
          {submit.offline && (
            <p className="text-sm text-muted-foreground">
              {tx('Keine Verbindung — deine Eingaben sind gesichert.')}
            </p>
          )}
          <Button type="button" onClick={send} disabled={submit.submitting} className="w-full sm:w-auto">
            {submit.submitting ? tx('Wird gesendet …') : tx('Antwort absenden')}
          </Button>
        </>
      )}
    </section>
  );
}
