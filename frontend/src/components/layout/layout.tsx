import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/authContext';
import Navbar from './navbar';

export const Layout = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F1ECE6] bg-[linear-gradient(to_right,#D2B694_2px,transparent_1px),linear-gradient(to_bottom,#D2B694_2px,transparent_1px)] bg-[size:24px_24px]">
      <Navbar />
      <main className="md:h-full md:w-full md:overflow-hidden">
        <div className="h-full w-full p-4 md:p-10">
          {/* Render the current page (e.g., HomePage) */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};
