import './globals.css';
import 'katex/dist/katex.min.css';
import type { Metadata } from 'next';
export const metadata: Metadata = {title:'AKSORN | ข้อสอบ O-net',description:'Responsive online exam platform prototype'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="th"><body>{children}</body></html>}
