import React from 'react';
import { StatusChip } from './StatusChip';

interface Props {
  carrierId: string | null;
  carrierName: string | null;
  carrierColor: string | null;
  explanation: string | null;
  routingStatus: string;
  viamexUnit?: string | null;
}

export default function CarrierTag({ carrierName, carrierColor, explanation, routingStatus, viamexUnit }: Props) {
  if (routingStatus === 'alert_value') {
    return (
      <div className="tms-tooltip-wrap">
        <span className="tms-carrier-tag tms-carrier-tag--alert">⚠ ALTO VALOR</span>
        {explanation && <span className="tms-tooltip">{explanation}</span>}
      </div>
    );
  }

  if (!carrierName) {
    return <StatusChip tone="rascunho">—</StatusChip>;
  }

  const showUnit = viamexUnit && carrierName.toLowerCase().includes('viamex');

  return (
    <div className="tms-tooltip-wrap">
      <span
        className="tms-carrier-tag"
        style={{ background: carrierColor || '#6B7280' }}
      >
        <span className="tms-carrier-tag__dot" />
        {carrierName}
        {showUnit && <span className="tms-carrier-tag__unit"> · {viamexUnit}</span>}
      </span>
      {explanation && <span className="tms-tooltip">{explanation}</span>}
    </div>
  );
}
