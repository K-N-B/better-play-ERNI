import React from "react";
import Navbar from "./Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <div className="flex flex-col h-dvh w-dvw bg-[#F1ECE6]  bg-[linear-gradient(to_right,#D2B694_2px,transparent_1px),linear-gradient(to_bottom,#D2B694_2px,transparent_1px)] bg-[size:24px_24px]">
        <Navbar />
        <main className="md:h-full md:w-full md:overflow-hidden">
          <div className="h-full w-full p-5 md:p-10">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
  

export default Layout;