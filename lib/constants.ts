import type {
  Lead,
  LeadStatus,
  LeadSource,
  LeadPriority,
  PropertyType,
  FollowUpType,
  FollowUpStatus,
  SiteVisitStatus,
  UserRole,
  ActivityType,
} from '@/types'

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  site_visit: 'Site Visit',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
  on_hold: 'On Hold',
}

export const LEAD_STATUS_COLORS: Record<LeadStatus, { bg: string; text: string; border: string }> = {
  new: { bg: 'rgba(98, 98, 96, 0.08)', text: 'var(--color-body-brown)', border: 'var(--color-stone-border)' },
  contacted: { bg: 'rgba(0, 134, 252, 0.08)', text: 'var(--color-sky-blue)', border: 'rgba(0, 134, 252, 0.2)' },
  qualified: { bg: 'rgba(0, 202, 72, 0.08)', text: 'var(--color-grass-green)', border: 'rgba(0, 202, 72, 0.2)' },
  site_visit: { bg: 'rgba(255, 187, 38, 0.1)', text: 'var(--color-gold)', border: 'rgba(255, 187, 38, 0.25)' },
  negotiation: { bg: 'rgba(255, 62, 0, 0.08)', text: 'var(--color-ember)', border: 'rgba(255, 62, 0, 0.2)' },
  closed_won: { bg: 'rgba(0, 202, 72, 0.15)', text: 'var(--color-grass-green)', border: 'rgba(0, 202, 72, 0.3)' },
  closed_lost: { bg: 'rgba(224, 36, 36, 0.08)', text: 'var(--color-alert-red)', border: 'rgba(224, 36, 36, 0.2)' },
  on_hold: { bg: 'rgba(98, 98, 96, 0.12)', text: 'var(--color-muted-gray)', border: 'var(--color-stone-border)' },
}

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  magicbricks: 'MagicBricks',
  '99acres': '99Acres',
  housing: 'Housing.com',
  meta_ads: 'Meta Ads',
  google_ads: 'Google Ads',
  website: 'Website',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  instagram: 'Instagram',
  referral: 'Referral',
  walk_in: 'Walk-In',
  property_portal: 'Property Portal',
}

export const LEAD_SOURCE_COLORS: Record<LeadSource, { bg: string; text: string }> = {
  magicbricks: { bg: 'rgba(255, 187, 38, 0.08)', text: 'var(--color-gold)' },
  '99acres': { bg: 'rgba(0, 134, 252, 0.08)', text: 'var(--color-sky-blue)' },
  housing: { bg: 'rgba(255, 62, 0, 0.08)', text: 'var(--color-ember)' },
  meta_ads: { bg: 'rgba(98, 98, 96, 0.08)', text: 'var(--color-body-brown)' },
  google_ads: { bg: 'rgba(98, 98, 96, 0.08)', text: 'var(--color-body-brown)' },
  website: { bg: 'rgba(0, 202, 72, 0.08)', text: 'var(--color-grass-green)' },
  whatsapp: { bg: 'rgba(0, 202, 72, 0.08)', text: 'var(--color-grass-green)' },
  facebook: { bg: 'rgba(98, 98, 96, 0.08)', text: 'var(--color-body-brown)' },
  instagram: { bg: 'rgba(98, 98, 96, 0.08)', text: 'var(--color-body-brown)' },
  referral: { bg: 'rgba(255, 187, 38, 0.08)', text: 'var(--color-gold)' },
  walk_in: { bg: 'rgba(98, 98, 96, 0.08)', text: 'var(--color-body-brown)' },
  property_portal: { bg: 'rgba(98, 98, 96, 0.08)', text: 'var(--color-body-brown)' },
}

export const PRIORITY_LABELS: Record<LeadPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export const PRIORITY_COLORS: Record<LeadPriority, { bg: string; text: string }> = {
  low: { bg: 'rgba(98, 98, 96, 0.08)', text: 'var(--color-muted-gray)' },
  medium: { bg: 'rgba(0, 134, 252, 0.08)', text: 'var(--color-sky-blue)' },
  high: { bg: 'rgba(255, 187, 38, 0.1)', text: 'var(--color-gold)' },
  urgent: { bg: 'rgba(224, 36, 36, 0.08)', text: 'var(--color-alert-red)' },
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Apartment',
  villa: 'Villa',
  plot: 'Plot',
  commercial: 'Commercial',
  penthouse: 'Penthouse',
  studio: 'Studio',
  duplex: 'Duplex',
}

export const FOLLOW_UP_TYPE_LABELS: Record<FollowUpType, string> = {
  call: 'Phone Call',
  whatsapp: 'WhatsApp',
  email: 'Email',
  meeting: 'Meeting',
  site_visit: 'Site Visit',
}

export const FOLLOW_UP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  missed: 'Missed',
  cancelled: 'Cancelled',
}

export const SITE_VISIT_STATUS_LABELS: Record<SiteVisitStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  sales_manager: 'Sales Manager',
  sales_executive: 'Sales Executive',
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  lead_created: 'Lead Created',
  status_changed: 'Status Changed',
  follow_up_scheduled: 'Follow-up Scheduled',
  follow_up_completed: 'Follow-up Completed',
  site_visit_scheduled: 'Site Visit Scheduled',
  site_visit_completed: 'Site Visit Completed',
  note_added: 'Note Added',
  document_added: 'Document Added',
  assigned: 'Lead Assigned',
  call_made: 'Call Made',
  email_sent: 'Email Sent',
  whatsapp_sent: 'WhatsApp Sent',
}

export const LEAD_STATUS_PIPELINE: LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'site_visit',
  'negotiation',
  'closed_won',
]

// Seeded random number generator for deterministic mock data to prevent hydration mismatches
export function generateMockLeads(count: number = 50): Lead[] {
  const statuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'closed_won', 'closed_lost', 'on_hold']
  const sources: LeadSource[] = ['magicbricks', '99acres', 'housing', 'meta_ads', 'google_ads', 'website', 'whatsapp', 'referral', 'walk_in']
  const priorities: LeadPriority[] = ['low', 'medium', 'high', 'urgent']
  const propertyTypes: PropertyType[] = ['apartment', 'villa', 'plot', 'commercial', 'penthouse']
  const names = [
    'Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sunita Verma', 'Vikash Singh',
    'Anjali Gupta', 'Rohit Mehta', 'Deepa Nair', 'Suresh Reddy', 'Kavita Joshi',
    'Manoj Tiwari', 'Rekha Bansal', 'Ajay Mishra', 'Pooja Agarwal', 'Sanjay Yadav',
    'Neha Chauhan', 'Rajesh Pandey', 'Meera Pillai', 'Vikas Khanna', 'Anita Dubey',
  ]
  const employees = [
    { id: 'emp1', name: 'Arjun Rathore' },
    { id: 'emp2', name: 'Sneha Kapoor' },
    { id: 'emp3', name: 'Dev Malhotra' },
    { id: 'emp4', name: 'Priti Saxena' },
  ]
  const projects = ['Prestige Skyline', 'Brigade Utopia', 'Sobha Dream', 'DLF Camellias', 'Godrej Reserve']
  const locations = ['Whitefield', 'HSR Layout', 'Koramangala', 'Electronic City', 'Sarjapur Road', 'Hebbal']

  let seed = 12345
  function random() {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
  }

  // Fixed anchor timestamp: July 4th, 2026 12:00:00 UTC
  const anchorTime = 1785844800000

  return Array.from({ length: count }, (_, i) => {
    const name = names[i % names.length]
    const emp = employees[i % employees.length]
    const status = statuses[Math.floor(random() * statuses.length)]
    const createdDate = new Date(anchorTime - random() * 90 * 86400000)

    return {
      id: `lead-${i + 1}`,
      leadNumber: `LID-${String(1000 + i + 1).padStart(4, '0')}`,
      name,
      phone: `9${String(Math.floor(random() * 900000000) + 100000000)}`,
      email: `${name.toLowerCase().replace(' ', '.')}@gmail.com`,
      source: sources[Math.floor(random() * sources.length)],
      status,
      priority: priorities[Math.floor(random() * priorities.length)],
      propertyType: propertyTypes[Math.floor(random() * propertyTypes.length)],
      budget: [3000000, 5000000, 8000000, 12000000, 20000000, 50000000][Math.floor(random() * 6)],
      budgetMax: [5000000, 8000000, 12000000, 20000000, 50000000, 100000000][Math.floor(random() * 6)],
      location: locations[Math.floor(random() * locations.length)],
      projectInterest: projects[Math.floor(random() * projects.length)],
      assignedTo: emp.id,
      assignedToName: emp.name,
      score: Math.floor(random() * 100),
      tags: [],
      createdAt: createdDate.toISOString(),
      updatedAt: new Date(createdDate.getTime() + random() * 7 * 86400000).toISOString(),
      lastContactedAt: random() > 0.3 ? new Date(anchorTime - random() * 7 * 86400000).toISOString() : undefined,
      nextFollowUp: random() > 0.4 ? new Date(anchorTime + random() * 3 * 86400000).toISOString() : undefined,
      siteVisitCount: Math.floor(random() * 3),
      followUpCount: Math.floor(random() * 10),
    }
  })
}
