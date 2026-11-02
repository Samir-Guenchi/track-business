import type { ComponentProps } from 'react';
import { Link } from '../../i18n/navigation';

/** A text link in the brand green, used under and inside the auth cards. */
export function AuthLink(props: ComponentProps<typeof Link>) {
  return <Link {...props} className="font-medium text-tape underline" />;
}
