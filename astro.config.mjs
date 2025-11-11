// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.assegailabs.xyz',
	integrations: [
		starlight({
			title: 'Assegai AI Sandbox',
			description: 'Documentation for the Assegai AI Sandbox - Safe AI agent execution for blockchain',
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
						{ label: 'Wallet Authentication', slug: 'guides/wallet-auth' },
					],
				},
				{
					label: 'Agents',
					items: [
						{ label: 'Agents Overview', slug: 'guides/agent-overview' },
						{ label: 'Example Agent', slug: 'guides/example-agent' },
					],
				},
				{
					label: 'Settings',
					items: [
						{ label: 'AI Integration', slug: 'guides/ai-integration' },
					],
				},
				{
					label: 'Development',
					items: [
						{ label: 'Building', slug: 'guides/building' },
						{ label: 'Contributing', slug: 'guides/contributing' },
						{ label: 'Roadmap', slug: 'guides/roadmap' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'API Proxy Reference', slug: 'guides/api-proxy-reference' },
						{ label: 'Sandboxing', slug: 'guides/sandboxing' },
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
