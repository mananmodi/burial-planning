// Standard search-engine details (meta title, keywords, description) for the pages that ship with the site.
// They are copied into the database once; after that the admin edits them in Admin > Pages > (page) > Search engine details.
const BRAND = 'Gámez & Sons';

export const SEO_DEFAULTS = {
  home: {
    title: `Funeral & Cremation Services in Laredo, TX | ${BRAND}`,
    keywords: 'funeral home Laredo TX, cremation services Laredo, burial planning, funeral planning online, pre-need funeral planning, Webb County funeral home, Rio Bravo funeral services',
    description: 'Compassionate funeral, cremation and pre-planning services in Laredo, Rio Bravo and El Cenizo. Plan online or call us 24/7 for affordable, personalized care.',
  },
  'immediate-need': {
    title: `Immediate Need: Call Us 24/7 After a Death | ${BRAND}`,
    keywords: 'immediate need funeral, what to do when someone dies, funeral home open 24 hours, death in the family Laredo, first steps after a death',
    description: 'A death has just occurred? Call us any hour of the day. We will guide you through the first steps and tell you what information to have ready.',
  },
  'services-overview': {
    title: `Funeral & Cremation Services Overview | ${BRAND}`,
    keywords: 'funeral services Laredo, funeral and cremation options, traditional funeral, cremation, memorial service, veteran funeral services, funeral home services',
    description: 'Every service we offer in Laredo, TX: traditional funerals, cremation, personalized tributes, veteran honors and planning ahead, with clear, affordable pricing.',
  },
  'traditional-services': {
    title: `Traditional Funeral Services in Laredo, TX | ${BRAND}`,
    keywords: 'traditional funeral Laredo, visitation, funeral service, graveside service, casket funeral, burial services, funeral chapel',
    description: 'A dignified traditional funeral with visitation, funeral service and graveside committal, personalized with music, photographs and tributes for your loved one.',
  },
  'cremation-services': {
    title: `Affordable Cremation Services in Laredo, TX | ${BRAND}`,
    keywords: 'cremation Laredo TX, affordable cremation, memorial service cremation, urns, columbarium niche, scattering ashes, direct cremation, pet cremation',
    description: 'Affordable cremation with a memorial or funeral service, urns, keepsakes, columbarium niches and scattering options. Compassionate guidance at every step.',
  },
  personalization: {
    title: `Personalized Funeral & Memorial Tributes | ${BRAND}`,
    keywords: 'personalized funeral, memorial video, funeral music, tribute photos, keepsakes, celebration of life, custom memorial service',
    description: 'Celebrate a life uniquely with photo tributes, memorial video, favorite music, keepsakes and meaningful details that tell your loved one’s story.',
  },
  'veteran-services': {
    title: `Veteran Funeral Services & Military Honors | ${BRAND}`,
    keywords: 'veteran funeral Laredo, military honors, VA burial benefits, veterans cemetery, flag presentation, military funeral services',
    description: 'Honor a veteran’s service with military honors, flag presentation and help applying for VA burial benefits. We handle the paperwork so you can focus on family.',
  },
  'planning-ahead': {
    title: `Pre-Need Funeral Planning Ahead | ${BRAND}`,
    keywords: 'pre-need funeral planning, plan ahead funeral, prearrangement, pre-plan funeral Laredo, funeral planning online, advance funeral arrangements',
    description: 'Record your wishes today and spare your family difficult decisions later. Plan your own funeral or cremation online with clear prices and no pressure.',
  },
  'pre-planning-checklist': {
    title: `Funeral Pre-Planning Checklist | ${BRAND}`,
    keywords: 'funeral planning checklist, pre-planning checklist, end of life planning, funeral wishes, documents needed funeral, advance directive',
    description: 'A simple checklist of the decisions, documents and wishes to record when planning a funeral ahead of time, so your family knows exactly what you want.',
  },
  'about-us': {
    title: `About Our Laredo Funeral Home | ${BRAND}`,
    keywords: 'about Gámez & Sons, Laredo funeral home, family funeral home, funeral director Laredo, our mission, funeral home Webb County',
    description: 'Learn about our mission, values and the family-focused care we have provided to Laredo and Webb County families with compassion, integrity and respect.',
  },
  'our-staff': {
    title: `Our Caring Funeral Directors | ${BRAND}`,
    keywords: 'funeral directors Laredo, funeral home staff, licensed funeral director, funeral home team, meet our staff',
    description: 'Meet the experienced, caring team who will guide your family through every decision, available day and night when you need support.',
  },
  'the-grieving-process': {
    title: `The Grieving Process & Grief Support | ${BRAND}`,
    keywords: 'grief support, grieving process, coping with loss, stages of grief, bereavement support, helping children grieve, grief counseling Laredo',
    description: 'Understand the grieving process and find gentle guidance, support and resources for coping with loss, for you and for those you love.',
  },
  'frequent-questions': {
    title: `Funeral Planning FAQs: Frequent Questions | ${BRAND}`,
    keywords: 'funeral FAQ, funeral costs questions, cremation questions, how much does a funeral cost, funeral planning questions, death certificate',
    description: 'Straight answers to the most common questions about funerals, cremation, costs, paperwork and planning ahead from our Laredo funeral home.',
  },
  'contact-us': {
    title: `Contact Our Laredo Funeral Home | ${BRAND}`,
    keywords: 'contact funeral home Laredo, funeral home phone, funeral home address, schedule consultation, funeral home hours, speak to a funeral director',
    description: 'Call us any hour, send a message or visit our Laredo location. Our team is here to answer questions and schedule a consultation at your convenience.',
  },
};

const clip = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length <= n ? t : `${t.slice(0, n - 1).replace(/\s+\S*$/, '')}…`; };

// Sensible details for any other page (new pages created by the admin) built from what the page already says.
export function suggestSeo(page, siteName = BRAND) {
  const title = String(page.title || '').trim();
  const lead = String(page.hero_subtitle || '').trim()
    || (page.sections || []).map((s) => String(s.body || '').split('\n').find((l) => l.trim() && !l.trim().startsWith('-'))).find(Boolean) || '';
  const words = [title, page.nav_group, page.hero_title].filter(Boolean).map((x) => String(x).toLowerCase());
  return {
    title: clip(`${title} | ${siteName}`, 70),
    keywords: [...new Set([...words, 'funeral home Laredo TX', 'funeral planning', 'cremation services'])].join(', '),
    description: clip(lead || `${title} from ${siteName}. Compassionate funeral and cremation services in Laredo, TX.`, 160),
  };
}
