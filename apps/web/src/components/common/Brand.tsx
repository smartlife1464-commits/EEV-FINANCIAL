import React from 'react';
import { Church } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

/** Nom de l'église (configuration de la plateforme) */
export const BrandName: React.FC<{ upper?: boolean; short?: boolean }> = ({ upper, short }) => {
  const { platform } = usePlatform();
  const name = (short && platform.shortName) || platform.name;
  return <>{upper ? name.toLocaleUpperCase('fr-FR') : name}</>;
};

/** Logo de l'église, ou pictogramme par défaut si aucun logo n'est configuré */
export const BrandLogo: React.FC<{ className?: string }> = ({ className = 'w-full h-full object-contain' }) => {
  const { platform } = usePlatform();
  if (platform.logo) return <img src={platform.logo} alt={`Logo ${platform.name}`} className={className} />;
  return <Church className={`${className} text-amber-500`} aria-label={platform.name} />;
};
