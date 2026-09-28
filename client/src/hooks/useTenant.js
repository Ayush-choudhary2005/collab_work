import { useContext } from 'react';
import { TenantContext } from '../context/TenantContext';

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used inside <TenantProvider>');
  return ctx;
}
