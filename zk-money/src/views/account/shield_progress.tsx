import React from 'react';
import { formatValueString, ShieldForm, ShieldStatus } from '../../app';
import { Theme } from '../../styles';
import { AssetInfoRow } from './asset_info_row';
import { ProgressTemplate } from './progress_template';

interface ShieldProgressProps {
  theme: Theme;
  form: ShieldForm;
  onGoBack(): void;
  onSubmit(): void;
  onClose(): void;
}

export const ShieldProgress: React.FunctionComponent<ShieldProgressProps> = ({
  theme,
  form,
  onGoBack,
  onSubmit,
  onClose,
}) => {
  const { amount, fee, recipient, status, submit } = form;
  const asset = form.asset.value;

  const items = [
    {
      title: 'Amount',
      content: <AssetInfoRow asset={asset} value={formatValueString(amount.value)} />,
    },
    {
      title: 'Fee',
      content: <AssetInfoRow asset={asset} value={formatValueString(fee.value)} />,
    },
    {
      title: 'Recipient',
      content: `@${recipient.value}`,
    },
  ];

  const steps = [
    {
      status: ShieldStatus.DEPOSIT,
      text: `Deposit ${asset.symbol}`,
    },
    {
      status: ShieldStatus.CREATE_PROOF,
      text: 'Create Proof',
    },
    {
      status: ShieldStatus.APPROVE_PROOF,
      text: 'Approve Proof',
    },
    {
      status: ShieldStatus.SEND_PROOF,
      text: 'Send Private Transaction',
    },
  ];

  return (
    <ProgressTemplate
      theme={theme}
      action="Shield"
      items={items}
      steps={steps}
      form={form}
      currentStatus={status.value}
      confirmStatus={ShieldStatus.CONFIRM}
      doneStatus={ShieldStatus.DONE}
      message={submit.message}
      messageType={submit.messageType}
      onGoBack={onGoBack}
      onSubmit={onSubmit}
      onClose={onClose}
    />
  );
};