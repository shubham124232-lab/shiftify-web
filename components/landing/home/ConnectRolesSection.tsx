import { IconPersonLine, IconGroupLine, IconDocumentSolid, IconBuildingsSolid, IconCalculatorSolid } from './PremiumIcons';
import type { SVGProps } from 'react';

interface Role {
  Icon: (p: SVGProps<SVGSVGElement>) => JSX.Element;
  title: string;
  offer: string;
  href: string;
  accent: string;
}

const roles: Role[] = [
  {
    Icon: IconBuildingsSolid,
    title: 'Provider',
    offer: 'First 10 actions free',
    href: '/register?role=PROVIDER',
    accent: 'var(--sf-ink)',
  },
  {
    Icon: IconGroupLine,
    title: 'Support Worker',
    offer: 'First 10 applications free',
    href: '/register?role=SUPPORT_WORKER',
    accent: 'var(--sf-urgent)',
  },
  {
    Icon: IconDocumentSolid,
    title: 'Support Coordinator',
    offer: 'First 10 actions free',
    href: '/register?role=COORDINATOR',
    accent: 'var(--sf-routine)',
  },
  {
    Icon: IconPersonLine,
    title: 'Participant',
    offer: 'Always free',
    href: '/register?role=PARTICIPANT',
    accent: 'var(--sf-pink)',
  },
  {
    Icon: IconCalculatorSolid,
    title: 'Plan Manager',
    offer: 'Manage NDIS funding & budgets',
    href: '/register?role=PLAN_MANAGER',
    accent: 'var(--sf-accent-grey)',
  },
];

export default function ConnectRolesSection() {
  return (
    <section id="roles" className="sf-roles" aria-label="Who Shiftify is for">
      <ul className="sf-roles-strip">
        {roles.map(({ Icon, ...role }) => (
          <li key={role.title}>
            <a
              href={role.href}
              className="sf-role"
              style={{ ['--tile-accent' as string]: role.accent }}
            >
              <span className="sf-role-plate" aria-hidden="true">
                <Icon className="sf-role-icon" />
              </span>
              <span className="sf-role-text">
                <b>{role.title}</b>
                <em>{role.offer}</em>
              </span>
              <i className="bi bi-arrow-right sf-role-arrow" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
