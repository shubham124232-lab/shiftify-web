import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@/styles/globals.css';

import BootstrapClient from '@/components/BootstrapClient';

export const metadata = {
  title: 'Shiftify',
  description: 'Shiftify App',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <BootstrapClient />
        {children}
      </body>
    </html>
  );
}