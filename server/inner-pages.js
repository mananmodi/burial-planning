// Icon-and-picture versions of the inner pages. Applied once (see db.js) to pages that still hold the plain
// seed text; afterwards everything is edited in Admin > Website pages.
const call = 'Call (956) 701-3459 any time, day or night. We are here for you.';

export const iconicPages = {
  'immediate-need': {
    hero_image: '/images/hero-forms.jpg',
    sections: [
      { heading: 'If a Death Has Just Occurred', layout: 'split', icon: 'phone', image: '/images/contact.jpg',
        body: 'Please call us at **(956) 701-3459** and a member of our team will guide you through the first steps, 24 hours a day, 7 days a week.\n\nTo begin arrangements we will ask for some information, so it helps to have the following ready.' },
      { heading: 'Information We Will Ask For', layout: 'cards', icon: 'file',
        body: '- {users} Person who died: Full name, date of birth, date and time of death, and Social Security number\n- {shield} Preparation and permissions: Whether a doctor or coroner has been notified, the body released, and who gave permission to embalm or cremate\n- {book} Physician: Name, phone, email and office address of the doctor signing the death certificate\n- {home} Person legally responsible: Full name, relationship, address, phone numbers and best time to reach them\n- {calendar} Prearrangements: Whether a prearrangement is already on file with us, and under what name' },
      { heading: 'We Are Here For You', layout: 'banner', icon: 'heart', image: '/images/section-flowers.jpg', body: call },
    ],
  },
  'services-overview': {
    hero_image: '/images/traditional.jpg',
    sections: [
      { heading: 'Ways We Can Help You Honor Your Loved One', layout: 'cards', icon: 'heart',
        body: 'Personal, affordable options that fit who they were.\n\n- {flower} [Traditional Services](/traditional-services): Burial or cremation, a funeral service is a key way to honor the person who died and begin healing\n- {candle} [Cremation Services](/cremation-services): A full funeral service, a memorial service, or a private gathering, with permanent resting places for remains\n- {star} [Personalization](/personalization): Tribute videos, keepsakes and live streaming for relatives who cannot attend\n- {flag} [Veteran Services](/veteran-services): We help families obtain veteran benefits and arrange a service suited to a veteran' },
      { heading: 'Traditional Services', layout: 'split', icon: 'flower', image: '/images/traditional-2.jpg',
        body: 'Whether the family chooses burial or cremation, a funeral service is a key way to honor the person who died and begin healing. Our service options are meaningful and affordable.\n\n[Learn about traditional services →](/traditional-services)' },
      { heading: 'Cremation Services', layout: 'split-reverse', icon: 'candle', image: '/images/cremation.jpg',
        body: 'Families who choose cremation can select a full funeral service, a memorial service, or a more private gathering. Permanent resting places are available for cremated remains.\n\n[Learn about cremation →](/cremation-services)' },
      { heading: 'Personalization', layout: 'split', icon: 'star', image: '/images/personal.jpg',
        body: 'Our funeral directors help design services that are distinctive and reflect your loved one. Options include tribute videos, keepsakes, and live streaming for relatives and friends who cannot attend in person.\n\n[See personalization ideas →](/personalization)' },
      { heading: 'Veteran Services', layout: 'split-reverse', icon: 'flag', image: '/images/veteran.jpg',
        body: 'Serving those who served our country is a great honor. We help families obtain veteran benefits and arrange a service suited to a veteran.\n\n[Veteran benefits →](/veteran-services)' },
    ],
  },
  'traditional-services': {
    hero_image: '/images/traditional.jpg',
    sections: [
      { heading: 'A Dignified Farewell', layout: 'split', icon: 'flower', image: '/images/traditional-2.jpg',
        body: 'A traditional funeral reflects your loved one\'s values, beliefs and influence on others. It usually has three parts, each of which we personalize with you.' },
      { heading: 'The Parts of a Traditional Service', layout: 'cards', icon: 'heart',
        body: '- {users} Visitation: A period for family and friends to gather and say goodbye. Add a tribute video, meaningful displays or photographs\n- {candle} Funeral Service: In our chapel, a church or another venue, with stories, music or scripture. Life celebrants can lead when clergy are not chosen\n- {flower} Graveside Service: Also called a committal service. It usually follows the funeral service, or can be a small, intimate gathering' },
      { heading: 'Contact Us Today', layout: 'banner', icon: 'phone', image: '/images/section-agave.jpg',
        body: 'Let us help you plan every detail and offer guidance and comfort throughout the process.\n\n' + call },
    ],
  },
  'cremation-services': {
    hero_image: '/images/cremation.jpg',
    sections: [
      { heading: 'Choose How You Gather', layout: 'cards', icon: 'candle',
        body: '- {flower} Funeral Service Then Cremation: A final viewing, visitation and funeral service, followed by cremation instead of burial. Cost includes the service and cremation fees\n- {candle} Memorial Service: In our chapel, a church or another venue, with stories, music or scripture to honor your loved one\n- {users} Graveside Service: A committal service that follows the funeral, or a small gathering of the closest family and friends' },
      { heading: 'Permanent Memorialization', layout: 'steps', icon: 'heart',
        body: 'Cremated remains may be kept, placed, buried or scattered.\n\n- {home} Keeping an urn at home: A common choice, with a fitting urn of your choosing\n- {pin} Columbarium niche: A place to visit for comfort and remembrance\n- {leaf} Burying the urn: An in-ground burial that provides a final resting place\n- {sun} Scattering: In a location that was special to your loved one' },
      { heading: 'Urns and Keepsakes', layout: 'split', icon: 'heart', image: '/images/urn.jpg',
        body: 'From a classic metal urn to keepsake jewelry, our team will help you choose a fitting way to keep your loved one close.' },
      { heading: 'A Place to Remember', layout: 'split-reverse', icon: 'pin', image: '/images/niche.jpg',
        body: 'A columbarium niche or a quiet place in nature gives the family somewhere to visit, now and for generations.' },
    ],
  },
  personalization: {
    hero_image: '/images/personal.jpg',
    sections: [
      { heading: 'Make It Truly Theirs', layout: 'split', icon: 'star', image: '/images/personal.jpg',
        body: 'Personalizing a service starts with memories of the person: their hobbies, interests and favorite places. Here are some of the ways families make a service their own.' },
      { heading: 'Ways to Personalize', layout: 'cards', icon: 'heart',
        body: '- {camera} Photos and Albums: Photo collages on easels, monitors with a slideshow, and photos printed in memorial folders, registry books or on urns\n- {video} Videos: A video of special photos and music shares a life, and becomes a keepsake for generations\n- {brush} Artwork: Sculptures, drawings or art displayed throughout the funeral home add meaning\n- {music} Music: Favorite songs, songs they wrote, or family and friends who perform live\n- {book} Poetry & Literature: Passages from favorite books or poems, read or written by loved ones' },
      { heading: 'Music Brings Comfort', layout: 'banner', icon: 'music', image: '/images/music.jpg',
        body: 'Live or recorded music can be calming and comforting. Tell us what they loved and we will help you shape the service.' },
    ],
  },
  'veteran-services': {
    hero_image: '/images/veteran-2.jpg',
    sections: [
      { heading: 'VA Burial Benefits and Memorial Items', layout: 'split', icon: 'flag', image: '/images/veteran.jpg',
        body: 'VA burial benefits help service members, veterans and their families plan and pay for a burial or memorial service in a VA national cemetery. The VA also provides memorial items to honor military service. We help families complete the paperwork.' },
      { heading: 'Who Qualifies?', layout: 'cards', icon: 'shield',
        body: 'Veterans, service members, spouses and dependents may be eligible if:\n\n- {medal} Honorable service: The veteran did not receive a dishonorable discharge\n- {flag} Died on duty: The service member died on active duty, active duty for training, or inactive duty for training\n- {users} Spouse or child: The person is the spouse or minor child of a veteran\n- {home} Dependents: In some cases, the unmarried adult dependent child of a veteran' },
      { heading: 'Military Funeral Honors', layout: 'banner', icon: 'medal', image: '/images/veteran-2.jpg',
        body: 'Honors may include "Taps," a rifle detail, a color guard, and uniformed service members who fold and present the U.S. flag. The burial flag usually goes to the next of kin or a close friend.' },
      { heading: 'Applying for Benefits', layout: 'steps', icon: 'file',
        body: '- {wallet} Know what is covered: Death benefits can help cover burial, funeral and transportation costs\n- {clock} Mind the deadline: A non-service-connected burial allowance claim must be filed within two years of the burial or cremation; service-connected claims have no time limit\n- {file} Submit the claim: Apply online through the VA website, or mail a completed VA Form 21P-530\n- {flag} Headstone: Free headstones for unmarked graves of eligible veterans use VA Form 10-1330\n- {phone} Questions: Call the VA at 1-800-827-1000' },
    ],
  },
  'planning-ahead': {
    hero_image: '/images/planning.jpg',
    sections: [
      { heading: 'Benefits of Funeral Preplanning', layout: 'cards', icon: 'calendar',
        body: '- {heart} Your wishes are known: Stating your wishes in advance helps prevent disagreements among family members\n- {shield} Peace of mind: We guarantee we will make the arrangements you want, as you directed\n- {wallet} Flexible funding: More ways to pay, including preneed insurance, life insurance and other options\n- {users} Relief for your family: More than 150 decisions must be made within a day or two of a death. Make them yourself so loved ones don\'t have to guess' },
      { heading: 'Plan on Your Own Time', layout: 'split', icon: 'calendar', image: '/images/planning.jpg',
        body: 'Preplanning only records your wishes. Most families who preplan also prefund, which relieves their family\'s financial burden.\n\n[Start planning online →](/plans)' },
      { heading: 'Common Questions', layout: 'accordion', icon: 'question',
        body: '### What steps are involved?\nWrite down your wishes, note the type of service and cemetery, then meet with a funeral director to review options and payment methods.\n\n### Do I have to pay in advance?\nNo. Preplanning only records your wishes. Most families who preplan also prefund, which relieves their family\'s financial burden.\n\n### Can I transfer plans?\nYes. Plans made elsewhere can be moved to us, and if you move away we will help transfer your arrangements.' },
      { heading: 'Start Today', layout: 'banner', icon: 'phone', image: '/images/section-succulents.jpg',
        body: 'Request your free preplanning guide through our contact page, or call (956) 701-3459.' },
    ],
  },
  'pre-planning-checklist': {
    hero_image: '/images/checklist.jpg',
    sections: [
      { heading: '1. Choose the Type of Service You Want', layout: 'steps', icon: 'check',
        body: '- {home} Funeral home: Choose the funeral home and director\n- {candle} Type of service: Traditional, cremation or donation\n- {pin} Burial place: If burial, decide where you want to be buried\n- {star} Caskets and urns: Review the options\n- {users} Clothing: Select what you want to be dressed in\n- {pin} Location: Funeral home, religious facility, meaningful building or graveside\n- {flower} Flowers or donations: Flowers, or donations to a charity\n- {users} People: Pallbearers and who will officiate or take part\n- {music} Music: The songs you want played\n- {book} Obituary: Write it, or note what it should include' },
      { heading: '2. Choose Who Is in Charge', layout: 'cards', icon: 'shield',
        body: '- {file} Your will: Make sure someone, ideally your executor, has a copy\n- {book} Accounts and wishes: Give a trusted person a list of important accounts and your wishes for the service\n- {shield} Power of attorney: Name someone you trust\n- {phone} Cancellations: Arrange for someone to cancel utilities and subscriptions' },
      { heading: '3. Choose to Pay in Advance', layout: 'split', icon: 'wallet', image: '/images/checklist.jpg',
        body: 'Paying in advance can benefit you and your survivors financially. When possible, prepay for:\n\n- Cemetery services and a burial plot\n- All funeral arrangements, including casket, urn, flowers, transportation and specialized services' },
    ],
  },
  'about-us': {
    hero_image: '/images/about.jpg',
    sections: [
      { heading: 'Who We Are', layout: 'split', icon: 'users', image: '/images/about.jpg',
        body: 'Gámez & Sons Funeral and Cremation Services is staffed by licensed professionals and is a member of funeral service associations, following Texas Funeral Service Commission standards. We serve Laredo, Rio Bravo, El Cenizo and the greater Webb County area.' },
      { heading: 'What Families Can Count On', layout: 'cards', icon: 'shield',
        body: '- {users} Family owned: A family-run funeral home serving Webb County for more than 11 years\n- {shield} Licensed professionals: Texas Funeral Service Commission standards, every time\n- {clock} Always available: 24 hours a day, 7 days a week\n- {tag} Affordable: Meaningful services with clear, upfront pricing' },
      { heading: 'Our Mission', layout: 'banner', icon: 'heart', image: '/images/section-flowers.jpg',
        body: 'To be the primary provider of funeral and cremation services that help families heal, with compassionate care, high integrity and excellence.' },
    ],
  },
  'our-staff': {
    hero_image: '/images/about.jpg',
    sections: [
      { heading: 'Feliciano Gamez IV, Funeral Director in Charge', layout: 'cards', icon: 'users',
        body: 'Contact any member of our team at any time.\n\n- {home} Lifelong Laredo resident: Graduated from Commonwealth Institute of Mortuary Science in 2007\n- {clock} Over fourteen years: In the funeral industry, overseeing daily operations so every family receives the best possible service\n- {music} Outside of work: Family, reading and playing guitar' },
      { heading: 'Martina G. Gamez, Family Service Counselor Manager', layout: 'cards', icon: 'users',
        body: '- {book} 30+ years: Worked for LISD and UISD combined\n- {calendar} Preneed leader: A licensed preneed agent who helps families prearrange their services, and trains and supports our family service counselors\n- {music} Music ministry: Active member of the Catholic music ministry in the Diocese of Laredo for 36 years' },
      { heading: 'Here When You Need Us', layout: 'banner', icon: 'phone', image: '/images/section-agave.jpg', body: call },
    ],
  },
  'the-grieving-process': {
    hero_image: '/images/grief.jpg',
    sections: [
      { heading: 'The Stages of Grief', layout: 'split', icon: 'heart', image: '/images/grief-2.jpg',
        body: 'Reactions to grief are often described as stages. They don\'t follow a strict timeline or order; you may move between them, return to an earlier one, and cycle through them several times.' },
      { heading: 'Five Common Feelings', layout: 'steps', icon: 'candle',
        body: '- {shield} Denial: Shock, numbness or detachment. A survival response that helps you handle basic tasks in the days after a loss\n- {flag} Anger: A bridge out of numbness, aimed at doctors, family, the person who died, or God. Allowing yourself to feel it tends to reduce it over time\n- {question} Guilt (Bargaining): Repeated "if only" and "what if" thoughts, wondering whether you could have changed the outcome\n- {candle} Depression: Deep sadness and emptiness as the loss sinks in. A normal, necessary response, not a sign of mental illness\n- {sun} Acceptance: The loss becomes part of your history rather than the center of your life, bringing peace and renewed interest in things you enjoyed' },
      { heading: 'How Long Will I Feel This Way?', layout: 'banner', icon: 'clock', image: '/images/section-succulents.jpg',
        body: 'There is no correct amount of time. Many experts agree it is not unusual to take at least a year to move past grief. If grief makes daily life difficult for an extended period, seek professional counseling, or contact us for assistance.' },
    ],
  },
  'frequent-questions': {
    hero_image: '/images/faq.jpg',
    sections: [
      { heading: 'Common Questions', layout: 'accordion', icon: 'question',
        body: '### What services do funeral directors perform?\nWe support grieving families and arrange cremation, burial or memorial services: transferring the deceased, preparing the body, filing permits and forms, obtaining death certificates, working with cemeteries and crematories, writing and publishing the obituary, booking clergy, music, flowers and transportation, directing the service, and helping with claims such as Social Security and VA benefits.\n\n### What is the purpose of a funeral?\nA funeral gives the living a way to honor the deceased and celebrate their life, a setting to express feelings openly, permission to grieve, and a shared space where people facing the same loss can find strength in one another.\n\n### What are the choices for funeral services?\nFour main types: a traditional funeral, a memorial service, a committal service, and an affirmation or celebration of life service.\n\n### Can you still have a funeral if you choose cremation?\nYes. Cremation and burial only determine what happens to the body. A funeral can still be held to honor and remember the person.' },
      { heading: 'What Should I Bring to the Arrangement Conference?', layout: 'cards', icon: 'file',
        body: '- {file} Advance directives: A will, disposition directive, or pre-need contract\n- {flag} Military papers: Discharge papers\n- {pin} Cemetery property: Details of any cemetery property owned\n- {camera} Photos: A recent photo and personal items for the viewing\n- {users} Personal information: Full legal name, address, marital status, Social Security number, date and place of birth, military service, occupation, parents\' names (including mother\'s maiden name) and next of kin' },
      { heading: 'Still Have a Question?', layout: 'banner', icon: 'phone', image: '/images/section-flowers.jpg', body: call },
    ],
  },
  'contact-us': {
    hero_image: '/images/contact.jpg',
    sections: [
      { heading: 'How Can We Help?', layout: 'cards', icon: 'phone',
        body: 'Reach our staff or a funeral director by phone, email, the form below, or in person. We are available 24 hours a day, 7 days a week.\n\n- {phone} Call us: (956) 701-3459, day or night\n- {mail} Write to us: Use the form below and we will reply quickly\n- {pin} Visit us: Our team is happy to meet you in person\n- {clock} Always open: 24 hours a day, 7 days a week' },
    ],
  },
};
