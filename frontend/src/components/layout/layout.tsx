// Wraps your entire application. It renders the Navbar, the main page content (passed as children), and the Footer. This is also the best place to render the FirstTimeSetupModal when it's needed.

import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/authContext';
import { FirstTimeSetupModal } from '../ui/firstTimeSetupModal';
import Navbar from './navbar';
import { FloatingChangelogButton } from '../ui/floatingChangelogButton';

export const Layout = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F1ECE6]  bg-[linear-gradient(to_right,#D2B694_2px,transparent_1px),linear-gradient(to_bottom,#D2B694_2px,transparent_1px)] bg-size-[24px_24px]">
      <Navbar />
      <main className="md:h-full md:w-full md:overflow-hidden">
          <div className="h-full w-full p-4 md:p-10">
          {/* Render the current page (e.g., HomePage) */}
          <Outlet />
          <FloatingChangelogButton />
          </div>
      </main>

      {/* This is the "Profile Lock". 
        If the user exists but their profile is incomplete,
        this modal will render on top of EVERYTHING.
      */}
      {user && !user.profile_complete && <FirstTimeSetupModal />}
    </div>
  );
};