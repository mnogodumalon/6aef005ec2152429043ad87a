import type { Antworten, Terminantworten, Terminvorschlaege } from './app';

export type EnrichedTerminvorschlaege = Terminvorschlaege & {
  umfrageName: string;
};

export type EnrichedAntworten = Antworten & {
  umfrageName: string;
};

export type EnrichedTerminantworten = Terminantworten & {
  antwortName: string;
  terminvorschlagName: string;
};
