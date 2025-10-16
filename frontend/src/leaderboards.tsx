
import "flowbite"
import { useState, useEffect } from "react";

export default function Leaderboards() {
  
  const [selected, setSelected] = useState("Today");

  const leaderboardData = [
    { rank: 1, name: "Jerome Barba", score: 1827 },
    { rank: 2, name: "Dayniel Caadiang", score: 1632 },
    { rank: 3, name: "Yna Foronda", score: 1594 },
    { rank: 4, name: "ERNI Employee", score: 1474 },
    { rank: 5, name: "ERNI Employee", score: 1474 },
    { rank: 6, name: "ERNI Employee", score: 1474 },
    { rank: 7, name: "ERNI Employee", score: 1474 },
    { rank: 8, name: "ERNI Employee", score: 1474 },
    { rank: 9, name: "ERNI Employee", score: 1474 },
    { rank: 10, name: "ERNI Employee", score: 1474 },
    { rank: 11, name: "ERNI Employee", score: 1474 },
    { rank: 12, name: "ERNI Employee", score: 1474 },
  ];

  const hasData = leaderboardData.length > 0;

  // Flowbite re-initializes dropdown listeners after first render
  useEffect(() => {
    import("flowbite");
  }, []);

  const options = ["Today", "This week", "This month"];
  return (
    <div className="grid grid-cols-2 h-full gap-8 ">
      <div className="flex flex-col bg-slate-50 rounded-3xl p-6 shadow-md overflow-hidden">
        <span className="flex justify-start items-center">
          <button
            id="dropdownButton"
            data-dropdown-toggle="dropdownMenu"
            data-dropdown-placement="bottom-start"
            data-dropdown-offset-distance="5"
            className="text-primary bg-primary-200 hover:bg-primary-300 font-bold rounded-full text-xl px-5 py-2.5 text-center inline-flex items-center"
            type="button"
          >
            {selected}
            <svg
              className="w-2.5 h-2.5 ms-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 10 6"
            >
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          <div
            id="dropdownMenu"
            className="z-40 hidden bg-white divide-y divide-gray-100 rounded-xl shadow w-44"
          >
            <ul className="py-2 text-sm text-gray-700">
              {options.map((option) => (
                <li key={option}>
                  <button
                    onClick={() => setSelected(option)}
                    className="block px-4 py-2 w-full text-left text-primary text-lg hover:bg-primary-100"
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <h2 className="text-xl font-bold text-center">&nbsp;'s Leaderboards</h2>
          
        </span>
        <div className="pt-4 ">
          <div className="flex flex-row grid-cols-3 place-content-center gap-8">
            <div className="col-span-1">
              <div id="flag" className="flex relative w-[150px] h-fill justify-center overflow">
                {/* Second SVG serves as the base (lower z) */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 169 236"
                  fill="none"
                  className="w-full h-auto drop-shadow-[0_8px_0_#5E5F5F]"
                >
                  <path
                    d="M0.118652 5.29646e-05H168.882V182.37C168.882 186.74 166.406 190.734 162.49 192.677L89.6162 228.847C86.3931 230.447 82.6073 230.447 79.3843 228.847L6.51001 192.677C2.59489 190.734 0.118652 186.74 0.118652 182.37V5.29646e-05Z"
                    fill="#AFADAD"
                  />
                </svg>

                {/* Circle */}
                
                <div className="absolute z-30 w-8 h-8 bg-[#5E5F5F] top-6 left-6 rounded-full flex items-center justify-center">
                  <p className="text-white text-sm font-extrabold leading-none">2<sup className="pt-1 font-semibold">nd</sup></p>
                </div>
                <div className="absolute z-20 rounded-full w-20 h-20 bg-neutral-100 top-6"></div>
                <div className="absolute z-20 top-29 text-center">
                  <p className="text font-semibold m-0 p-0 leading-none text-neutral-900 ">Yna Foronda</p>
                  <p className="text font-sm m-0 p-0 leading-none text-neutral-900 ">1827pts</p>
                </div>
                

                {/* First SVG drawn on top */}
                <div className="absolute bottom-5 z-20 w-full h-auto">
                  <svg className="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 169 51" fill="none">
                    <path d="M-3.90869 4.46594L1.0779 10.3198C2.15197 11.5806 3.48557 12.5948 4.98758 13.2929L79.6561 47.998C82.6759 49.4016 86.1558 49.4281 89.1967 48.0707L163.79 14.7749C166.221 13.6896 168.201 11.7947 169.392 9.41315L173.304 1.58911" stroke="#F1ECE6" stroke-width="2.87682" stroke-linecap="round" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="col-span-1">
              <div id="flag" className="flex relative w-[168px] h-fill  justify-center">
                {/* Second SVG serves as the base (lower z) */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 169 236"
                  fill="none"
                  className="w-[169px] h-auto drop-shadow-[0_8px_0_#A65E15]"
                >
                  <path
                    d="M0.118652 5.29646e-05H168.882V182.37C168.882 186.74 166.406 190.734 162.49 192.677L89.6162 228.847C86.3931 230.447 82.6073 230.447 79.3843 228.847L6.51001 192.677C2.59489 190.734 0.118652 186.74 0.118652 182.37V5.29646e-05Z"
                    fill="#FFC200"
                  />
                </svg>

                {/* Circle */}
                <div className="absolute z-30 w-8 h-8 bg-[#A65D15] top-8 left-8 rounded-full flex items-center justify-center">
                  <p className="text-white text-sm font-extrabold leading-none">1<sup className="pt-1 font-semibold">st</sup></p>
                </div>
                <div className="absolute z-20 rounded-full w-22 h-22 bg-neutral-100 top-9"></div>
                <div className="absolute z-20 top-34 text-center">
                  <p className="text font-semibold m-0 p-0 leading-none  text-yellow-800">Jerome Barba</p>
                  <p className="text font-sm m-0 p-0 leading-none  text-yellow-800">1827pts</p>
                </div>


                {/* First SVG drawn on top */}
                <div className="absolute bottom-6 z-20 w-full h-auto">
                  <svg className="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 169 51" fill="none">
                    <path d="M-3.90869 4.46594L1.0779 10.3198C2.15197 11.5806 3.48557 12.5948 4.98758 13.2929L79.6561 47.998C82.6759 49.4016 86.1558 49.4281 89.1967 48.0707L163.79 14.7749C166.221 13.6896 168.201 11.7947 169.392 9.41315L173.304 1.58911" stroke="#F1ECE6" stroke-width="2.87682" stroke-linecap="round" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="col-span-1">
              <div id="flag" className="flex relative w-[150px] h-fill justify-center">
                {/* Second SVG serves as the base (lower z) */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 169 236"
                  fill="none"
                  className="w-full h-auto drop-shadow-[0_8px_0_#724212]"
                >
                  <path
                    d="M0.118652 5.29646e-05H168.882V182.37C168.882 186.74 166.406 190.734 162.49 192.677L89.6162 228.847C86.3931 230.447 82.6073 230.447 79.3843 228.847L6.51001 192.677C2.59489 190.734 0.118652 186.74 0.118652 182.37V5.29646e-05Z"
                    fill="#C18F5D"
                  />
                </svg>

                {/* Circle */}
                <div className="absolute z-30 w-8 h-8 bg-[#724212] top-6 left-6 rounded-full flex items-center justify-center">
                  <p className="text-white text-sm font-extrabold leading-none">3<sup className="pt-1 font-semibold">rd</sup></p>
                </div>
                <div className="absolute z-20 rounded-full w-20 h-20 bg-neutral-100 top-6"></div>
                <div className="absolute z-20 top-29 text-center">
                  <p className="text font-semibold m-0 p-0 leading-none  text-amber-900">Dayniel Caadiang</p>
                  <p className="text font-sm m-0 p-0 leading-none  text-amber-900">1827pts</p>
                </div>
                {/* First SVG drawn on top */}
                <div className="absolute bottom-5 z-20 w-full h-auto">
                  <svg className="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 169 51" fill="none">
                    <path d="M-3.90869 4.46594L1.0779 10.3198C2.15197 11.5806 3.48557 12.5948 4.98758 13.2929L79.6561 47.998C82.6759 49.4016 86.1558 49.4281 89.1967 48.0707L163.79 14.7749C166.221 13.6896 168.201 11.7947 169.392 9.41315L173.304 1.58911" stroke="#F1ECE6" stroke-width="2.87682" stroke-linecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          {hasData ? (
            <ul className="divide-y divide-gray-200">
              {leaderboardData.map((player) => (
                <li
                  key={player.rank}
                  className="flex justify-between items-center py-2 text-lg "
                >
                  {/* Left side: Rank + Name */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold text-xl ${
                        player.rank === 1
                          ? "text-yellow-500"
                          : player.rank === 2
                          ? "text-gray-500"
                          : player.rank === 3
                          ? "text-amber-700"
                          : "text-primary"
                      }`}
                    >
                      {player.rank}
                    </span>
                    <span className="text-primary-800 text-lg">{player.name}</span>
                  </div>

                  {/* Right side: Score */}
                  <div className="text-primary-700 text-xl italic">
                    <span className="font-semibold">{player.score}</span> pts
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="animate-pulse text-center text-xl text-gray-400 py-10">
              Loading leaderboard...
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col bg-slate-50 rounded-3xl p-6 shadow-md overflow-hidden">
        <div className="flex justify-start items-center">
          <h2 className="text-xl font-bold text-center py-2.5 ">All-time Leaderboards</h2>
          
        </div>
        <div className="pt-4 ">
          <div className="flex flex-row grid-cols-3 place-content-center gap-8">
            <div className="col-span-1">
              <div id="flag" className="flex relative w-[150px] h-fill justify-center overflow">
                {/* Second SVG serves as the base (lower z) */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 169 236"
                  fill="none"
                  className="w-full h-auto drop-shadow-[0_8px_0_#5E5F5F]"
                >
                  <path
                    d="M0.118652 5.29646e-05H168.882V182.37C168.882 186.74 166.406 190.734 162.49 192.677L89.6162 228.847C86.3931 230.447 82.6073 230.447 79.3843 228.847L6.51001 192.677C2.59489 190.734 0.118652 186.74 0.118652 182.37V5.29646e-05Z"
                    fill="#AFADAD"
                  />
                </svg>

                {/* Circle */}
                <div className="absolute z-30 w-8 h-8 bg-[#5E5F5F] top-6 left-6 rounded-full flex items-center justify-center">
                  <p className="text-white text-sm font-extrabold leading-none">2<sup className="pt-1 font-semibold">nd</sup></p>
                </div>
                <div className="absolute z-20 rounded-full w-20 h-20 bg-neutral-100 top-6"></div>
                <div className="absolute z-20 top-29 text-center">
                  <p className="text font-semibold m-0 p-0 leading-none text-neutral-900">Yna Foronda</p>
                  <p className="text font-sm m-0 p-0 leading-none text-neutral-900 ">1827pts</p>
                </div>
                

                {/* First SVG drawn on top */}
                <div className="absolute bottom-5 z-20 w-full h-auto">
                  <svg className="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 169 51" fill="none">
                    <path d="M-3.90869 4.46594L1.0779 10.3198C2.15197 11.5806 3.48557 12.5948 4.98758 13.2929L79.6561 47.998C82.6759 49.4016 86.1558 49.4281 89.1967 48.0707L163.79 14.7749C166.221 13.6896 168.201 11.7947 169.392 9.41315L173.304 1.58911" stroke="#F1ECE6" stroke-width="2.87682" stroke-linecap="round" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="col-span-1">
              <div id="flag" className="flex relative w-[168px] h-fill  justify-center">
                {/* Second SVG serves as the base (lower z) */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 169 236"
                  fill="none"
                  className="w-[169px] h-auto drop-shadow-[0_8px_0_#A65E15]"
                >
                  <path
                    d="M0.118652 5.29646e-05H168.882V182.37C168.882 186.74 166.406 190.734 162.49 192.677L89.6162 228.847C86.3931 230.447 82.6073 230.447 79.3843 228.847L6.51001 192.677C2.59489 190.734 0.118652 186.74 0.118652 182.37V5.29646e-05Z"
                    fill="#FFC200"
                  />
                </svg>

                {/* Circle */}
                <div className="absolute z-30 w-8 h-8 bg-[#A65D15] top-8 left-8 rounded-full flex items-center justify-center">
                  <p className="text-white text-sm font-extrabold leading-none">1<sup className="pt-1 font-semibold">st</sup></p>
                </div>
                <div className="absolute z-20 rounded-full w-22 h-22 bg-neutral-100 top-9"></div>
                <div className="absolute z-20 top-34 text-center">
                  <p className="text font-semibold m-0 p-0 leading-none text-yellow-800">Jerome Barba</p>
                  <p className="text font-sm m-0 p-0 leading-none text-yellow-800 ">1827pts</p>
                </div>


                {/* First SVG drawn on top */}
                <div className="absolute bottom-6 z-20 w-full h-auto">
                  <svg className="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 169 51" fill="none">
                    <path d="M-3.90869 4.46594L1.0779 10.3198C2.15197 11.5806 3.48557 12.5948 4.98758 13.2929L79.6561 47.998C82.6759 49.4016 86.1558 49.4281 89.1967 48.0707L163.79 14.7749C166.221 13.6896 168.201 11.7947 169.392 9.41315L173.304 1.58911" stroke="#F1ECE6" stroke-width="2.87682" stroke-linecap="round" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="col-span-1">
              <div id="flag" className="flex relative w-[150px] h-fill justify-center">
                {/* Second SVG serves as the base (lower z) */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 169 236"
                  fill="none"
                  className="w-full h-auto drop-shadow-[0_8px_0_#724212]"
                >
                  <path
                    d="M0.118652 5.29646e-05H168.882V182.37C168.882 186.74 166.406 190.734 162.49 192.677L89.6162 228.847C86.3931 230.447 82.6073 230.447 79.3843 228.847L6.51001 192.677C2.59489 190.734 0.118652 186.74 0.118652 182.37V5.29646e-05Z"
                    fill="#C18F5D"
                  />
                </svg>

                {/* Circle */}
                <div className="absolute z-30 w-8 h-8 bg-[#724212] top-6 left-6 rounded-full flex items-center justify-center">
                  <p className="text-white text-sm font-extrabold leading-none">3<sup className="pt-1 font-semibold">rd</sup></p>
                </div>
                <div className="absolute z-20 rounded-full w-20 h-20 bg-neutral-100 top-6"></div>
                <div className="absolute z-20 top-29 text-center">
                  <p className="text font-semibold m-0 p-0 leading-none  text-amber-900">Dayniel Caadiang</p>
                  <p className="text font-sm m-0 p-0 leading-none  text-amber-900">1827pts</p>
                </div>
                {/* First SVG drawn on top */}
                <div className="absolute bottom-5 z-20 w-full h-auto">
                  <svg className="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 169 51" fill="none">
                    <path d="M-3.90869 4.46594L1.0779 10.3198C2.15197 11.5806 3.48557 12.5948 4.98758 13.2929L79.6561 47.998C82.6759 49.4016 86.1558 49.4281 89.1967 48.0707L163.79 14.7749C166.221 13.6896 168.201 11.7947 169.392 9.41315L173.304 1.58911" stroke="#F1ECE6" stroke-width="2.87682" stroke-linecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          {hasData ? (
            <ul className="divide-y divide-gray-200">
              {leaderboardData.map((player) => (
                <li
                  key={player.rank}
                  className="flex justify-between items-center py-2 text-sm md:text-base"
                >
                  {/* Left side: Rank + Name */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold text-xl ${
                        player.rank === 1
                          ? "text-yellow-500"
                          : player.rank === 2
                          ? "text-gray-500"
                          : player.rank === 3
                          ? "text-amber-700"
                          : "text-primary"
                      }`}
                    >
                      {player.rank}
                    </span>
                    <span className="text-primary-800 text-lg">{player.name}</span>
                  </div>

                  {/* Right side: Score */}
                  <div className="text-primary-700 text-xl italic">
                    <span className="font-semibold">{player.score}</span> pts
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="animate-pulse text-center text-xl text-gray-400 py-10">
              Loading leaderboard...
            </div>
          )}
        </div>
      </div>


    </div>

  );
}