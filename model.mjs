// Original synthetic training examples. Each group is one supported kind of deliverable.
export const trainingExamples = {
  accessibility: [
    'Complete accessibility audit for WCAG contrast and keyboard navigation',
    'Run screen reader checks and attach accessibility findings',
    'Send WCAG checklist with color contrast and focus order results',
    'The a11y report covers keyboard controls and alt text',
  ],
  analytics: [
    'Set up analytics tracking and verify conversion events',
    'Attach GA4 dashboard and event tracking screenshots',
    'Confirm pageview metrics and tag manager events are recording',
    'Analytics measurement report includes traffic and click data',
  ],
  copy: [
    'Write and deliver final landing page copy',
    'The headline text and product descriptions are in the copy deck',
    'Attach edited website copy and approved marketing wording',
    'Proofread the product messaging and publish the final text',
  ],
  design: [
    'Deliver high fidelity design mockups in Figma',
    'The Figma prototype and wireframes are ready for review',
    'Share desktop layout frames and visual design screens',
    'Send the editable design board with final component styles',
  ],
  deployment: [
    'Deploy the web app to the staging environment',
    'The staging build is live at the preview URL',
    'Publish the site to production hosting and confirm the deployment',
    'Share the hosted preview link for the running release',
  ],
  documentation: [
    'Write setup documentation and the maintenance guide',
    'The user manual and installation instructions are attached',
    'Send the README with configuration and troubleshooting steps',
    'Share operator handbook and developer documentation',
  ],
  handoff: [
    'Deliver the source files in a handoff archive',
    'Send the editable project source as a ZIP archive',
    'The asset handoff package contains original files and source code',
    'Transfer ownership of the source repository and the final asset bundle',
  ],
  integration: [
    'Integrate the contact form with the email service',
    'Connect the external API and verify the integration',
    'The CRM webhook and form submission endpoint are wired up',
    'Send proof that the third party connector works',
  ],
  mobile: [
    'Verify responsive layouts on mobile devices and share screenshots',
    'Run mobile viewport testing on iPhone and Android',
    'The phone breakpoint checks and responsive screenshots are attached',
    'Show that the site fits small screens without horizontal scrolling',
  ],
  performance: [
    'Run Lighthouse and deliver the performance benchmark',
    'Attach page speed measurements and load time report',
    'The Core Web Vitals and performance audit are ready',
    'Benchmark latency and page load speed after optimization',
  ],
  qa: [
    'Run regression tests and share the QA report',
    'Attach the automated test suite results and bug fixes',
    'The acceptance test results and pass counts are available',
    'Verify end to end workflows with the smoke test checklist',
  ],
  video: [
    'Record a walkthrough video of the delivered project',
    'Attach the screen recording and voiceover tutorial',
    'The MP4 screencast shows the full demo',
    'Send the video walkthrough of the new user flow',
  ],
};

const stopWords = new Set('a an the and or in on for to of is are were was at with from by as be it we our will this that i my you your has have had'.split(' '));
const models = Object.entries(trainingExamples).map(([label, examples]) => ({
  label,
  examples: examples.map((text) => ({ text, features: features(text) })),
}));
const weights = new Map();
for (const model of models) {
  for (const feature of new Set(model.examples.flatMap(({ features }) => [...features]))) {
    weights.set(feature, (weights.get(feature) ?? 0) + 1);
  }
}
for (const [feature, count] of weights) {
  weights.set(feature, (1 + Math.log((models.length + 1) / (count + 1))) ** 2);
}

function features(text) {
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const result = new Set();
  for (const token of tokens.filter((word) => word.length > 2 && !stopWords.has(word))) {
    result.add('word:' + token);
    const padded = '^' + token + '$';
    for (let index = 0; index <= padded.length - 3; index++) {
      result.add('tri:' + padded.slice(index, index + 3));
    }
  }
  return result;
}

function similarity(left, right) {
  const weight = (feature) => weights.get(feature) ?? 1;
  const mass = (set) => [...set].reduce((total, feature) => total + weight(feature), 0);
  const shared = [...left].reduce((total, feature) => total + (right.has(feature) ? weight(feature) : 0), 0);
  return shared / Math.sqrt(mass(left) * mass(right)) || 0;
}

export function classify(text) {
  const input = features(text);
  const ranked = models.map(({ label, examples }) => {
    const closest = examples.map(({ features }) => similarity(input, features)).sort((a, b) => b - a);
    return { label, score: closest[0] * 0.75 + closest[1] * 0.25 };
  }).sort((a, b) => b.score - a.score);
  const [best, second] = ranked;
  return best.score >= 0.16 && best.score - second.score >= 0.045 ? best : null;
}

const pending = /\b(?:not|never|pending|missing|blocked|outstanding|incomplete|awaiting|waiting|tomorrow|next week|next (?:mon|tues|wednes|thurs|fri|satur|sun)day|will|still need|yet|in progress|working on|to follow|todo|tbd|draft|scheduled|plan(?:ning)? to|partially|haven['’]t|won['’]t|can['’]t|cannot)\b/i;
const reported = /\b(?:attached|delivered|completed|finished|included|ready|live|published|shared|sent|uploaded|passed|verified|available|done|handed over)\b|https?:\/\//i;

export function matchEvidence(scope, notes) {
  const evidence = notes.map((text) => ({
    text,
    category: classify(text)?.label,
    status: pending.test(text) ? 'pending' : reported.test(text) ? 'reported' : 'unclear',
  }));
  const categories = scope.map(({ description }) => classify(description)?.label);
  return scope.map((item, index) => {
    const category = categories[index];
    if (!category) {
      return { ...item, status: 'unclassified', evidence: [], category: null };
    }
    const matching = evidence.filter((line) => line.category === category);
    const reportedCount = matching.filter((line) => line.status === 'reported').length;
    const unique = categories.filter((label) => label === category).length === 1;
    let status = 'missing';
    if (matching.some((line) => line.status === 'pending')) status = 'pending';
    else if (matching.length) status = unique && reportedCount > 0 ? 'candidate' : 'unclear';
    return { ...item, status, evidence: matching, category };
  });
}
