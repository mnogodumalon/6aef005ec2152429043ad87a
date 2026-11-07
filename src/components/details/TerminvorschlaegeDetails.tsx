import type { Terminvorschlaege, Umfragen, Terminantworten } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface TerminvorschlaegeDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Terminvorschlaege;
  /** N:1-Ziel „Umfragen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  umfragenList: Umfragen[];
  /** Klick auf die Umfragen-Relation → overlay.push auf dessen Detail. */
  onOpenUmfragen?: (record: Umfragen) => void;
  /** 1:N „Terminantworten" (terminvorschlag): VOLLE Liste — der Block filtert auf diesen Record. */
  terminantwortenList: Terminantworten[];
  /** Zeilen-Klick → overlay.push auf das Terminantworten-Detail (nie der Edit-Dialog). */
  onOpenTerminantworten: (record: Terminantworten) => void;
  /** Kontextuelles „+": öffnet den Terminantworten-Dialog mit diesem Record vorgesetzt. */
  onAddTerminantworten?: () => void;
}

export function TerminvorschlaegeDetails({
  record,
  umfragenList,
  onOpenUmfragen,
  terminantwortenList,
  onOpenTerminantworten,
  onAddTerminantworten,
}: TerminvorschlaegeDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const umfrageTarget = umfragenList.find(r => r.record_id === extractRecordId(record.fields.umfrage));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('terminvorschlaege', 'bezeichnung')} value={record.fields.bezeichnung} format="text" />
        <RecordField label={fieldLabel('terminvorschlaege', 'beginn')} value={record.fields.beginn} format="datetime" />
        <RecordField label={fieldLabel('terminvorschlaege', 'ende')} value={record.fields.ende} format="datetime" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('terminvorschlaege', 'umfrage')}
          name={umfrageTarget?.fields.titel ?? '—'}
          meta={[umfrageTarget?.fields.ort].filter(Boolean).join(' · ') || undefined}
          onClick={umfrageTarget && onOpenUmfragen ? () => onOpenUmfragen!(umfrageTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('terminantworten')}
        items={terminantwortenList.filter(r => extractRecordId(r.fields.terminvorschlag) === record.record_id)}
        map={() => ({ name: appLabel('terminantworten'), meta: undefined })}
        onOpen={onOpenTerminantworten}
        onAdd={onAddTerminantworten}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.TERMINVORSCHLAEGE} recordId={record.record_id} readOnly={!perms.canWrite('terminvorschlaege')} />
    </>
  );
}
