import { useTranslation } from 'react-i18next';

import { InfoSheet } from '@/components/InfoSheet';
import { openStoreReview } from '@/src/shared/storeLinks';
import { useTrakl } from '@/src/application/store';

/** Soft rate sheet after habit/task success. */
export function SoftRatePromptSheet() {
  const { t } = useTranslation();
  const pending = useTrakl((s) => s.ratePromptPending);
  const dismissRatePrompt = useTrakl((s) => s.dismissRatePrompt);

  return (
    <InfoSheet
      visible={pending}
      title={t('ratePrompt.title')}
      body={t('ratePrompt.body')}
      onClose={() => dismissRatePrompt()}
      actions={[
        {
          label: t('ratePrompt.rate'),
          variant: 'primary',
          onPress: () => {
            dismissRatePrompt();
            void openStoreReview();
          },
        },
        {
          label: t('ratePrompt.later'),
          variant: 'plain',
          onPress: () => dismissRatePrompt(),
        },
        {
          label: t('ratePrompt.never'),
          variant: 'plain',
          onPress: () => dismissRatePrompt({ never: true }),
        },
      ]}
    />
  );
}
