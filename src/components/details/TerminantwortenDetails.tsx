import type { Terminantworten, Antworten, Terminvorschlaege } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export interface TerminantwortenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Terminantworten;
  /** N:1-Ziel „Antworten": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  antwortenList: Antworten[];
  /** Klick auf die Antworten-Relation → overlay.push auf dessen Detail. */
  onOpenAntworten?: (record: Antworten) => void;
  /** N:1-Ziel „Terminvorschlaege": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  terminvorschlaegeList: Terminvorschlaege[];
  /** Klick auf die Terminvorschlaege-Relation → overlay.push auf dessen Detail. */
  onOpenTerminvorschlaege?: (record: Terminvorschlaege) => void;
}

export function TerminantwortenDetails({
  record,
  antwortenList,
  onOpenAntworten,
  terminvorschlaegeList,
  onOpenTerminvorschlaege,
}: TerminantwortenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const antwortTarget = antwortenList.find(r => r.record_id === extractRecordId(record.fields.antwort));
  const terminvorschlagTarget = terminvorschlaegeList.find(r => r.record_id === extractRecordId(record.fields.terminvorschlag));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('terminantworten', 'auswahl')} value={record.fields.auswahl} format="pill" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('terminantworten', 'antwort')}
          name={antwortTarget?.fields.teilnehmer_vorname ?? '—'}
          meta={[antwortTarget?.fields.teilnehmer_nachname].filter(Boolean).join(' · ') || undefined}
          onClick={antwortTarget && onOpenAntworten ? () => onOpenAntworten!(antwortTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('terminantworten', 'terminvorschlag')}
          name={terminvorschlagTarget?.fields.bezeichnung ?? '—'}
          meta={undefined}
          onClick={terminvorschlagTarget && onOpenTerminvorschlaege ? () => onOpenTerminvorschlaege!(terminvorschlagTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.TERMINANTWORTEN} recordId={record.record_id} readOnly={!perms.canWrite('terminantworten')} />
    </>
  );
}
