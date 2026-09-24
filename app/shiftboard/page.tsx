import type { Metadata } from 'next';
import '../home.css';
import '../shiftboard.css';
import HomeNav from '@/components/landing/home/HomeNav';
import SiteFooter from '@/components/landing/home/SiteFooter';
import { ShiftboardBoard } from '@/components/landing/shiftboard/ShiftboardBoard';

export const metadata: Metadata = {
  title: 'Live Shiftboard',
  description: 'Browse real, open NDIS support shifts near you across Australia — updated live.',
};

export default function ShiftboardPage() {
  return (
    <div className="sf-home">
      <HomeNav hideBoardLink />
      <ShiftboardBoard />
      <SiteFooter />
    </div>
  );
}
