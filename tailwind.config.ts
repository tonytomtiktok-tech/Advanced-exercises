import type { Config } from 'tailwindcss';
export default { content:['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],theme:{extend:{colors:{ink:'#17233c',muted:'#8190ac',brand:'#5554e8',orange:'#ff9626'},boxShadow:{soft:'0 10px 35px rgba(28,45,91,.07)'}}},plugins:[]} satisfies Config;
