
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				medical: {
					primary: 'hsl(var(--medical-primary))',
					secondary: 'hsl(var(--medical-secondary))',
					accent: 'hsl(var(--medical-accent))',
					success: 'hsl(var(--medical-success))',
					warning: 'hsl(var(--medical-warning))',
					danger: 'hsl(var(--medical-danger))',
					surface: 'hsl(var(--medical-surface))',
					muted: 'hsl(var(--medical-muted))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
		keyframes: {
			'pulse-soft': {
				'0%, 100%': { opacity: '1' },
				'50%': { opacity: '0.8' }
			},
			'slide-up': {
				'0%': { transform: 'translateY(10px)', opacity: '0' },
				'100%': { transform: 'translateY(0)', opacity: '1' }
			},
			'vitals-pulse': {
				'0%, 100%': { transform: 'scale(1)' },
				'50%': { transform: 'scale(1.02)' }
			},
			'bounce-expand': {
				'0%': { 
					transform: 'scaleY(0.95)',
					opacity: '0.8'
				},
				'50%': { 
					transform: 'scaleY(1.02)'
				},
				'100%': { 
					transform: 'scaleY(1)',
					opacity: '1'
				}
			},
			'ripple': {
				'0%': { 
					transform: 'scale(0)', 
					opacity: '0.5' 
				},
				'100%': { 
					transform: 'scale(4)', 
					opacity: '0' 
				}
			}
		},
		animation: {
			'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
			'slide-up': 'slide-up 0.3s ease-out',
			'vitals-pulse': 'vitals-pulse 1s ease-in-out infinite',
			'bounce-expand': 'bounce-expand 0.4s ease-out',
			'ripple': 'ripple 0.6s linear forwards'
		},
			fontFamily: {
				medical: ['Inter', 'system-ui', 'sans-serif']
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
