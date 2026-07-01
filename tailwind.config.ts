
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
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
					foreground: 'hsl(var(--primary-foreground))',
					light: 'hsl(210 75% 35%)',
					dark: 'hsl(210 85% 22%)'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					light: 'hsl(25 95% 65%)',
					dark: 'hsl(25 100% 38%)'
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
					foreground: 'hsl(var(--accent-foreground))',
					// Planflow design scale (orange) — used by the new service page
					50: '#FFF4ED', 100: '#FFE3CC', 200: '#FFC598', 300: '#FFA063',
					400: '#FB7E3E', 500: '#F26B2D', 600: '#D85318', 700: '#B23E12',
					800: '#8B2F11', 900: '#6E2611', 950: '#3D1107'
				},
				brand: {
					50: '#EEF2F8', 100: '#D6DFEE', 200: '#ABBDDC', 300: '#7894C0',
					400: '#486B9C', 500: '#1F3D6B', 600: '#173256', 700: '#122844',
					800: '#0E2036', 900: '#0A1828', 950: '#060E1B'
				},
				ink: {
					50: '#F4F6FA', 100: '#E8ECF3', 200: '#D2DAE6', 300: '#A6B0C3',
					400: '#7B8597', 500: '#5A6478', 600: '#404A5C', 700: '#2C3548',
					800: '#1A2231', 900: '#0F1624', 950: '#070B16'
				},
				success: {
					50: '#ECFDF3', 100: '#D1FADF', 200: '#A6F4C5', 300: '#6CE9A6',
					400: '#32D583', 500: '#12B76A', 600: '#039855', 700: '#027A48',
					800: '#05603A', 900: '#054F31', 950: '#022C1C'
				},
				danger: {
					50: '#FEF3F0', 100: '#FDE1D9', 200: '#FBBFAE', 300: '#F69680',
					400: '#EE7059', 500: '#E25946', 600: '#C53E2D', 700: '#A0301F',
					800: '#7C281C', 900: '#5E1F17', 950: '#330C08'
				},
				info: {
					50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE', 300: '#93C5FD',
					400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8',
					800: '#1E40AF', 900: '#1E3A8A', 950: '#172554'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				// Planflow design tokens
				btn: '0.625rem',
				field: '0.625rem',
				pill: '9999px'
			},
			spacing: {
				'4.5': '1.125rem'
			},
			boxShadow: {
				'soft': '0 2px 10px rgba(0, 0, 0, 0.05)',
				'card': '0 4px 20px rgba(0, 0, 0, 0.07)',
				'hover': '0 10px 25px rgba(0, 0, 0, 0.1)',
				// Planflow design tokens
				'xs': '0 1px 2px rgba(16, 24, 40, 0.05)',
				'float': '0 8px 30px rgba(16, 24, 40, 0.12)',
				'pop': '0 12px 40px rgba(16, 24, 40, 0.18)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-in': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'phone-glow': {
					'0%, 100%': { boxShadow: '0 0 0 0 rgba(242,107,45,0.45)' },
					'50%': { boxShadow: '0 0 16px 3px rgba(242,107,45,0.55)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'slide-in': 'slide-in 0.3s ease-out',
				'phone-glow': 'phone-glow 1.8s ease-in-out infinite',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
