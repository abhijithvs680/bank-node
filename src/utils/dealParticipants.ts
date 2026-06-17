export interface DealParticipant {
  name: string;
  email: string;
  role: string;
  organization?: string;
}

/** Static participant emails per deal — used by AI for notify/recipient resolution. */
const DEAL_PARTICIPANTS: Record<string, DealParticipant[]> = {
  '1001': [
    {
      name: 'Hariraj',
      email: 'hariraj@orionman.co.za',
      role: 'Borrower Contact',
      organization: 'ORION MANUFACTURING HOLDINGS LIMITED',
    },
    {
      name: 'Pratheesh K P',
      email: 'pratheesh.kp@goodbank.com',
      role: 'Front Office',
      organization: 'GoodBank',
    },
    {
      name: 'Tmu1',
      email: 'tmu1@goodbank.com',
      role: 'TMU',
      organization: 'GoodBank',
    },
    {
      name: 'Agency Desk',
      email: 'agency@goodbank.com',
      role: 'Arranger',
      organization: 'Agency',
    },
    {
      name: 'Sarah Smith',
      email: 'sarah.smith@agency.com',
      role: 'Facility Agent',
      organization: 'Atlas Meridian Bank PLC',
    },
    {
      name: 'James Okonkwo',
      email: 'james.okonkwo@novatrust.com',
      role: 'Security Trustee',
      organization: 'Nova Trust & Custody Services Limited',
    },
    {
      name: 'Michael van der Berg',
      email: 'michael.vanderberg@firstcapital.co.za',
      role: 'Lender',
      organization: 'First Capital Bank (LN045)',
    },
    {
      name: 'Lindiwe Nkosi',
      email: 'lindiwe.nkosi@zenithindustrial.co.za',
      role: 'Lender',
      organization: 'Zenith Industrial Holdings Limited (LN046)',
    },
    {
      name: 'David Pretorius',
      email: 'david.pretorius@orionindustrial.co.za',
      role: 'Lender',
      organization: 'Orion Industrial Holdings Limited (LN047)',
    },
  ],
  '6007': [
    {
      name: 'Priyanka R',
      email: 'priyanka@abc.com',
      role: 'Borrower Contact',
      organization: 'Apex Retail Group Ltd',
    },
    {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@goodbank.com',
      role: 'Front Office',
      organization: 'GoodBank',
    },
    {
      name: 'Tmu2',
      email: 'tmu2@goodbank.com',
      role: 'TMU',
      organization: 'GoodBank',
    },
    {
      name: 'Johnathan Doe',
      email: 'johnathan.doe@goodbank.com',
      role: 'Arranger',
      organization: 'GoodBank',
    },
    {
      name: 'Emma Clarke',
      email: 'emma.clarke@sbsa.com',
      role: 'Facility Agent',
      organization: 'Standard Bank of South Africa',
    },
    {
      name: 'Oliver Hughes',
      email: 'oliver.hughes@barclays.com',
      role: 'Lender',
      organization: 'Barclays',
    },
    {
      name: 'Nomsa Dlamini',
      email: 'nomsa.dlamini@sbsa.com',
      role: 'Lender',
      organization: 'Standard Bank of South Africa (SBSA)',
    },
  ],
  '6008': [
    {
      name: 'Ranjith K R',
      email: 'ranjith@abc.com',
      role: 'Borrower Contact',
      organization: 'Apollo Energy Group Holdings',
    },
    {
      name: 'Alice Johnson',
      email: 'alice.johnson@goodbank.com',
      role: 'Front Office',
      organization: 'GoodBank',
    },
    {
      name: 'Tmu3',
      email: 'tmu3@goodbank.com',
      role: 'TMU',
      organization: 'GoodBank',
    },
    {
      name: 'Michael Chang',
      email: 'michael.chang@goodbank.com',
      role: 'Arranger',
      organization: 'GoodBank',
    },
    {
      name: 'Robert Chen',
      email: 'robert.chen@sc.com',
      role: 'Facility Agent',
      organization: 'Standard Chartered',
    },
    {
      name: 'Lisa Park',
      email: 'lisa.park@citibank.com',
      role: 'Lender',
      organization: 'Citibank',
    },
    {
      name: 'Kwame Mensah',
      email: 'kwame.mensah@sbsa.com',
      role: 'Lender',
      organization: 'Standard Bank of South Africa (SBSA)',
    },
    {
      name: 'Andrew Walsh',
      email: 'andrew.walsh@sc.com',
      role: 'Lender',
      organization: 'Standard Chartered',
    },
  ],
  '6009': [
    {
      name: 'Shilpa S',
      email: 'shilpa@abc.com',
      role: 'Borrower Contact',
      organization: 'Horizon Infrastructure Corp',
    },
    {
      name: 'Bob Wilson',
      email: 'bob.wilson@goodbank.com',
      role: 'Front Office',
      organization: 'GoodBank',
    },
    {
      name: 'Tmu1',
      email: 'tmu1@goodbank.com',
      role: 'TMU',
      organization: 'GoodBank',
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@goodbank.com',
      role: 'Arranger',
      organization: 'GoodBank',
    },
    {
      name: 'Thabo Molefe',
      email: 'thabo.molefe@sbsa.com',
      role: 'Facility Agent',
      organization: 'Standard Bank of South Africa',
    },
    {
      name: 'Helen Fraser',
      email: 'helen.fraser@hsbc.com',
      role: 'Lender',
      organization: 'HSBC',
    },
    {
      name: 'Sipho Ndlovu',
      email: 'sipho.ndlovu@sbsa.com',
      role: 'Lender',
      organization: 'Standard Bank of South Africa (SBSA)',
    },
  ],
  '5001': [
    {
      name: 'Aditya Roy',
      email: 'aditya.roy@beaconproperties.co.za',
      role: 'Borrower Contact',
      organization: 'Beacon Properties SA',
    },
    {
      name: 'David Lee',
      email: 'david.lee@goodbank.com',
      role: 'Front Office',
      organization: 'GoodBank',
    },
    {
      name: 'Tmu2',
      email: 'tmu2@goodbank.com',
      role: 'TMU',
      organization: 'GoodBank',
    },
    {
      name: 'Emma Davis',
      email: 'emma.davis@goodbank.com',
      role: 'Arranger',
      organization: 'GoodBank',
    },
    {
      name: 'Zanele Khumalo',
      email: 'zanele.khumalo@sbsa.com',
      role: 'Facility Agent',
      organization: 'Standard Bank of South Africa',
    },
    {
      name: 'Peter van Wyk',
      email: 'peter.vanwyk@investec.co.za',
      role: 'Lender',
      organization: 'Investec',
    },
    {
      name: 'Nomsa Dlamini',
      email: 'nomsa.dlamini@sbsa.com',
      role: 'Lender',
      organization: 'Standard Bank of South Africa (SBSA)',
    },
  ],
  '5002': [
    {
      name: 'Ananya Sen',
      email: 'ananya.sen@quantumholdings.eu',
      role: 'Borrower Contact',
      organization: 'Quantum Holdings Inc',
    },
    {
      name: 'Alice Johnson',
      email: 'alice.johnson@goodbank.com',
      role: 'Front Office',
      organization: 'GoodBank',
    },
    {
      name: 'Tmu1',
      email: 'tmu1@goodbank.com',
      role: 'TMU',
      organization: 'GoodBank',
    },
    {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@goodbank.com',
      role: 'Arranger',
      organization: 'GoodBank',
    },
    {
      name: 'Marco Rossi',
      email: 'marco.rossi@deutschebank.com',
      role: 'Facility Agent',
      organization: 'Deutsche Bank',
    },
    {
      name: 'Hans Mueller',
      email: 'hans.mueller@deutschebank.com',
      role: 'Lender',
      organization: 'Deutsche Bank',
    },
    {
      name: 'Kwame Mensah',
      email: 'kwame.mensah@sbsa.com',
      role: 'Lender',
      organization: 'Standard Bank of South Africa (SBSA)',
    },
  ],
};

export function getDealParticipants(dealId: string): DealParticipant[] {
  return DEAL_PARTICIPANTS[dealId] ?? DEAL_PARTICIPANTS['1001'];
}

export function formatParticipantForNotify(participant: DealParticipant): string {
  const roleLabel = participant.organization
    ? `${participant.role} — ${participant.organization}`
    : participant.role;
  return `${participant.name} (${roleLabel}) <${participant.email}>`;
}

export function formatParticipantsForPrompt(participants: DealParticipant[]): string {
  return participants.map(formatParticipantForNotify).join('\n');
}

export function getParticipantEmailsByRole(
  dealId: string,
  rolePattern: RegExp
): DealParticipant[] {
  return getDealParticipants(dealId).filter((p) => rolePattern.test(p.role));
}
