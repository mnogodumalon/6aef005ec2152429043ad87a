import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { IconPlus, IconCheck, IconQuestionMark, IconX, IconCircleCheck, IconLock, IconLink, IconUsers } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { flowActionFor, countOf } from '@/config/plan';
import { extractRecordId } from '@/services/livingAppsService';
import { lookupKey } from '@/lib/formatters';
import { tx, appLabel, dateFnsLocale } from '@/i18n';
import { gruss, namen, useClock } from '@/lib/polish';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { WorkList } from '@/components/WorkList';
import { Button } from '@/components/ui/button';
import { PublicPageQr, usePublicPageLink } from '@/components/widgets/PublicPageQr';

type Filter = 'all' | 'open' | 'empty';

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const { umfragen, terminvorschlaege, antworten, terminantworten } = data;
  const clock = useClock();
  const [filter, setFilter] = useState<Filter>('open');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type !== 'umfragen' || lookupKey(top.record.fields.status) !== 'offen') return undefined;
      const go = flowActionFor('umfragen', 'status', top.record.record_id, 'geschlossen');
      return go ? { label: tx('Umfrage schließen'), onClick: go } : undefined;
    },
  });

  const stats = useMemo(() => {
    const termineBy = new Map<string, typeof terminvorschlaege>();
    for (const t of terminvorschlaege) {
      const id = extractRecordId(t.fields.umfrage);
      if (!id) continue;
      termineBy.set(id, [...(termineBy.get(id) ?? []), t]);
    }
    const antwortenBy = new Map<string, typeof antworten>();
    for (const a of antworten) {
      const id = extractRecordId(a.fields.umfrage);
      if (!id) continue;
      antwortenBy.set(id, [...(antwortenBy.get(id) ?? []), a]);
    }
    return { termineBy, antwortenBy };
  }, [terminvorschlaege, antworten]);

  const isOpen = (u: (typeof umfragen)[number]) => lookupKey(u.fields.status) === 'offen';
  const countAnswers = (id: string) => stats.antwortenBy.get(id)?.length ?? 0;
  const offene = umfragen.filter(isOpen);
  const ohneAntworten = offene.filter(u => countAnswers(u.record_id) === 0);
  const listed = umfragen.filter(u => filter === 'open' ? isOpen(u) : filter === 'empty' ? isOpen(u) && countAnswers(u.record_id) === 0 : true);

  const selected = umfragen.find(u => u.record_id === selectedId) ?? listed[0] ?? offene[0] ?? umfragen[0] ?? null;
  const selId = selected?.record_id ?? null;
  const { link } = usePublicPageLink('umfragen', selId);

  const termine = useMemo(
    () => [...(selId ? stats.termineBy.get(selId) ?? [] : [])].sort((a, b) => (a.fields.beginn ?? '').localeCompare(b.fields.beginn ?? '')),
    [stats, selId],
  );
  const teilnehmer = selId ? stats.antwortenBy.get(selId) ?? [] : [];

  // (antwortId|terminId) → Auswahl-Key
  const cells = useMemo(() => {
    const m = new Map<string, string>();
    for (const ta of terminantworten) {
      const a = extractRecordId(ta.fields.antwort);
      const t = extractRecordId(ta.fields.terminvorschlag);
      const k = lookupKey(ta.fields.auswahl);
      if (a && t && k) m.set(`${a}|${t}`, k);
    }
    return m;
  }, [terminantworten]);

  const tally = termine.map(t => {
    let zeit = 0, vielleicht = 0;
    const names: string[] = [];
    for (const a of teilnehmer) {
      const k = cells.get(`${a.record_id}|${t.record_id}`);
      if (k === 'zeit') { zeit++; names.push(a.fields.teilnehmer_vorname ?? ''); }
      else if (k === 'vielleicht') vielleicht++;
    }
    return { t, zeit, vielleicht, names };
  });
  const best = tally.reduce<(typeof tally)[number] | null>((b, x) => (x.zeit > 0 && (!b || x.zeit > b.zeit) ? x : b), null);

  const fmtTermin = (iso?: string | null) => (iso ? format(parseISO(iso), 'EEE dd.MM.', { locale: dateFnsLocale() }) : '—');
  const fmtZeit = (a?: string | null, b?: string | null) =>
    a ? `${format(parseISO(a), 'HH:mm')}${b ? `–${format(parseISO(b), 'HH:mm')}` : ''}` : '';
  const personName = (a: (typeof antworten)[number]) => `${a.fields.teilnehmer_vorname ?? ''} ${a.fields.teilnehmer_nachname ?? ''}`.trim();

  const CellIcon = ({ k }: { k?: string }) =>
    k === 'zeit' ? <IconCheck size={18} className="mx-auto text-emerald-600" stroke={2.5} />
    : k === 'vielleicht' ? <IconQuestionMark size={18} className="mx-auto text-amber-500" stroke={2.5} />
    : k === 'keine_zeit' ? <IconX size={18} className="mx-auto text-muted-foreground" />
    : <span className="text-muted-foreground">·</span>;

  const letzte = [...antworten].reverse()[0];
  const context = (() => {
    if (umfragen.length === 0) return tx('Lege deine erste Umfrage an und teile den Link.');
    if (best && selected) return tx`In „${selected.fields.titel ?? ''}“ passt ${fmtTermin(best.t.fields.beginn)} am besten — ${namen(best.names)} haben Zeit.`;
    if (ohneAntworten.length > 0) return tx`${namen(ohneAntworten.map(u => u.fields.titel ?? ''))} wartet noch auf die erste Antwort.`;
    if (letzte) return tx`Zuletzt hat ${personName(letzte)} abgestimmt.`;
    return tx('Alles ruhig — keine offenen Rückmeldungen.');
  })();

  const closeFlow = (id: string) => flowActionFor('umfragen', 'status', id, 'geschlossen');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{context}</p>
        </div>
        {crud.umfragen.canWrite && (
          <Button onClick={() => crud.umfragen.openCreate({ status: 'offen' })}>
            <IconPlus size={16} className="shrink-0" /> {tx('Neue Umfrage')}
          </Button>
        )}
      </div>

      <DashboardGrid
        variant="wide"
        hero={umfragen.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-[27px] bg-card p-8 text-center shadow-lg">
            <IconUsers size={48} className="text-muted-foreground" />
            <p className="max-w-md text-sm text-muted-foreground">{tx('Noch keine Umfrage. Lege Terminvorschläge an und teile den Link — Teilnehmer stimmen ohne Login ab.')}</p>
            {crud.umfragen.canWrite && <Button onClick={() => crud.umfragen.openCreate({ status: 'offen' })}>{tx('Erste Umfrage anlegen')}</Button>}
          </div>
        )}
        kpis={umfragen.length > 0 ? (
          <StatStrip>
            <StatStripItem
              title={tx('Offene Umfragen')} value={offene.length}
              icon={<IconCircleCheck size={16} className="text-muted-foreground" />}
              onClick={() => setFilter(f => f === 'open' ? 'all' : 'open')} active={filter === 'open'}
            />
            <StatStripItem
              title={tx('Ohne Antworten')} value={ohneAntworten.length}
              tone={ohneAntworten.length > 0 ? 'warning' : 'default'}
              onClick={() => setFilter(f => f === 'empty' ? 'all' : 'empty')} active={filter === 'empty'}
            />
            <StatStripItem
              title={tx('Beste Zeit')} value={best ? `${best.zeit}/${teilnehmer.length}` : tx('noch offen')}
              tone={best ? 'success' : 'default'}
              icon={<IconUsers size={16} className="text-muted-foreground" />}
            />
          </StatStrip>
        ) : undefined}
        primary={selected ? (
          <section className="overflow-hidden rounded-[27px] bg-card shadow-lg">
            {/* TODO(widget-gap): no widget covers a Teilnehmer × Termin matrix — hand-built on purpose (rejected: CalendarWidget, lacks per-participant answer columns) */}
            <div className="space-y-3 border-b p-4">
              <div className="flex flex-wrap gap-2">
                {(listed.length > 0 ? listed : [selected]).map(u => (
                  <button
                    key={u.record_id}
                    onClick={() => setSelectedId(u.record_id)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${u.record_id === selId ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}
                  >
                    {!isOpen(u) && <IconLock size={12} className="shrink-0" />}
                    <span className="max-w-[16rem] truncate">{u.fields.titel}</span>
                    <span className="opacity-70">{countAnswers(u.record_id)}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">{selected.fields.titel}</h2>
                  <p className="text-sm text-muted-foreground">
                    {countOf('antworten', teilnehmer.length, appLabel('antworten'))} · {countOf('terminvorschlaege', termine.length, appLabel('terminvorschlaege'))}
                    {selected.fields.ort ? ` · ${selected.fields.ort}` : ''}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => crud.umfragen.openDetail(selected)}>{tx('Details')}</Button>
              </div>
            </div>

            {termine.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {tx('Noch keine Terminvorschläge.')}
                {crud.terminvorschlaege.canWrite && (
                  <div className="mt-3"><Button size="sm" onClick={() => crud.terminvorschlaege.openCreate({ umfrage: selected.record_id })}>{tx('Termin hinzufügen')}</Button></div>
                )}
              </div>
            ) : (
              <>
                {/* Desktop: Termine als Spalten */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="p-3 text-left font-medium text-muted-foreground">{tx('Teilnehmer')}</th>
                        {termine.map(t => (
                          <th key={t.record_id} className="min-w-[110px] p-0 text-center font-medium">
                            <button className="w-full p-3 hover:bg-accent" onClick={() => crud.terminvorschlaege.openDetail(t)}>
                              <div>{fmtTermin(t.fields.beginn)}</div>
                              <div className="text-xs font-normal text-muted-foreground">{fmtZeit(t.fields.beginn, t.fields.ende)}</div>
                              {t.fields.bezeichnung && <div className="truncate text-xs font-normal text-muted-foreground">{t.fields.bezeichnung}</div>}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {teilnehmer.map(a => (
                        <tr key={a.record_id} className="border-b">
                          <td className="p-0">
                            <button className="w-full p-3 text-left font-medium hover:bg-accent" onClick={() => crud.antworten.openDetail(a)}>
                              {personName(a)}
                              {a.fields.kommentar && <span className="block max-w-[16rem] truncate text-xs font-normal text-muted-foreground">{a.fields.kommentar}</span>}
                            </button>
                          </td>
                          {termine.map(t => (
                            <td key={t.record_id} className="p-3 text-center"><CellIcon k={cells.get(`${a.record_id}|${t.record_id}`)} /></td>
                          ))}
                        </tr>
                      ))}
                      {teilnehmer.length === 0 && (
                        <tr><td colSpan={termine.length + 1} className="p-6 text-center text-muted-foreground">{tx('Noch niemand hat abgestimmt.')}</td></tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/40">
                        <td className="p-3 font-medium">{tx('Personen mit Zeit')}</td>
                        {tally.map(x => (
                          <td key={x.t.record_id} className={`p-3 text-center ${best?.t.record_id === x.t.record_id ? 'font-semibold text-emerald-700' : ''}`}>
                            <div className="text-lg">{x.zeit}</div>
                            {x.vielleicht > 0 && <div className="text-xs font-normal text-amber-600">{tx`+${x.vielleicht} vielleicht`}</div>}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {/* Mobil: eine Karte je Termin */}
                <ul className="divide-y md:hidden">
                  {tally.map(x => (
                    <li key={x.t.record_id}>
                      <button className="flex w-full items-center justify-between gap-3 p-3 text-left" onClick={() => crud.terminvorschlaege.openDetail(x.t)}>
                        <div className="min-w-0">
                          <div className="font-medium">{fmtTermin(x.t.fields.beginn)} <span className="font-normal text-muted-foreground">{fmtZeit(x.t.fields.beginn, x.t.fields.ende)}</span></div>
                          <div className="truncate text-xs text-muted-foreground">{x.names.length > 0 ? namen(x.names, 6) : tx('Noch niemand')}</div>
                        </div>
                        <div className={`shrink-0 text-right ${best?.t.record_id === x.t.record_id ? 'font-semibold text-emerald-700' : ''}`}>
                          <div className="text-lg">{x.zeit}</div>
                          {x.vielleicht > 0 && <div className="text-xs text-amber-600">{tx`+${x.vielleicht} vielleicht`}</div>}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        ) : <></>}
        aside={umfragen.length > 0 ? (
          <>
            <section className="overflow-hidden rounded-[27px] bg-card p-5 shadow-lg">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <IconLink size={16} className="shrink-0" /> {tx('Link & QR-Code zur Abstimmung')}
              </h2>
              <p className="mt-1 truncate text-sm">{selected?.fields.titel}</p>
              <div className="mt-4 flex flex-col items-center gap-3">
                <PublicPageQr entity="umfragen" recordId={selId} size={170} showLink={false} />
                {link && (
                  <>
                    <p className="w-full break-all text-center text-xs text-muted-foreground">{link}</p>
                    <Button variant="outline" size="sm" onClick={() => void navigator.clipboard?.writeText(link)}>{tx('Link kopieren')}</Button>
                  </>
                )}
              </div>
            </section>
            <WorkList
              title={tx('Offene Umfragen')}
              items={offene.map(u => {
                const go = closeFlow(u.record_id);
                const n = countAnswers(u.record_id);
                return {
                  id: u.record_id,
                  title: u.fields.titel ?? '',
                  secondLine: <>
                    <span className={n === 0 ? 'font-medium text-amber-600' : 'font-medium'}>{countOf('antworten', n, appLabel('antworten'))}</span>
                    <span className="text-muted-foreground"> · {countOf('terminvorschlaege', stats.termineBy.get(u.record_id)?.length ?? 0, appLabel('terminvorschlaege'))}</span>
                  </>,
                  action: go ? { label: tx('Schließen'), onClick: go } : undefined,
                };
              })}
              onItemClick={id => { const u = umfragen.find(x => x.record_id === id); if (u) crud.umfragen.openDetail(u); }}
              empty={{ text: tx('Keine offene Umfrage.'), action: crud.umfragen.canWrite ? { label: tx('Neue Umfrage'), onClick: () => crud.umfragen.openCreate({ status: 'offen' }) } : undefined }}
            />
          </>
        ) : undefined}
      />
      {crud.surfaces}
    </div>
  );
}
