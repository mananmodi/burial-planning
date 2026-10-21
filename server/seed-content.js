// Initial website content, collected from gamezandsons.com. Editable afterwards in the admin panel.
// Section body format: blank line = new paragraph, "- " = bullet, "### " = sub-heading, **bold** supported.

export const settings = {
  site_name: 'Gámez & Sons Funeral and Cremation Services',
  tagline: 'Serving Families With Compassion, Dignity & Respect',
  phone: '(956) 701-3459',
  email: 'fgamez4@gmail.com',
  address: '1029 Bob Bullock Loop, Suite 1, Laredo, TX 78043',
  facebook: 'https://www.facebook.com/gamezandsons/',
  hours: 'Available 24 hours a day, 7 days a week',
  home_slides: JSON.stringify([
    { image: '/images/slide-1.jpg', title: 'Serving Families With Compassion, Dignity & Respect', subtitle: 'Your trusted funeral and cremation provider in Laredo, Rio Bravo, El Cenizo and surrounding Webb County communities.', link: '/services-overview', cta: 'Learn More' },
    { image: '/images/slide-2.jpg', title: 'Your Loved One Deserves The Best', subtitle: 'Personalized services that honor their life, their faith and their story.', link: '/personalization', cta: 'Learn More' },
    { image: '/images/slide-3.jpg', title: 'Traditional Services, Thoughtfully Planned', subtitle: 'Visitation, funeral and graveside services designed around your family.', link: '/traditional-services', cta: 'Our Services' },
    { image: '/images/slide-4.jpg', title: 'Plan Ahead, Give Your Family Peace of Mind', subtitle: 'Record your wishes today so your loved ones are never left to guess.', link: '/plan', cta: 'Start Planning' },
  ]),
  footer_note:
    'For information on preneed funeral contracts and the trust and insurance funding options available under Texas law, visit www.prepaidfunerals.texas.gov.',
};

const call = 'Call (956) 701-3459 any time, day or night. We are here for you.';

export const pages = [
  {
    slug: 'home', title: 'Home', nav_group: '', nav_order: 0,
    hero_title: 'Serving Families With Compassion, Dignity & Respect',
    hero_subtitle: 'Your trusted funeral and cremation provider in Laredo, Rio Bravo, El Cenizo and surrounding Webb County communities.',
    sections: [
      { heading: 'Your Trusted Funeral Home in Laredo, TX', layout: 'split', image: '/images/section-flowers.jpg', icon: 'home', body:
        'Our experienced staff support families through a difficult time. We offer personalized services that reflect the wishes of your loved one and of the family arranging the service, and we guide you through the many decisions required to create a lasting, personal tribute.\n\nYou can reach us at any hour for immediate help, visit us at your convenience, or explore our services from home. Families can also pre-plan their own services.' },
      { heading: 'Our Mission', layout: 'banner', image: '/images/section-agave.jpg', icon: 'heart', body:
        'To be the primary provider of funeral and cremation services that help families heal. We promise compassionate care, high integrity and excellence, with a focus on memorable remembrance, celebrations of life, and memorialization of the time you shared.' },
      { heading: 'Why Choose Gámez & Sons', layout: 'cards', icon: 'shield', body:
        'Care you can count on, every hour of every day.\n\n- 24/7 service: immediate assistance whenever you need us\n- Affordability guaranteed: across our products and services\n- Flexible with your budget: we work with each family\n- Obituaries online: published on our website\n- 365 days of grief support: we are with you long after the service\n- Personalized services: that honor your loved one\'s wishes\n- Pre-planning services: record your final wishes in advance\n- Paperwork handled: help with all funeral and cremation forms' },
      { heading: 'Our Services', layout: 'cards', icon: 'candle', body:
        'Meaningful, affordable ways to honor a life.\n\n- {home} [Traditional Services](/traditional-services): visitation, funeral and graveside services\n- {candle} [Cremation Services](/cremation-services): memorial options and permanent resting places\n- {star} [Personalization](/personalization): photos, music, video and keepsakes\n- {flag} [Veteran Services](/veteran-services): military honors and VA benefit support\n- {calendar} [Planning Ahead](/planning-ahead): peace of mind for you and your family\n- {phone} [Immediate Need](/immediate-need): call us now, day or night' },
      { heading: 'Pet Cremation', layout: 'split-reverse', image: '/images/section-succulents.jpg', icon: 'paw', body:
        'Pets are family, and losing a devoted companion is painful. Cremation can be a voluntary act of love and a way to pay final tribute to a pet.\n\n**Our mission:** we care for every animal as we would want our own pet cared for.\n\n**Our guarantee:** families receive only their own pet\'s cremated remains.' },
    ],
  },
  {
    slug: 'immediate-need', title: 'Immediate Need', nav_group: 'Services', nav_order: 1,
    hero_title: 'Immediate Funeral Assistance',
    hero_subtitle: 'If a death has just occurred, call us now. We are available 24 hours a day, 7 days a week.',
    sections: [
      { heading: 'If a Death Has Just Occurred', body:
        'Please call us at (956) 701-3459 and a member of our team will guide you through the first steps. To begin arrangements we will ask for some information, so it helps to have the following ready.' },
      { heading: 'Information We Will Ask For', body:
        '### Details of the person who died\n- Full name, date of birth, date and time of death\n- Social Security number\n\n### Preparation and permissions\n- Whether a doctor or coroner has been notified\n- Whether the body has been released for removal\n- Whether permission is given to embalm or cremate, and who gave it\n\n### Physician\n- Name, phone, email and office address of the doctor signing the death certificate\n\n### Person legally responsible for disposition\n- Full name, relationship, address, phone numbers and best time to reach them\n\n### Prearrangements\n- Whether a prearrangement is already on file with us, and under what name' },
    ],
  },
  {
    slug: 'services-overview', title: 'Services Overview', nav_group: 'Services', nav_order: 2,
    hero_title: 'Services We Provide',
    hero_subtitle: 'Personal, affordable options for honoring a loved one in a way that fits who they were.',
    sections: [
      { heading: 'Traditional Services', body: 'Whether the family chooses burial or cremation, a funeral service is a key way to honor the person who died and begin healing. Our service options are meaningful and affordable.' },
      { heading: 'Cremation Services', body: 'Families who choose cremation can select a full funeral service, a memorial service, or a more private gathering. Permanent resting places are available for cremated remains.' },
      { heading: 'Personalization', body: 'Our funeral directors help design services that are distinctive and reflect your loved one. Options include tribute videos, keepsakes, and live streaming for relatives and friends who cannot attend in person.' },
      { heading: 'Veteran Services', body: 'Serving those who served our country is a great honor. We help families obtain veteran benefits and arrange a service suited to a veteran.' },
    ],
  },
  {
    slug: 'traditional-services', title: 'Traditional Services', nav_group: 'Services', nav_order: 3,
    hero_title: 'Traditional Funeral Services in Laredo, TX',
    hero_subtitle: 'A meaningful, dignified farewell that reflects your loved one\'s values, beliefs and influence on others.',
    sections: [
      { heading: 'Visitation', body: 'A period set aside for family and friends to gather and say goodbye, surrounded by those closest to your loved one. The visitation can be personalized with a tribute video, meaningful items or displays, or photographs.' },
      { heading: 'Funeral Service', body: 'The service can take place in our chapel, a church, or another venue you choose. It can include stories, music or scripture that honor the person who died. When clergy are not chosen, life celebrants can lead the service; they are trained to create experiences that support the beginning of healing.' },
      { heading: 'Graveside Service', body: 'Also called a committal service, it usually follows the funeral service directly. It can also be a small, intimate gathering of the people closest to your loved one.' },
      { heading: 'Contact Us Today', body: 'Let us help you plan every detail and offer guidance and comfort throughout the process.\n\n' + call },
    ],
  },
  {
    slug: 'cremation-services', title: 'Cremation Services', nav_group: 'Services', nav_order: 4,
    hero_title: 'Affordable Cremation in Laredo, TX',
    hero_subtitle: 'Several options for a public gathering and for a final resting place.',
    sections: [
      { heading: 'Traditional Funeral Service Followed by Cremation', body: 'Hold a traditional funeral with a final viewing, visitation or wake, and funeral service, followed by cremation instead of in-ground burial. Cremated remains may be kept in an urn, scattered, or placed in a columbarium. The cost includes the funeral service fees and the cremation fees.' },
      { heading: 'Memorial Service', body: 'A memorial service can take place in our chapel, a church, or another venue you select, with stories, music or scripture to honor your loved one. Life celebrants can lead the service when a clergy member is not chosen.' },
      { heading: 'Graveside Service', body: 'A graveside or committal service typically follows the funeral service, or can be a small, intimate gathering of the closest family and friends.' },
      { heading: 'Permanent Memorialization', body: '- **Keeping an urn at home:** a common choice, with a fitting urn of your choosing\n- **Columbarium niche:** a place to visit for comfort and remembrance\n- **Burying the urn:** an in-ground burial that provides a final resting place\n- **Scattering:** in a location that was special to your loved one' },
    ],
  },
  {
    slug: 'personalization', title: 'Personalization', nav_group: 'Services', nav_order: 5,
    hero_title: 'A Personalized Funeral Plan',
    hero_subtitle: 'Personalizing a service starts with memories of the person: their hobbies, interests and favorite places.',
    sections: [
      { heading: 'Photos and Albums', body: '- Photo collages on poster boards displayed on easels\n- Monitors showing pictures or a slideshow during visitation\n- Photos printed in memorial folders, registry books, or on urns' },
      { heading: 'Videos', body: 'A personalized video with special photos and music can share the person\'s life, and become a keepsake families pass down for generations.' },
      { heading: 'Artwork', body: 'Artwork of the person, or created in their honor, adds meaning to a service: sculptures, a slideshow of drawings, or art displayed throughout the funeral home.' },
      { heading: 'Music', body: 'Live or recorded music can be calming and comforting. Play their favorite songs, songs they wrote, or invite musically gifted family and friends to perform.' },
      { heading: 'Readings of Poetry & Literature', body: 'Passages from favorite books or poems help create a reflective service. Invite friends and family to read passages or poems, or to share their own writing.' },
    ],
  },
  {
    slug: 'veteran-services', title: 'Veteran Services', nav_group: 'Services', nav_order: 6,
    hero_title: 'Veteran Funeral Services in Laredo, TX',
    hero_subtitle: 'We recognize the sacrifices of those who served, and help families complete the paperwork for VA benefits.',
    sections: [
      { heading: 'VA Burial Benefits and Memorial Items', body: 'VA burial benefits help service members, veterans and their families plan and pay for a burial or memorial service in a VA national cemetery. The VA also provides memorial items to honor military service.' },
      { heading: 'Who Qualifies?', body: 'Veterans, service members, spouses and dependents may be eligible if:\n\n- The veteran did not receive a dishonorable discharge\n- The service member died on active duty, active duty for training, or inactive duty for training\n- The person is the spouse or minor child of a veteran\n- In some cases, the unmarried adult dependent child of a veteran' },
      { heading: 'Military Funeral Honors', body: 'Honors may include "Taps," a rifle detail, a color guard, and uniformed service members who fold and present the U.S. flag. The burial flag usually goes to the next of kin or a close friend.' },
      { heading: 'Applying for Benefits', body: '- Death benefits can help cover burial, funeral and transportation costs\n- A claim for a non-service-connected burial allowance must be filed within two years of the burial or cremation; service-connected claims have no time limit\n- Apply online through the VA website, or mail a completed VA Form 21P-530\n- Free headstones for unmarked graves of eligible veterans: VA Form 10-1330\n- More information: 1-800-827-1000' },
    ],
  },
  {
    slug: 'planning-ahead', title: 'Planning Ahead', nav_group: 'Planning Ahead', nav_order: 1,
    hero_title: 'Funeral Planning in Laredo, TX',
    hero_subtitle: 'Preplanning gives you peace of mind that your final wishes will be honored.',
    sections: [
      { heading: 'Benefits of Funeral Preplanning', body: '### Your wishes are known\nStating your wishes in advance helps prevent disagreements among family members.\n\n### Peace of mind\nWe guarantee we will make the arrangements you want, as you directed. Your family can grieve more peacefully.\n\n### Flexible funding\nPreplanning gives you more ways to pay, including preneed insurance, life insurance and other options.\n\n### Relief for your family\nMore than 150 decisions must be made within the first day or two after a death. Making them yourself means your loved ones won\'t have to guess.' },
      { heading: 'Common Questions', body: '### What steps are involved?\nWrite down your wishes, note the type of service and cemetery, then meet with a funeral director to review options and payment methods.\n\n### Do I have to pay in advance?\nNo. Preplanning only records your wishes. Most families who preplan also prefund, which relieves their family\'s financial burden.\n\n### Can I transfer plans?\nYes. Plans made elsewhere can be moved to us, and if you move away we will help transfer your arrangements.' },
      { heading: 'Start Today', body: 'Request your free preplanning guide through our contact page, or call (956) 701-3459.' },
    ],
  },
  {
    slug: 'pre-planning-checklist', title: 'Pre-Planning Checklist', nav_group: 'Planning Ahead', nav_order: 2,
    hero_title: 'Pre-Planning Funeral Checklist',
    hero_subtitle: 'Preparing your service in advance can ease stress for your family.',
    sections: [
      { heading: '1. Choose the Type of Service You Want', body: '- Choose the funeral home and director\n- Decide on traditional, cremation or donation\n- If burial, decide where you want to be buried\n- Review caskets and urns\n- Select the clothing you want to be dressed in\n- Consider the location: funeral home, religious facility, meaningful building, or graveside\n- Decide on flowers, or donations to a charity\n- Choose pallbearers and who will officiate or take part\n- Choose the songs you want played\n- Write your obituary, or note what it should include' },
      { heading: '2. Choose Who Is in Charge', body: '- Make sure someone, ideally your executor, has a copy of your will\n- Give a trusted person a list of important accounts and your wishes for the service\n- Name someone as your power of attorney\n- Arrange for someone to cancel utilities and subscriptions' },
      { heading: '3. Choose to Pay in Advance', body: 'Paying in advance can benefit you and your survivors financially. When possible, prepay for:\n\n- Cemetery services and a burial plot\n- All funeral arrangements, including casket, urn, flowers, transportation and specialized services' },
    ],
  },
  {
    slug: 'about-us', title: 'About Us', nav_group: 'About', nav_order: 1,
    hero_title: 'About Gámez & Sons',
    hero_subtitle: 'A family-run funeral home serving Laredo and Webb County for more than 11 years.',
    sections: [
      { heading: 'Who We Are', body: 'Gámez & Sons Funeral and Cremation Services is staffed by licensed professionals and is a member of funeral service associations, following Texas Funeral Service Commission standards. We serve Laredo, Rio Bravo, El Cenizo and the greater Webb County area.' },
      { heading: 'Our Mission', body: 'To be the primary provider of funeral and cremation services that help families heal, with compassionate care, high integrity and excellence.' },
    ],
  },
  {
    slug: 'our-staff', title: 'Our Staff', nav_group: 'About', nav_order: 2,
    hero_title: 'Our Staff and Licensed Professionals',
    hero_subtitle: 'Contact any member of our team at any time.',
    sections: [
      { heading: 'Feliciano Gamez IV, Funeral Director in Charge', body: 'Feliciano is a lifelong Laredo resident. He graduated from Commonwealth Institute of Mortuary Science in 2007 and has worked in the funeral industry for more than fourteen years. He oversees daily operations, making sure families receive the best possible service and the staff have the support they need. Outside of work he enjoys family, reading and playing guitar.' },
      { heading: 'Martina G. Gamez, Family Service Counselor Manager', body: 'Martina spent more than 30 years working for LISD and UISD combined. She now leads our preneed division as a licensed preneed agent, helping families prearrange their services, and trains and supports our family service counselors. She has been an active member of the Catholic music ministry in the Diocese of Laredo for 36 years.' },
    ],
  },
  {
    slug: 'the-grieving-process', title: 'The Grieving Process', nav_group: 'Grief Support', nav_order: 1,
    hero_title: 'Understanding the Grieving Process',
    hero_subtitle: 'Everyone handles loss differently, but many people share common feelings while recovering.',
    sections: [
      { heading: 'The Stages of Grief', body: 'Reactions to grief are often described as stages. They don\'t follow a strict timeline or order; you may move between them, return to an earlier one, and cycle through them several times.' },
      { heading: 'Denial', body: 'Shock, numbness or detachment. This is a survival response that helps you handle basic tasks in the days after a loss.' },
      { heading: 'Anger', body: 'Anger can be a bridge out of numbness, and may be aimed at doctors, family, the person who died, or God. It is a normal part of healing, and allowing yourself to feel it tends to reduce it over time.' },
      { heading: 'Guilt (Bargaining)', body: 'Repeated "if only" and "what if" thoughts, wondering whether you could have changed the outcome.' },
      { heading: 'Depression', body: 'Deep sadness and emptiness as the loss sinks in. This is a normal, necessary response to a major loss, not a sign of mental illness, and a step toward healing.' },
      { heading: 'Acceptance', body: 'Over time the loss becomes part of your personal history rather than the center of your life, bringing more peace and renewed interest in the things you once enjoyed.' },
      { heading: 'How Long Will I Feel This Way?', body: 'There is no correct amount of time. Many experts agree it is not unusual to take at least a year to move past grief. If grief makes daily life difficult for an extended period, seek professional counseling, or contact us for assistance.' },
    ],
  },
  {
    slug: 'frequent-questions', title: 'Frequent Questions', nav_group: 'Resources', nav_order: 1,
    hero_title: 'Frequently Asked Questions',
    hero_subtitle: 'Answers to common questions about funeral and cremation services.',
    sections: [
      { heading: 'What services do funeral directors perform?', body: 'We support grieving families and arrange cremation, burial or memorial services: transferring the deceased, preparing the body, filing permits and forms, obtaining death certificates, working with cemeteries and crematories, writing and publishing the obituary, booking clergy, music, flowers and transportation, directing the service, and helping with claims such as Social Security and VA benefits.' },
      { heading: 'What is the purpose of a funeral?', body: 'A funeral gives the living a way to honor the deceased and celebrate their life, a setting to express feelings openly, permission to grieve, and a shared space where people facing the same loss can find strength in one another.' },
      { heading: 'What are the choices for funeral services?', body: 'Four main types: a traditional funeral, a memorial service, a committal service, and an affirmation or celebration of life service.' },
      { heading: 'Can you still have a funeral if you choose cremation?', body: 'Yes. Cremation and burial only determine what happens to the body. A funeral can still be held to honor and remember the person.' },
      { heading: 'What should I bring to the arrangement conference?', body: '- Advance directives such as a will, disposition directive, or pre-need contract\n- Military discharge papers\n- Details of any cemetery property owned\n- A recent photo and personal items for the viewing\n- Personal information: full legal name, address, marital status, Social Security number, date and place of birth, military service details, occupation, parents\' names (including mother\'s maiden name), and next of kin' },
    ],
  },
  {
    slug: 'contact-us', title: 'Contact Us', nav_group: 'About', nav_order: 3,
    hero_title: 'Contact Us',
    hero_subtitle: 'Questions about funeral costs or want to schedule an appointment? Call us or send a message.',
    sections: [
      { heading: 'How Can We Help?', body: 'Reach our staff or a funeral director by phone, email, the form below, or in person. We are available 24 hours a day, 7 days a week.' },
    ],
  },
];
