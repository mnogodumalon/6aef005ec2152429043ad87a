import type { Umfragen, Terminvorschlaege, Antworten } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface UmfragenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Umfragen;
  /** 1:N „Terminvorschläge" (umfrage): VOLLE Liste — der Block filtert auf diesen Record. */
  terminvorschlaegeList: Terminvorschlaege[];
  /** Zeilen-Klick → overlay.push auf das Terminvorschlaege-Detail (nie der Edit-Dialog). */
  onOpenTerminvorschlaege: (record: Terminvorschlaege) => void;
  /** Kontextuelles „+": öffnet den Terminvorschlaege-Dialog mit diesem Record vorgesetzt. */
  onAddTerminvorschlaege?: () => void;
  /** 1:N „Antworten" (umfrage): VOLLE Liste — der Block filtert auf diesen Record. */
  antwortenList: Antworten[];
  /** Zeilen-Klick → overlay.push auf das Antworten-Detail (nie der Edit-Dialog). */
  onOpenAntworten: (record: Antworten) => void;
  /** Kontextuelles „+": öffnet den Antworten-Dialog mit diesem Record vorgesetzt. */
  onAddAntworten?: () => void;
}

export function UmfragenDetails({
  record,
  terminvorschlaegeList,
  onOpenTerminvorschlaege,
  onAddTerminvorschlaege,
  antwortenList,
  onOpenAntworten,
  onAddAntworten,
}: UmfragenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('umfragen', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('umfragen', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('umfragen', 'ort')} value={record.fields.ort} format="text" />
        <RecordField label={fieldLabel('umfragen', 'status')} value={record.fields.status} format="pill" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('terminvorschlaege')}
        items={terminvorschlaegeList.filter(r => extractRecordId(r.fields.umfrage) === record.record_id)}
        map={r => ({ name: r.fields.bezeichnung ?? appLabel('terminvorschlaege'), meta: r.fields.beginn })}
        onOpen={onOpenTerminvorschlaege}
        onAdd={onAddTerminvorschlaege}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('antworten')}
        items={antwortenList.filter(r => extractRecordId(r.fields.umfrage) === record.record_id)}
        map={r => ({ name: r.fields.teilnehmer_vorname ?? appLabel('antworten'), meta: undefined })}
        onOpen={onOpenAntworten}
        onAdd={onAddAntworten}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.UMFRAGEN} recordId={record.record_id} readOnly={!perms.canWrite('umfragen')} />
    </>
  );
}
