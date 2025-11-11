/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a set of docs in the sidebar
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

/** @type {import('@docusaurus/types').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'index',
      label: 'Home',
    },
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/quick-start',
        'getting-started/installation',
        'getting-started/setup',
      ],
    },
    {
      type: 'category',
      label: 'User Guide',
      items: [
        'user-guide/overview',
        'user-guide/features',
        'user-guide/workflows',
      ],
    },
    {
      type: 'category',
      label: 'Onboarding',
      items: [
        'onboarding/wizard',
        'onboarding/initial-setup',
      ],
    },
    {
      type: 'category',
      label: 'Tutorials',
      items: [
        'tutorials/basic-usage',
        'tutorials/advanced-features',
        'tutorials/integrations',
      ],
    },
    {
      type: 'category',
      label: 'Support',
      items: [
        'support/troubleshooting',
        'support/faq',
        'support/privacy-policy',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      items: [
        'development/architecture',
        'development/installation-guide',
        'development/apk-guide',
      ],
    },
  ],
};

module.exports = sidebars;
