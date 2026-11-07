/**
 * Umfrage schließen — 2-Schritt-Wizard.
 * Steps: 1) Offene Umfrage auswählen → 2) Prüfen & schließen.
 * Reads: umfragen (nur Status offen). Writes: umfragen (status = geschlossen, update).
 * Composes: IntentWizardShell, EntitySelectStep, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldLookup, fieldText } from '@/lib/journey';
import { useUmfrageSchliessenFlow } from '@/lib/journey/flows/UmfrageSchliessen';
import { tx } from '@/i18n';

export default function UmfrageSchliessenPage() {
  const [step, setStep] = useState(1);
  const flow = useUmfrageSchliessenFlow({
    steps: { umfragen: 1 },
    items: {
      umfragen: r => ({
        id: r.id,
        title: fieldText(r, 'titel'),
        subtitle: fieldText(r, 'ort') || undefined,
        status: fieldLookup(r, 'status') ?? undefined,
      }),
    },
    where: {
      umfragen: r => fieldLookup(r, 'status')?.key === 'offen',
    },
  });

  return (
    <IntentWizardShell
      title={tx('Umfrage schließen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{ description: tx('Eine offene Umfrage schließen, damit keine weiteren Antworten eingehen.') }}
    >
      <WizardStep label={tx('Umfrage')} description={tx('Welche offene Umfrage soll geschlossen werden?')}>
        <EntitySelectStep
          {...flow.picks.umfragen.select}
          {...flow.pick('umfragen')}
          searchPlaceholder={tx('Titel oder Ort suchen …')}
          emptyText={tx('Es gibt aktuell keine offene Umfrage.')}
        />
      </WizardStep>
      <WizardStep label={tx('Prüfen')} description={tx('Stimmt die Umfrage? Danach nimmt sie keine Antworten mehr an.')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            confirmLabel={tx('Umfrage schließen')}
            whatHappensNext={tx('Der Status der Umfrage wechselt auf „Geschlossen“. Du kannst sie danach wieder öffnen.')}
          />
        )}
      </WizardStep>
      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          undo={flow.undo}
          title={tx('Umfrage geschlossen')}
          next={[
            { label: tx('Weitere Umfrage schließen'), onClick: () => { flow.reset(); setStep(1); } },
            { label: tx('Neue Umfrage anlegen'), href: '#/intents/umfrage-anlegen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
