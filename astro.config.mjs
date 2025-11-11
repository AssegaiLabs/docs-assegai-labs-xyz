// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
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
					label: 'Transactions',
					items: [
						{ label: 'Transaction Limits', slug: 'guides/transaction-limits' },
						{ label: 'Approvals', slug: 'guides/transaction-approvals' },
					],
				},
				{
					label: 'Settings',
					items: [
						{ label: 'AI Integration', slug: 'guides/ai-integration' },
					],
				},
				{
					label: 'Security',
					items: [
						{ label: 'Docker Isolation', slug: 'guides/docker-isolation' },
					],
				},
				{
					label: 'Development',
					items: [
						{ label: 'Building', slug: 'guides/building' },
						{ label: 'Contributing', slug: 'guides/contributing' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'API Proxy Reference', slug: 'guides/api-proxy-reference' },
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
