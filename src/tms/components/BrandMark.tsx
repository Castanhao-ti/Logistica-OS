import React, { useState } from 'react';

export default function BrandMark() {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className="lsw-sidebar__mark">LSW</div>;
  return (
    <img
      src="/lsw-logo.png"
      alt="LSW Distribuidora"
      className="lsw-sidebar__logo-img"
      onError={() => setFailed(true)}
    />
  );
}
