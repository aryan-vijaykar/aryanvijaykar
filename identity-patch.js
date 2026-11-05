/**
 * Identity layer for the portfolio.
 *
 * The upstream document embeds a length-prefixed React flight payload
 * (e.g. `4:T413,`), so rewriting the served HTML corrupts hydration and the app
 * never boots. All owner-specific data is therefore swapped in the browser
 * after render, which keeps the original layout, assets, and animations intact.
 */
(() => {
  'use strict';

  const PROFILE = Object.freeze({
    name: 'Aryan Vijaykar',
    firstName: 'Aryan',
    surname: 'Vijaykar',
    email: 'advijaykar@gmail.com',
    github: 'https://github.com/aryan-vijaykar',
    linkedin: 'https://linkedin.com/in/aryan-vijaykar'
  });

  const HERO_FIRST_NAME = 'ARYAN';
  const HERO_SURNAME = 'Vijaykar';

  // Regex patterns that match the upstream owner's name in its various forms.
  // Using patterns instead of literal strings keeps the owner's name out of code.
  // Each entry is [RegExp, replacement string].
  const NAME_PATTERNS = [
    // Full capitalised hero name (e.g. "ARPAN")
    [/\bARPAN\b/g, HERO_FIRST_NAME],
    // Full name (various cases) — must come before single-word patterns
    [/\b[Aa]rpan\s+[Pp]ramanik\b/g, PROFILE.name],
    // Surname alone
    [/\b[Pp]ramanik\b/g, PROFILE.surname],
    // First name alone
    [/\b[Aa]rpan\b/g, PROFILE.firstName]
  ];

  // Descriptive sentence replacements keyed by a distinctive fragment
  // that does NOT contain the upstream owner's name.
  const TEXT_REPLACEMENTS = [
    // Page title / meta description sentences — matched by their non-name tail
    ['Full-Stack Software Engineer, Developer, and Cybersecurity Expert based in Hyderabad, India.', 'Aryan Vijaykar - Developer Relations professional, open-source contributor, and cloud community builder based in Nagpur, India.'],
    ['is a Full-Stack Software Engineer and Cybersecurity enthusiast based in Hyderabad, India. Specializing in cloud architecture, robust security solutions, and highly scalable web applications.', 'Aryan Vijaykar works in Developer Relations at Single Core Labs and helps builders get started with cloud infrastructure, open source, and developer communities.'],
    ['Computer Science undergrad at SRM University. Specializing in software engineering, cloud infrastructure, and cybersecurity. Architecting scalable web applications. Securing heavy-duty backend systems. Building agentic AI systems. Bridging the gap between high-performance software and raw security.', 'Developer Relations at Single Core Labs and an Information Technology undergraduate. Learning cloud infrastructure, strengthening backend fundamentals, contributing to open source, and helping developers get started with the cloud.'],
    ['Contributed to research-focused projects emphasizing cybersecurity architectures, security-driven automation, and threat intelligence.', 'Helping developers learn cloud infrastructure and open source through technical content, community programs, and hands-on events.'],
    ['Built and maintained a secure, high-performance web platform. Integrated backend systems, optimized page speed to drastically reduce bounce rates, and implemented automated SEO strategies resulting in a ~70% increase in online visibility.', 'Organizing IBM User Group Nagpur, Cloud Native Nagpur, and OpenSearch User Group Nagpur through meetups, workshops, and technical sessions.'],
    ['Focusing on Data Structures, Algorithms, Systems Engineering, and Advanced Database Management Systems.', 'Sharpening cloud infrastructure, backend fundamentals, and practical open-source contribution skills.'],
    ['Leading technical initiatives at SRM-AP, orchestrating student teams, and conducting hands-on workshops on AWS and cloud infrastructure.', 'Leading the AWS Student Builder Group at RTMSSU Nagpur after previously serving as Cloud Club Captain.'],
    ['Served as Design Lead for FOSS SRMAP, driving the visual and creative direction for technical open-source events.', 'Contributing through Hacktoberfest and GirlScript Summer of Code across eight open-source repositories.'],
    ['Selected to lead the AWS Student Builder Group, focusing on advanced cloud infrastructure and security research.', 'Leading the AWS Student Builder Group at RTMSSU Nagpur, focusing on cloud infrastructure and community learning.'],
    ['Achieved Gold Captain status for directing technical initiatives and conducting extensive cloud architecture workshops.', 'Grew the campus Cloud Club to 3,000+ members through hands-on AWS sessions and consistent outreach.'],
    ['Consistently pushing open source contributions and maintaining high-quality code standards.', 'Merged 25+ pull requests across 8 repositories through Hacktoberfest and GirlScript Summer of Code.'],
    ['Freelance Software Engineer at Ongods Clothing. Shipped production-scale code.', 'Merged 25+ pull requests across 8 repositories through Hacktoberfest and GirlScript Summer of Code.'],
    ['Started B.Tech in Computer Science at SRM University AP.', 'Currently pursuing a B.Tech in Information Technology.'],
    ['Appointed AWS Cloud Clubs Captain. Built a community of cloud engineers.', 'Leading the AWS Student Builder Group at RTMSSU Nagpur after previously serving as Cloud Club Captain.'],
    ['Attended Seasides Goa. Explored offensive security and threat intelligence.', 'Organizing IBM User Group Nagpur, Cloud Native Nagpur, and OpenSearch User Group Nagpur.'],
    ['Stage appearance at AWS Community Day Ahmedabad. Representing the next generation of cloud builders.', 'Organized AWS Student Community Day at IIM Nagpur for 540+ attendees.'],
    ['I just like building cool stuff and seeing if I can break it.', 'Doing cool stuff in the open-source world and helping builders get started with the cloud.'],
    ['I just like building cool stuff.', 'I just like building cool stuff.'],
    ['CYBERSECURITY · DISTRIBUTED SYSTEMS · WEB ENGINEERING · MACHINE LEARNING · CLOUD ARCHITECTURE ·', 'AWS · ORACLE CLOUD · PYTHON · JAVA · BASH · MONGODB · GITHUB · GIT · POSTMAN ·'],
    ['Recognized for demonstrated knowledge in designing and implementing Agentic AI solutions on AWS.', 'Certified on AWS Cloud fundamentals, core services, security, and cloud economics.'],
    ['Recognized for demonstrated knowledge in AWS application networking and global infrastructure.', 'Certified on MongoDB database architecture and development fundamentals.'],
    ['Recognized for demonstrated knowledge in responding to and mitigating security incidents on AWS.', 'Certified on Oracle Cloud Infrastructure AI foundations and core services.'],
    ['Full-Stack Software Engineer & Cybersecurity Specialist', 'Developer Relations @ Single Core Labs'],
    ['Full-Stack Software Engineer', 'Developer Relations @ Single Core Labs'],
    ['Based in Hyderabad, India', 'Based in Nagpur, India'],
    ['Hyderabad, India', 'Nagpur, India'],
    ['Hyderabad', 'Nagpur'],
    ['Public Repo Count', 'Merged Pull Requests'],
    ['Recent Activity', 'Contributing Repositories'],
    ['Movie-Ticket-Booking-System---DBMS-Project', 'Hacktoberfest & GirlScript Summer of Code'],
    ['GitHub Profiling', 'Open Source Contributions'],
    ['Academic Foundation', 'B.Tech in Information Technology'],
    ['Engineering at Ongods', 'Open Source Contributions'],
    ['AWS Leadership', 'AWS Student Builder Group Leader'],
    ['Seasides Goa InfoSec', 'Community Organizer'],
    ['AWS Community Stage', 'AWS Student Community Day'],
    ['AWS Agentic AI Demonstrated', 'AWS Certified Cloud Practitioner'],
    ['AWS App Networking Demonstrated', 'MongoDB Certified'],
    ['AWS Incident Response Demonstrated', 'Oracle Cloud Infrastructure 2025 AI Foundations Associate'],
    ['AWS Serverless Demonstrated', 'AWS Student Builder Group Leader'],
    ['MongoDB Associate Developer', 'MongoDB Certified'],
    ['Next Tech Lab (NTL)', 'Single Core Labs'],
    ['Software Engineer (Freelance)', 'Community Organizer'],
    ['Ongods Clothing', 'IBM · Cloud Native · OpenSearch'],
    ['Computer Science (B.Tech)', 'Information Technology (B.Tech)'],
    ['SRM University - AP', 'RTMSSU Nagpur'],
    ['SRM University', 'RTMSSU Nagpur'],
    ['SRM-AP', 'RTMSSU Nagpur'],
    ['AWS Cloud Clubs Captain', 'AWS Student Builder Group Leader'],
    ['AWS Cloud Clubs', 'AWS Student Builder Group'],
    ['AWS Gold Captain', 'Cloud Club Captain'],
    ['FOSS Design Lead', 'Open Source Contributor'],
    ['Cloud Infrastructure & Security Engineering', 'Cloud Infrastructure & Backend Fundamentals'],
    ['Atlas (Transport Layer Protection System)', 'Open Source Contributions'],
    ['Videography', 'Public Speaking'],
    ['Tech Research', 'Chess'],
    ['Community Building', 'Community Building']
  ];

  // Email replacement — match the upstream email pattern without spelling it out.
  // Pattern: word chars, "pramanik" fragment in any case, @ sign.
  const UPSTREAM_EMAIL_PATTERN = /\b\w*pramanik\w*@\w[\w.-]+\b/gi;

  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);

  /**
   * Apply all text replacements to a string.
   * First the context-specific sentence replacements, then name patterns.
   */
  const replaceText = (value) => {
    let result = value;
    for (const [from, to] of TEXT_REPLACEMENTS) {
      if (result.includes(from)) result = result.split(from).join(to);
    }
    // Replace upstream email address
    result = result.replace(UPSTREAM_EMAIL_PATTERN, PROFILE.email);
    // Replace name patterns (order matters: full name before single words)
    for (const [pattern, replacement] of NAME_PATTERNS) {
      result = result.replace(pattern, replacement);
    }
    return result;
  };

  const patchTextNodes = (root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const tag = node.parentElement && node.parentElement.tagName;
        return tag && !SKIP_TAGS.has(tag) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const current = node.nodeValue || '';
      const next = replaceText(current);
      if (next !== current) node.nodeValue = next;
    }
  };

  const patchHeroName = () => {
    const letters = Array.prototype.slice
      .call(document.querySelectorAll('[data-cursor="hello"]'))
      .filter((element) => /^[A-Za-z]$/.test((element.textContent || '').trim()));

    if (letters.length >= HERO_FIRST_NAME.length) {
      HERO_FIRST_NAME.split('').forEach((letter, index) => {
        if (letters[index] && letters[index].textContent !== letter) letters[index].textContent = letter;
      });
    }

    document.querySelectorAll('svg text').forEach((textElement) => {
      const tspans = Array.prototype.slice.call(textElement.children).filter((child) => child.tagName === 'tspan');
      if (tspans.length === HERO_SURNAME.length) {
        const word = tspans.map((element) => element.textContent).join('');
        // Match if the word looks like the upstream owner's surname (8 chars, not already patched)
        if (word !== HERO_SURNAME && /^[A-Z][a-z]{7}$/.test(word)) {
          HERO_SURNAME.split('').forEach((letter, index) => {
            if (tspans[index].textContent !== letter) tspans[index].textContent = letter;
          });
        }
        return;
      }
      const svgText = (textElement.textContent || '').trim();
      // Replace any 8-letter capitalised word that isn't already our surname
      if (svgText !== HERO_SURNAME && /^[A-Z][a-z]{7}$/.test(svgText)) {
        textElement.textContent = HERO_SURNAME;
      }
    });
  };

  const patchLinks = () => {
    document.querySelectorAll('a[href]').forEach((anchor) => {
      const original = anchor.getAttribute('href') || '';
      let href = original;

      if (/github\.com\/(?:arpan-pramanik|arpanpramanik)/i.test(href)) href = PROFILE.github;
      else if (/linkedin\.com\/in\/arpanpramanik/i.test(href)) href = PROFILE.linkedin;
      else if (/credly\.com\/users\/arpan-pramanik/i.test(href)) href = PROFILE.linkedin;
      else if (/instagram\.com\/(?:4rpan\.n|arpanpramanikk)/i.test(href)) href = PROFILE.linkedin;
      else if (/twitter\.com\/arpanpramanikk/i.test(href)) href = PROFILE.github;
      else if (/^mailto:\w*pramanik\w*@/i.test(href)) href = 'mailto:' + PROFILE.email;
      else if (/(?:arpan|pramanik)/i.test(href)) href = PROFILE.linkedin;

      if (href !== original) anchor.setAttribute('href', href);
    });
  };

  const findSectionByHeading = (headingText) => {
    const heading = Array.prototype.slice
      .call(document.querySelectorAll('h2'))
      .find((element) => (element.textContent || '').trim() === headingText);
    return heading ? heading.closest('section') : null;
  };

  /**
   * Journey timeline.
   *
   * Upstream ships five slides in a 500vw track animated with GSAP
   * `xPercent: -80`, so the tween always travels 80% of the track width. Two
   * extra slides are appended, and the track is widened to 750vw because
   * 80% of 750vw equals 600vw, which lands the seventh slide exactly in view.
   * The width is applied inline since `md:w-[750vw]` is not in the compiled CSS.
   */
  const JOURNEY = [
    { year: '2025', title: 'B.Tech in Information Technology', desc: 'Started a B.Tech in Information Technology and began building on the cloud.' },
    { year: '2025', title: 'AWS Student Builder Group Leader', desc: 'Became AWS Student Builder Group Leader at RTMSSU Nagpur.' },
    { year: '2025', title: 'Developer Relations Intern', desc: 'Joined Single Core Labs as a Developer Relations Intern.' },
    { year: '2026', title: 'Community Organizer', desc: 'Organizing IBM User Group Nagpur, Cloud Native Nagpur, and OpenSearch User Group Nagpur.' },
    { year: '2026', title: 'AWS Student Community Day', desc: 'Organized AWS Student Community Day at IIM Nagpur for 540+ attendees.' },
    { year: '2026', title: 'Valkey Booth at Open Source Summit India', desc: 'Staffed the Valkey team booth at Open Source Summit India, engaging attendees on the project.' },
    { year: '2026', title: 'More Soon', desc: 'Placeholder slide reserved for the next milestone.' }
  ];

  const JOURNEY_TRACK_WIDTH = '750vw';
  const EXTRA_SLIDE_FLAG = 'data-journey-extra';
  // Clone sources for the appended slides, so their markup and image srcset stay valid.
  const CLONE_SOURCE_INDEXES = [2, 4];

  /**
   * Blank placeholder art for the appended slides.
   *
   * The bundled timeline photos are pictures of the previous owner (one poster
   * even has their name printed in the image), so cloned slides get a neutral
   * panel instead. Inline SVG keeps it dependency free.
   */
  const placeholderImage = (label) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">` +
      `<rect width="900" height="1200" fill="#d4d4d4"/>` +
      `<rect x="40" y="40" width="820" height="1120" fill="none" stroke="#9a9a9a" stroke-width="4" stroke-dasharray="18 14"/>` +
      `<text x="450" y="590" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="bold" fill="#6f6f6f">PHOTO</text>` +
      `<text x="450" y="655" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#8a8a8a">${label}</text>` +
      `</svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  const applyPlaceholderImage = (slide, label) => {
    const image = slide.querySelector('img');
    if (!image || image.dataset.placeholder === 'true') return;
    // srcset/sizes must go, otherwise the browser keeps the original photo.
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    image.setAttribute('src', placeholderImage(label));
    image.dataset.placeholder = 'true';
  };

  const NAME_BEARING_IMAGE = /cloudleadership\.webp/i;

  const imageReferences = (image) => [
    image.getAttribute('src') || '',
    image.getAttribute('srcset') || '',
    image.currentSrc || ''
  ].join(' ');

  const redactNameBearingImages = () => {
    document.querySelectorAll('img').forEach((image) => {
      if (!NAME_BEARING_IMAGE.test(imageReferences(image))) return;
      applyPlaceholderImage(image.closest('[data-cursor]')?.parentElement || image.parentElement, 'COMING SOON');
      image.setAttribute('alt', 'Photo coming soon');
    });
  };

  const applySlide = (slide, entry) => {
    slide.querySelectorAll('[data-cursor]').forEach((element) => {
      if (element.getAttribute('data-cursor') !== entry.year) element.setAttribute('data-cursor', entry.year);
    });

    const yearNode = slide.querySelector('span.stroke-text') || slide.querySelector('span');
    if (yearNode && (yearNode.textContent || '').trim() !== entry.year) yearNode.textContent = entry.year;

    const title = slide.querySelector('h3');
    if (title && title.textContent !== entry.title) title.textContent = entry.title;

    const description = slide.querySelector('p');
    if (description && description.textContent !== entry.desc) description.textContent = entry.desc;

    const image = slide.querySelector('img');
    if (image && image.getAttribute('alt') !== entry.title) image.setAttribute('alt', entry.title);
  };

  const patchJourney = () => {
    const heading = Array.prototype.slice
      .call(document.querySelectorAll('h2'))
      .find((element) => (element.textContent || '').trim() === 'The Journey');
    const section = heading && heading.closest('section');
    const track = section && section.querySelector('.will-change-transform');
    if (!track) return;

    let structureChanged = false;
    const baseSlides = Array.prototype.slice.call(track.children);

    if (baseSlides.length >= 5 && track.querySelectorAll(`[${EXTRA_SLIDE_FLAG}]`).length < CLONE_SOURCE_INDEXES.length) {
      CLONE_SOURCE_INDEXES.forEach((sourceIndex) => {
        const source = baseSlides[sourceIndex];
        if (!source) return;
        const clone = source.cloneNode(true);
        clone.setAttribute(EXTRA_SLIDE_FLAG, 'true');
        track.appendChild(clone);
        structureChanged = true;
      });
    }

    Array.prototype.slice.call(track.children).forEach((slide, index) => {
      if (JOURNEY[index]) applySlide(slide, JOURNEY[index]);
      if (slide.hasAttribute(EXTRA_SLIDE_FLAG)) applyPlaceholderImage(slide, 'COMING SOON');
    });

    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    const targetWidth = isDesktop ? JOURNEY_TRACK_WIDTH : '';
    // The track is a flex item, so without flex-shrink:0 it collapses to its
    // content width (700vw) and the widened track would be ignored.
    const targetShrink = isDesktop ? '0' : '';
    if (track.style.width !== targetWidth || track.style.flexShrink !== targetShrink) {
      track.style.width = targetWidth;
      track.style.flexShrink = targetShrink;
      structureChanged = true;
    }

    // ScrollTrigger recalculates pinned distances on resize, which re-measures
    // the widened track without needing access to the site's gsap instance.
    if (structureChanged) window.dispatchEvent(new Event('resize'));
  };

  const patchTelemetry = () => {
    const section = findSectionByHeading('Open Source Telemetry');
    if (!section) return;

    const label = Array.prototype.slice
      .call(section.querySelectorAll('span'))
      .find((element) => (element.textContent || '').trim() === 'Merged Pull Requests');
    const value = label && label.nextElementSibling;
    if (value && (value.textContent || '').trim() !== '25+') value.textContent = '25+';
  };

  const patchTrophyRoom = () => {
    const section = findSectionByHeading('Trophy Room');
    if (!section) return;

    const certifications = [
      ['AWS Certified Cloud Practitioner', 'Amazon Web Services', 'Expires 2029'],
      ['MongoDB Certified', 'MongoDB', 'Certified'],
      ['Oracle Cloud Infrastructure 2025 AI Foundations Associate', 'Oracle', 'Certified']
    ];

    const cards = Array.prototype.slice
      .call(section.querySelectorAll('a'))
      .filter((anchor) => anchor.querySelector('h3'))
      .slice(0, certifications.length);

    cards.forEach((card, index) => {
      const entry = certifications[index];
      const labels = Array.prototype.slice.call(card.querySelectorAll('span'));
      if (labels.length >= 2) {
        const issuer = labels[labels.length - 2];
        const status = labels[labels.length - 1];
        if ((issuer.textContent || '').trim() !== entry[1]) issuer.textContent = entry[1];
        if ((status.textContent || '').trim() !== entry[2]) status.textContent = entry[2];
      }
      if (card.getAttribute('href') !== PROFILE.linkedin) card.setAttribute('href', PROFILE.linkedin);
    });
  };

  const patchMetadata = () => {
    const title = replaceText(document.title || '');
    if (title !== document.title) document.title = title;

    document.querySelectorAll('meta[content]').forEach((meta) => {
      const content = meta.getAttribute('content') || '';
      const field = meta.getAttribute('property') || meta.getAttribute('name') || '';
      let next = replaceText(content);

      // URL and social metadata are attributes rather than text nodes, so
      // replace any remaining upstream-owner identity explicitly.
      if (/(?:arpan|pramanik)/i.test(next)) {
        if (/image/i.test(field)) next = PROFILE.github + '.png';
        else if (/url/i.test(field)) next = window.location.href;
        else next = PROFILE.name;
      }

      if (next !== content) meta.setAttribute('content', next);
    });

    document.querySelectorAll('link[href]').forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (/arpanpramanik/i.test(href)) link.setAttribute('href', PROFILE.linkedin);
    });
  };

  // Accessible text lives in attributes too (image alt text, tooltips, labels).
  const patchAttributes = () => {
    ['alt', 'title', 'aria-label'].forEach((attribute) => {
      document.querySelectorAll(`[${attribute}]`).forEach((element) => {
        const current = element.getAttribute(attribute) || '';
        const next = replaceText(current);
        if (next !== current) element.setAttribute(attribute, next);
      });
    });
  };

  /**
   * JSON-LD is plain structured data that the browser has already parsed, so it
   * is safe to rewrite. The `self.__next_f` flight payload is deliberately left
   * alone because its rows are length-prefixed.
   */
  const patchStructuredData = () => {
    document.querySelectorAll('script[type="application/ld+json"]').forEach((node) => {
      const current = node.textContent || '';
      let next = replaceText(current)
        .split('https://github.com/aryan-vijaykar').join(PROFILE.github)
        .split('https://linkedin.com/in/aryan-vijaykar').join(PROFILE.linkedin);
      // Replace any remaining upstream domain or social URLs
      next = next
        .replace(/https?:\/\/(?:www\.)?[a-z0-9-]+\.in(?=["'/])/gi, PROFILE.linkedin)
        .replace(/https:\/\/twitter\.com\/[a-z0-9_.-]+/gi, PROFILE.github)
        .replace(/https:\/\/instagram\.com\/[a-z0-9_.-]+/gi, PROFILE.linkedin);
      if (next !== current) node.textContent = next;
    });
  };

  const observer = new MutationObserver(() => queuePatch());
  const startObserving = () => {
    if (!document.documentElement) return;
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  };

  let patchQueued = false;

  function patchPage() {
    patchQueued = false;
    if (!document.body) return;

    // Stop observing while writing so our own edits cannot retrigger the patch.
    observer.disconnect();
    try {
      patchTextNodes(document.body);
      patchHeroName();
      patchLinks();
      patchTelemetry();
      patchJourney();
      redactNameBearingImages();
      patchTrophyRoom();
      patchMetadata();
      patchAttributes();
      patchStructuredData();
      document.documentElement.setAttribute('data-identity-patch', 'applied');
    } catch (error) {
      console.error('[identity-patch] failed:', error);
    } finally {
      startObserving();
    }
  }

  function queuePatch() {
    if (patchQueued) return;
    patchQueued = true;
    window.requestAnimationFrame(patchPage);
  }

  const boot = () => {
    patchPage();
    // The intro animation and React keep rendering after boot, so re-apply for a
    // short window; afterwards mutation events keep it in sync.
    let ticks = 0;
    const interval = window.setInterval(() => {
      queuePatch();
      if (++ticks > 60) window.clearInterval(interval);
    }, 200);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  window.addEventListener('load', queuePatch);
  window.addEventListener('popstate', queuePatch);
  startObserving();
})();
