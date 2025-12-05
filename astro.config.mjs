// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.assegailabs.xyz',
	integrations: [
		starlight({
			title: 'Assegai Agent Sandbox',
			description: 'Documentation for the Assegai AI Agent Sandbox',
			logo: {
				src: './src/assets/logo.svg',
				replacesTitle: false,
			},
			customCss: [
				'./src/styles/custom.css',
			],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/assegailabs' }],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Overview', slug: 'guides/overview' },
						{ label: 'Installation', slug: 'guides/installation' },
					],
				},
				{
					label: 'Core Concepts',
					items: [
						{ label: 'Agent Overview', slug: 'guides/agent-overview' },
						{ label: 'AI Integration', slug: 'guides/ai-integration' },
						{ label: 'Sandboxing', slug: 'guides/sandboxing' },
					],
				},
				{
					label: 'Developers',
					items: [
						{ label: 'Building Agents', slug: 'guides/building-agents' },
						{ label: 'SDK Reference', slug: 'guides/sdk-reference' },
					],
				},
				{
					label: 'Project',
					items: [
						{ label: 'Roadmap', slug: 'guides/roadmap' },
					],
				},
				{
					label: 'Legal',
					items: [
						{ label: 'Privacy Policy', slug: 'guides/privacy-policy' },
						{ label: 'Terms of Service', slug: 'guides/terms-of-service' },
					],
				},
			],
		}),
	],
});