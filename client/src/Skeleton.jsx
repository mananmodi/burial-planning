import React from 'react';

// One calm, centred loader for every loading state. It stays invisible for the first moment
// (CSS delay), so fast loads never flash anything, then fades in.
export function Loader({ label = 'Loading', fill = true }) {
  return (
    <div className={'loader' + (fill ? ' loader-fill' : '')} role="status" aria-busy="true" aria-label={label}>
      <div className="loader-ring"><span /><img src="/favicon.png" alt="" /></div>
    </div>
  );
}

export const PageSkeleton = () => <Loader label="Loading page" />;
export const PlanSkeleton = () => <Loader label="Loading your planning steps" />;
export const FullSkeleton = () => <Loader />;
