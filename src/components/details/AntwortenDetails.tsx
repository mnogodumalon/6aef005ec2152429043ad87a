import type { Antworten, Umfragen, Terminantworten } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface AntwortenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Antworten;
  /** N:1-Ziel „Umfragen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  umfragenList: Umfragen[];
  /** Klick auf die Umfragen-Relation → overlay.push auf dessen Detail. */
  onOpenUmfragen?: (record: Umfragen) => void;
  /** 1:N „Terminantworten" (antwort): VOLLE Liste — der Block filtert auf diesen Record. */
  terminantwortenList: Terminantworten[];
  /** Zeilen-Klick → overlay.push auf das Terminantworten-Detail (nie der Edit-Dialog). */
  onOpenTerminantworten: (record: Terminantworten) => void;
  /** Kontextuelles „+": öffnet den Terminantworten-Dialog mit diesem Record vorgesetzt. */
  onAddTerminantworten?: () => void;
}

export function AntwortenDetails({
  record,
  umfragenList,
  onOpenUmfragen,
  terminantwortenList,
  onOpenTerminantworten,
  onAddTerminantworten,
}: AntwortenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const umfrageTarget = umfragenList.find(r => r.record_id === extractRecordId(record.fields.umfrage));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('antworten', 'teilnehmer_vorname')} value={record.fields.teilnehmer_vorname} format="text" />
        <RecordField label={fieldLabel('antworten', 'teilnehmer_nachname')} value={record.fields.teilnehmer_nachname} format="text" />
        <RecordField label={fieldLabel('antworten', 'kommentar')} value={record.fields.kommentar} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('antworten', 'umfrage')}
          name={umfrageTarget?.fields.titel ?? '—'}
          meta={[umfrageTarget?.fields.ort].filter(Boolean).join(' · ') || undefined}
          onClick={umfrageTarget && onOpenUmfragen ? () => onOpenUmfragen!(umfrageTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('terminantworten')}
        items={terminantwortenList.filter(r => extractRecordId(r.fields.antwort) === record.record_id)}
        map={() => ({ name: appLabel('terminantworten'), meta: undefined })}
        onOpen={onOpenTerminantworten}
        onAdd={onAddTerminantworten}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.ANTWORTEN} recordId={record.record_id} readOnly={!perms.canWrite('antworten')} />
    </>
  );
}
