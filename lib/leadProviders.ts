// Lead provider format detection and column mapping for Excel imports

export type LeadProvider = 'magicbricks_property' | 'magicbricks_project' | '99acres' | 'housing' | 'standard' | 'generic'

export interface ProviderInfo {
  id: LeadProvider
  label: string
  source: string
  color: string
  description: string
}

export const PROVIDERS: Record<LeadProvider, ProviderInfo> = {
  magicbricks_property: { id: 'magicbricks_property', label: 'MagicBricks Property', source: 'magicbricks', color: '#FF5722', description: 'Property enquiry leads from MagicBricks portal' },
  magicbricks_project: { id: 'magicbricks_project', label: 'MagicBricks Project', source: 'magicbricks', color: '#FF9800', description: 'Project enquiry leads from MagicBricks portal' },
  '99acres': { id: '99acres', label: '99Acres', source: '99acres', color: '#4CAF50', description: 'Leads from 99acres property portal' },
  housing: { id: 'housing', label: 'Housing.com', source: 'housing', color: '#2196F3', description: 'Leads from Housing.com portal' },
  standard: { id: 'standard', label: 'Brickroots Standard', source: 'other', color: '#9C27B0', description: 'Standardized CRM format with Lead Date, Source, Customer Name, Mobile...' },
  generic: { id: 'generic', label: 'Generic CSV/Excel', source: 'other', color: '#607D8B', description: 'Any file with at least Name and Phone columns' },
}

export function detectProvider(headers: string[]): LeadProvider {
  const h = headers.map(s => s.toLowerCase().replace(/[\s_"]/g, ''))

  // MagicBricks Property: has "propertyid" and "briefdesc."
  if (h.some(x => x.includes('propertyid')) && h.some(x => x.includes('briefdesc'))) return 'magicbricks_property'

  // MagicBricks Project: has "projectname" as col B + "projectlisting"
  if (h.some(x => x.includes('projectlisting')) && h.some(x => x.includes('nricontact'))) return 'magicbricks_project'

  // 99acres: has "listingid" and "businesssegment"
  if (h.some(x => x.includes('listingid')) && h.some(x => x.includes('businesssegment'))) return '99acres'

  // Housing: has "servicetype" and "sellerid"
  if (h.some(x => x.includes('servicetype')) && h.some(x => x.includes('sellerid'))) return 'housing'

  // Standard Brickroots format: Lead Date, Source, Customer Name, Mobile...
  if (h.some(x => x === 'leaddate') && h.some(x => x === 'customername') && h.some(x => x === 'mobile')) return 'standard'

  return 'generic'
}

interface MappedLead {
  name: string; phone: string; email?: string; source: string; status: string; priority: string
  budget_max?: number; notes?: string; lead_date?: string; service_type?: string
  city?: string; locality?: string; project_interest?: string; bhk_preference?: string
  property_type?: string; listing_id?: string; lead_provider_ref?: string
}

const clean = (v: any): string => (v === undefined || v === null) ? '' : String(v).replace(/"/g, '').trim()
const normalizePhone = (v: any): string => {
  if (v === undefined || v === null) return ''
  let s = String(v).trim()
  if (/^\d+(\.\d+)?[eE]\+?\d+$/.test(s)) { try { s = Number(s).toLocaleString('fullwide', { useGrouping: false }) } catch {} }
  if (s.endsWith('.0')) s = s.slice(0, -2)
  return s.replace(/[\s\-()]/g, '')
}
const parseBudget = (v: any): number | undefined => {
  if (v === undefined || v === null) return undefined
  const s = String(v).replace(/[^\d.]/g, '')
  const n = parseFloat(s)
  return isNaN(n) ? undefined : Math.round(n)
}
const parseDate = (v: any): string | undefined => {
  if (!v) return undefined
  if (v instanceof Date) return v.toISOString().split('T')[0]
  const d = new Date(v)
  return isNaN(d.getTime()) ? undefined : d.toISOString().split('T')[0]
}

const mapServiceType = (v: string): string | undefined => {
  const s = v.toLowerCase()
  if (s.includes('new') || s.includes('project') || s.includes('primary')) return 'new_project'
  if (s.includes('resale') || s.includes('secondary')) return 'resale'
  if (s.includes('rent')) return 'rental'
  return undefined
}

const mapPropertyType = (v: string): string | undefined => {
  const s = v.toLowerCase()
  if (s.includes('apartment') || s.includes('flat')) return 'apartment'
  if (s.includes('villa') || s.includes('house') || s.includes('bungalow')) return 'villa'
  if (s.includes('plot') || s.includes('land')) return 'plot'
  if (s.includes('commercial') || s.includes('office') || s.includes('shop')) return 'commercial'
  if (s.includes('penthouse')) return 'penthouse'
  if (s.includes('studio')) return 'studio'
  if (s.includes('duplex')) return 'duplex'
  return undefined
}

export function mapRow(provider: LeadProvider, headers: string[], row: any[]): MappedLead {
  const h = headers.map(s => s.toLowerCase().replace(/[\s_"]/g, ''))
  const col = (pattern: string) => { const i = h.findIndex(x => x.includes(pattern)); return i >= 0 ? row[i] : undefined }
  const colExact = (pattern: string) => { const i = h.findIndex(x => x === pattern); return i >= 0 ? row[i] : undefined }

  switch (provider) {
    case 'magicbricks_property': return {
      name: clean(col('name')), phone: normalizePhone(col('mobile')),
      email: clean(col('email')) || undefined, source: 'magicbricks', status: 'new', priority: 'medium',
      budget_max: parseBudget(col('budget')), lead_date: parseDate(col('messagedate')),
      city: clean(col('city')), locality: clean(col('locality')),
      project_interest: clean(col('projectname')) || undefined,
      property_type: mapPropertyType(clean(col('interestedin') || '')),
      listing_id: clean(col('propertyid')) || undefined,
      notes: clean(col('messagedetails')) || undefined,
      service_type: mapServiceType(clean(col('typeofle') || col('status') || '')),
    }
    case 'magicbricks_project': return {
      name: clean(col('name')), phone: normalizePhone(col('mobile')),
      email: clean(col('email')) || undefined, source: 'magicbricks', status: 'new', priority: 'medium',
      budget_max: parseBudget(col('budget')), lead_date: parseDate(col('messagedate')),
      city: clean(col('city')), locality: clean(col('localityname') || col('preferredlocation')),
      project_interest: clean(colExact('projectname') || col('projectname')) || undefined,
      property_type: mapPropertyType(clean(col('propertytype') || col('interestedin') || '')),
      bhk_preference: clean(col('lookingfor')) || undefined,
      notes: [clean(col('messagedetails')), clean(col('anyotherdetails'))].filter(Boolean).join(' | ') || undefined,
      service_type: mapServiceType(clean(col('typeofle') || '')),
    }
    case '99acres': return {
      name: clean(col('name')), phone: normalizePhone(col('phone')),
      email: clean(col('email')) || undefined, source: '99acres', status: 'new', priority: 'medium',
      budget_max: parseBudget(col('priceofproperty') || col('price')),
      lead_date: parseDate(col('date')),
      city: clean(col('city')), locality: clean(col('locality')),
      project_interest: clean(col('project')) || undefined,
      bhk_preference: clean(col('bhk')) || undefined,
      property_type: mapPropertyType(clean(col('propertytype') || '')),
      listing_id: clean(col('listingid')) || undefined,
      service_type: mapServiceType(clean(col('businesssegment') || col('producttype') || '')),
      notes: clean(col('responsefrom')) || undefined,
    }
    case 'housing': return {
      name: clean(col('leadname') || col('name')), phone: normalizePhone(col('leadphone') || col('phone')),
      email: clean(col('leademail') || col('email')) || undefined, source: 'housing', status: 'new', priority: 'medium',
      budget_max: parseBudget(col('price')),
      lead_date: parseDate(col('leaddate')),
      city: clean(col('city')), locality: clean(col('locality')),
      project_interest: clean(col('building') || col('project')) || undefined,
      bhk_preference: clean(col('configuration') || col('config')) || undefined,
      property_type: mapPropertyType(clean(col('propertytype') || '')),
      listing_id: clean(col('property/projectid') || col('propertyid') || col('projectid')) || undefined,
      service_type: mapServiceType(clean(col('servicetype') || '')),
      notes: clean(col('notes')) || undefined,
    }
    case 'standard': return {
      name: clean(colExact('customername') || col('name')),
      phone: normalizePhone(colExact('mobile') || col('phone')),
      email: clean(col('email')) || undefined,
      source: normalizeSource(clean(col('source') || colExact('source'))),
      status: 'new', priority: 'medium',
      budget_max: parseBudget(col('budget')),
      lead_date: parseDate(colExact('leaddate') || col('date')),
      city: clean(col('city')), locality: undefined,
      project_interest: clean(col('projectname')) || undefined,
      bhk_preference: clean(col('bhk')) || undefined,
      service_type: mapServiceType(clean(col('servicetype') || col('projecttype') || '')),
      notes: clean(col('remarks') || col('notes')) || undefined,
    }
    default: { // generic
      const nameIdx = h.findIndex(x => x.includes('name') || x === 'lead')
      const phoneIdx = h.findIndex(x => x.includes('phone') || x.includes('mobile') || x.includes('contact'))
      const emailIdx = h.findIndex(x => x.includes('email') || x.includes('mail'))
      const sourceIdx = h.findIndex(x => x.includes('source') || x.includes('channel'))
      const budgetIdx = h.findIndex(x => x.includes('budget') || x.includes('price'))
      const notesIdx = h.findIndex(x => x.includes('notes') || x.includes('remark'))
      const cityIdx = h.findIndex(x => x.includes('city'))
      const bhkIdx = h.findIndex(x => x.includes('bhk') || x.includes('config'))
      const projectIdx = h.findIndex(x => x.includes('project'))
      const dateIdx = h.findIndex(x => x.includes('date'))
      const validSources = ['magicbricks','99acres','housing','meta_ads','google_ads','website','whatsapp','referral','walk_in','facebook','instagram','other']
      const rawSource = sourceIdx >= 0 ? clean(row[sourceIdx]).toLowerCase() : 'other'
      return {
        name: nameIdx >= 0 ? clean(row[nameIdx]) : '',
        phone: phoneIdx >= 0 ? normalizePhone(row[phoneIdx]) : '',
        email: emailIdx >= 0 ? clean(row[emailIdx]) || undefined : undefined,
        source: validSources.includes(rawSource) ? rawSource : 'other',
        status: 'new', priority: 'medium',
        budget_max: budgetIdx >= 0 ? parseBudget(row[budgetIdx]) : undefined,
        notes: notesIdx >= 0 ? clean(row[notesIdx]) || undefined : undefined,
        city: cityIdx >= 0 ? clean(row[cityIdx]) || undefined : undefined,
        bhk_preference: bhkIdx >= 0 ? clean(row[bhkIdx]) || undefined : undefined,
        project_interest: projectIdx >= 0 ? clean(row[projectIdx]) || undefined : undefined,
        lead_date: dateIdx >= 0 ? parseDate(row[dateIdx]) : undefined,
      }
    }
  }
}

// Normalize source value for valid sources
export function normalizeSource(src: string): string {
  const s = src.toLowerCase().replace(/[\s._-]/g, '')
  if (s.includes('magicbrick')) return 'magicbricks'
  if (s.includes('99acre')) return '99acres'
  if (s.includes('housing')) return 'housing'
  if (s.includes('meta') || s.includes('facebook')) return 'meta_ads'
  if (s.includes('google')) return 'google_ads'
  if (s.includes('website') || s.includes('web')) return 'website'
  if (s.includes('whatsapp')) return 'whatsapp'
  if (s.includes('referral') || s.includes('refer')) return 'referral'
  if (s.includes('walkin') || s.includes('walk')) return 'walk_in'
  if (s.includes('instagram') || s.includes('insta')) return 'instagram'
  return 'other'
}
