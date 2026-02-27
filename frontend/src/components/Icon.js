/**
 * Icon — unified icon component that uses Heroicons (24px outline)
 * and Feather icons (via react-icons/fi) as a fallback.
 *
 * Usage:
 *   <Icon name="shield" size={24} className="text-blue-500" />
 *   <Icon name="alert-triangle" size={20} />
 */

import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  HeartIcon,
  ClipboardDocumentCheckIcon,
  EyeIcon,
  SparklesIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CpuChipIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import {
  FiActivity, FiAlertTriangle, FiShield, FiCpu, FiHelpCircle,
  FiCheckCircle, FiXCircle, FiEye, FiClipboard, FiSearch,
} from 'react-icons/fi';
import clsx from 'clsx';

// Registry: name → { heroicon, featherFallback }
const ICON_MAP = {
  shield:           { hero: ShieldCheckIcon,             feather: FiShield },
  'alert-triangle': { hero: ExclamationTriangleIcon,     feather: FiAlertTriangle },
  beaker:           { hero: BeakerIcon,                  feather: FiActivity },
  heart:            { hero: HeartIcon,                   feather: FiActivity },
  clipboard:        { hero: ClipboardDocumentCheckIcon,  feather: FiClipboard },
  eye:              { hero: EyeIcon,                     feather: FiEye },
  sparkles:         { hero: SparklesIcon,                feather: FiCpu },
  info:             { hero: InformationCircleIcon,       feather: FiHelpCircle },
  check:            { hero: CheckCircleIcon,             feather: FiCheckCircle },
  'x-circle':       { hero: XCircleIcon,                feather: FiXCircle },
  refresh:          { hero: ArrowPathIcon,               feather: FiActivity },
  cpu:              { hero: CpuChipIcon,                 feather: FiCpu },
  search:           { hero: DocumentMagnifyingGlassIcon, feather: FiSearch },
};

/**
 * @param {object} props
 * @param {'shield'|'alert-triangle'|'beaker'|'heart'|'clipboard'|'eye'|'sparkles'|'info'|'check'|'x-circle'|'refresh'|'cpu'|'search'} props.name
 * @param {number} [props.size=24]
 * @param {string} [props.className]
 * @param {'heroicon'|'feather'} [props.source='heroicon']
 */
export default function Icon({ name, size = 24, className = '', source = 'heroicon' }) {
  const entry = ICON_MAP[name];
  if (!entry) {
    // Unknown icon — render a placeholder circle
    return (
      <span
        className={clsx('inline-block rounded-full bg-gray-200', className)}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  if (source === 'feather' || !entry.hero) {
    const FeatherIcon = entry.feather;
    return <FeatherIcon size={size} className={className} strokeWidth={2} />;
  }

  const HeroIcon = entry.hero;
  return (
    <HeroIcon
      className={clsx(className)}
      style={{ width: size, height: size, strokeWidth: 2 }}
      aria-hidden="true"
    />
  );
}
