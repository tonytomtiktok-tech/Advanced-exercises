import { Suspense } from 'react';
import Platform from '@/components/platform';
export default function Page(){return <Suspense fallback={<div className="p-10 text-center">กำลังโหลด...</div>}><Platform/></Suspense>}
