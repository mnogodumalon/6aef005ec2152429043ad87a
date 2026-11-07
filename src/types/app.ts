import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
/** A raw record URL (applookup reference). NEVER render this directly
 *  in JSX — it is a URL, not a display value. Show the enriched `*Name`
 *  field or resolve it via the entity map instead. Assignable to/from
 *  string everywhere; the `& {}` keeps the alias NAME visible in tsc
 *  error messages (a plain primitive alias gets normalized away). */
export type RecordUrl = string & {};
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Umfragen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    titel?: string;
    beschreibung?: string;
    ort?: string;
    status?: LookupValue;
  };
}

export interface Terminvorschlaege {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    umfrage?: RecordUrl; // applookup -> URL zu 'Umfragen' Record
    bezeichnung?: string;
    beginn?: string; // Format: YYYY-MM-DD oder ISO String
    ende?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface Antworten {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    umfrage?: RecordUrl; // applookup -> URL zu 'Umfragen' Record
    teilnehmer_vorname?: string;
    teilnehmer_nachname?: string;
    kommentar?: string;
  };
}

export interface Terminantworten {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    antwort?: RecordUrl; // applookup -> URL zu 'Antworten' Record
    terminvorschlag?: RecordUrl; // applookup -> URL zu 'Terminvorschlaege' Record
    auswahl?: LookupValue;
  };
}

export const APP_IDS = {
  UMFRAGEN: '6aef004a72bb17ac1eda6f93',
  TERMINVORSCHLAEGE: '6aef004e428b79b8abd663c0',
  ANTWORTEN: '6aef004fa7882a6ad95a4b20',
  TERMINANTWORTEN: '6aef004f7f3a97650191887d',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'umfragen': {
    status: [{ key: "offen", get label() { return lookupLabel('umfragen', 'status', "offen") ?? "Offen"; } }, { key: "geschlossen", get label() { return lookupLabel('umfragen', 'status', "geschlossen") ?? "Geschlossen"; } }],
  },
  'terminantworten': {
    auswahl: [{ key: "zeit", get label() { return lookupLabel('terminantworten', 'auswahl', "zeit") ?? "Zeit"; } }, { key: "vielleicht", get label() { return lookupLabel('terminantworten', 'auswahl', "vielleicht") ?? "Vielleicht"; } }, { key: "keine_zeit", get label() { return lookupLabel('terminantworten', 'auswahl', "keine_zeit") ?? "Keine Zeit"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'umfragen': {
    'titel': 'string/text',
    'beschreibung': 'string/textarea',
    'ort': 'string/text',
    'status': 'lookup/radio',
  },
  'terminvorschlaege': {
    'umfrage': 'applookup/select',
    'bezeichnung': 'string/text',
    'beginn': 'date/datetimeminute',
    'ende': 'date/datetimeminute',
  },
  'antworten': {
    'umfrage': 'applookup/select',
    'teilnehmer_vorname': 'string/text',
    'teilnehmer_nachname': 'string/text',
    'kommentar': 'string/textarea',
  },
  'terminantworten': {
    'antwort': 'applookup/select',
    'terminvorschlag': 'applookup/select',
    'auswahl': 'lookup/radio',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateUmfragen = StripLookup<Umfragen['fields']>;
export type CreateTerminvorschlaege = StripLookup<Terminvorschlaege['fields']>;
export type CreateAntworten = StripLookup<Antworten['fields']>;
export type CreateTerminantworten = StripLookup<Terminantworten['fields']>;