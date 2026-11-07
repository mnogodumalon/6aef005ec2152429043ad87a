import type { EnrichedAntworten, EnrichedTerminantworten, EnrichedTerminvorschlaege } from '@/types/enriched';
import type { Antworten, Terminantworten, Terminvorschlaege, Umfragen } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface TerminvorschlaegeMaps {
  umfragenMap: Map<string, Umfragen>;
}

export function enrichTerminvorschlaege(
  terminvorschlaege: Terminvorschlaege[],
  maps: TerminvorschlaegeMaps
): EnrichedTerminvorschlaege[] {
  return terminvorschlaege.map(r => ({
    ...r,
    umfrageName: resolveDisplay(r.fields.umfrage, maps.umfragenMap, 'titel'),
  }));
}

interface AntwortenMaps {
  umfragenMap: Map<string, Umfragen>;
}

export function enrichAntworten(
  antworten: Antworten[],
  maps: AntwortenMaps
): EnrichedAntworten[] {
  return antworten.map(r => ({
    ...r,
    umfrageName: resolveDisplay(r.fields.umfrage, maps.umfragenMap, 'titel'),
  }));
}

interface TerminantwortenMaps {
  antwortenMap: Map<string, Antworten>;
  terminvorschlaegeMap: Map<string, Terminvorschlaege>;
}

export function enrichTerminantworten(
  terminantworten: Terminantworten[],
  maps: TerminantwortenMaps
): EnrichedTerminantworten[] {
  return terminantworten.map(r => ({
    ...r,
    antwortName: resolveDisplay(r.fields.antwort, maps.antwortenMap, 'teilnehmer_vorname'),
    terminvorschlagName: resolveDisplay(r.fields.terminvorschlag, maps.terminvorschlaegeMap, 'bezeichnung'),
  }));
}
