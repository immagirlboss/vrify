import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
 title: 'vrify — Make noise. Make it yours.',
 description: 'Create with your hands. Run your shop with your voice.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
 return <html lang="en"><body>{children}</body></html>;
}
