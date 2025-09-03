
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
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				sand: {
					50: 'hsl(48 100% 96%)',
					100: 'hsl(48 96% 89%)',
					200: 'hsl(48 97% 77%)',
					300: 'hsl(45 97% 64%)',
					400: 'hsl(43 96% 56%)',
					500: 'hsl(38 92% 50%)',
					600: 'hsl(32 95% 44%)',
					700: 'hsl(26 90% 37%)',
					800: 'hsl(22 82% 31%)',
					900: 'hsl(15 75% 28%)',
				},
        desert: {
          50: 'hsl(30 60% 97%)',
          100: 'hsl(30 45% 92%)',
          200: 'hsl(30 40% 84%)',
          300: 'hsl(30 35% 76%)',
          400: 'hsl(30 40% 68%)',
          500: 'hsl(30 45% 58%)',
          600: 'hsl(25 55% 50%)',
          700: 'hsl(25 60% 42%)',
          800: 'hsl(25 65% 34%)',
          900: 'hsl(25 70% 26%)',
        },
        oasis: {
          50: 'hsl(160 68% 96%)',
          100: 'hsl(160 68% 90%)',
          200: 'hsl(160 68% 80%)',
          300: 'hsl(160 68% 70%)',
          400: 'hsl(160 68% 60%)',
          500: 'hsl(160 68% 50%)',
          600: 'hsl(160 70% 40%)',
          700: 'hsl(160 72% 32%)',
          800: 'hsl(160 74% 26%)',
          900: 'hsl(160 76% 20%)',
        }
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				tajawal: ['Tajawal', 'sans-serif'],
				cairo: ['Cairo', 'sans-serif'],
				arabic: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
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
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' }
				},
				'shimmer': {
					'0%': { backgroundPosition: '200% 0' },
					'100%': { backgroundPosition: '-200% 0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-up': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-down': {
					'0%': { opacity: '0', transform: 'translateY(-20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					'0%': { opacity: '0', transform: 'scale(0.95)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'pulse-glow': {
					'0%, 100%': { 
						boxShadow: '0 0 5px currentColor',
						opacity: '1'
					},
					'50%': { 
						boxShadow: '0 0 20px currentColor, 0 0 30px currentColor',
						opacity: '0.8'
					}
				},
				'bounce-gentle': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-3px)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 3s ease-in-out infinite',
				'shimmer': 'shimmer 2s infinite',
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-up': 'slide-up 0.4s ease-out',
				'slide-down': 'slide-down 0.4s ease-out',
				'scale-in': 'scale-in 0.3s ease-out',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'bounce-gentle': 'bounce-gentle 1s ease-in-out infinite',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
	corePlugins: {
		backdropOpacity: false,
	},
	safelist: [
		{
			pattern: /^(pt|pb|pl|pr|mt|mb|ml|mr)-safe$/,
		},
		// إضافة الـ hover-scale للـ safelist
		'hover:scale-105',
		'transition-transform',
		'duration-200',
	]
} satisfies Config;
