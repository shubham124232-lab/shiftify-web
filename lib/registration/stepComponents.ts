// Shared map of role → ordered step components.
// Imported by /register, /setup/profile/[step], and /dashboard/profile-setup/[step].

import { UserRole } from '@/lib/types';

import { WorkerStep01_Identity }     from '@/components/registration/steps/worker/Step01_Identity';
import { WorkerStep02_RightToWork }  from '@/components/registration/steps/worker/Step02_RightToWork';
import { WorkerStep03_WorkType }     from '@/components/registration/steps/worker/Step03_WorkType';
import { WorkerStep04_Services }     from '@/components/registration/steps/worker/Step04_Services';
import { WorkerStep05_Availability } from '@/components/registration/steps/worker/Step05_Availability';
import { WorkerStep06_ServiceAreas } from '@/components/registration/steps/worker/Step06_ServiceAreas';
import { WorkerStep07_Financials }   from '@/components/registration/steps/worker/Step07_Financials';
import { WorkerStep08_Documents }    from '@/components/registration/steps/worker/Step08_Documents';
import { WorkerStep09_Compliance }   from '@/components/registration/steps/worker/Step09_Compliance';

import { ProviderStep01_Business }        from '@/components/registration/steps/provider/Step01_Business';
import { ProviderStep02_ABN }             from '@/components/registration/steps/provider/Step02_ABN';
import { ProviderStep03_PrimaryContact }  from '@/components/registration/steps/provider/Step03_PrimaryContact';
import { ProviderStep04_AccountsContact } from '@/components/registration/steps/provider/Step04_AccountsContact';
import { ProviderStep05_Logo }            from '@/components/registration/steps/provider/Step05_Logo';
import { ProviderStep06_Services }        from '@/components/registration/steps/provider/Step06_Services';
import { ProviderStep07_ServiceAreas }    from '@/components/registration/steps/provider/Step07_ServiceAreas';
import { ProviderStep08_Workforce }       from '@/components/registration/steps/provider/Step08_Workforce';
import { ProviderStep09_Pricing }         from '@/components/registration/steps/provider/Step09_Pricing';
import { ProviderStep10_About }           from '@/components/registration/steps/provider/Step10_About';
import { ProviderStep11_Documents }       from '@/components/registration/steps/provider/Step11_Documents';
import { ProviderStep12_Declaration }     from '@/components/registration/steps/provider/Step12_Declaration';

import { CoordStep01_RoleOrg }     from '@/components/registration/steps/coordinator/Step01_RoleOrg';
import { CoordStep02_NDIS }        from '@/components/registration/steps/coordinator/Step02_NDIS';
import { CoordStep03_Experience }  from '@/components/registration/steps/coordinator/Step03_Experience';
import { CoordStep04_Coverage }    from '@/components/registration/steps/coordinator/Step04_Coverage';
import { CoordStep05_Capacity }    from '@/components/registration/steps/coordinator/Step05_Capacity';
import { CoordStep06_Billing }     from '@/components/registration/steps/coordinator/Step06_Billing';
import { CoordStep07_Bio }         from '@/components/registration/steps/coordinator/Step07_Bio';
import { CoordStep08_Documents }   from '@/components/registration/steps/coordinator/Step08_Documents';
import { CoordStep09_Declaration } from '@/components/registration/steps/coordinator/Step09_Declaration';

import { ParticipantStep01_Personal }         from '@/components/registration/steps/participant/Step01_Personal';
import { ParticipantStep02_NDIS }             from '@/components/registration/steps/participant/Step02_NDIS';
import { ParticipantStep03_SupportNeeds }     from '@/components/registration/steps/participant/Step03_SupportNeeds';
import { ParticipantStep04_EmergencyContact } from '@/components/registration/steps/participant/Step04_EmergencyContact';
import { ParticipantStep05_Declaration }      from '@/components/registration/steps/participant/Step05_Declaration';

import { PmStep01_Business }     from '@/components/registration/steps/plan-manager/Step01_Business';
import { PmStep02_Availability } from '@/components/registration/steps/plan-manager/Step02_Availability';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const STEP_COMPONENTS: Record<UserRole, React.ComponentType<any>[]> = {
  [UserRole.SUPPORT_WORKER]: [
    WorkerStep01_Identity, WorkerStep02_RightToWork, WorkerStep03_WorkType,
    WorkerStep04_Services, WorkerStep05_Availability, WorkerStep06_ServiceAreas,
    WorkerStep07_Financials, WorkerStep08_Documents, WorkerStep09_Compliance,
  ],
  [UserRole.PROVIDER]: [
    ProviderStep01_Business, ProviderStep02_ABN, ProviderStep03_PrimaryContact,
    ProviderStep04_AccountsContact, ProviderStep05_Logo, ProviderStep06_Services,
    ProviderStep07_ServiceAreas, ProviderStep08_Workforce, ProviderStep09_Pricing,
    ProviderStep10_About, ProviderStep11_Documents, ProviderStep12_Declaration,
  ],
  [UserRole.COORDINATOR]: [
    CoordStep01_RoleOrg, CoordStep02_NDIS, CoordStep03_Experience, CoordStep04_Coverage,
    CoordStep05_Capacity, CoordStep06_Billing, CoordStep07_Bio, CoordStep08_Documents,
    CoordStep09_Declaration,
  ],
  [UserRole.PARTICIPANT]: [
    ParticipantStep01_Personal, ParticipantStep02_NDIS, ParticipantStep03_SupportNeeds,
    ParticipantStep04_EmergencyContact, ParticipantStep05_Declaration,
  ],
  [UserRole.PLAN_MANAGER]: [PmStep01_Business, PmStep02_Availability],
};
