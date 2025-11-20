import { Home, Search, BarChart3, User, Mic } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Search", path: "/search" },
    { icon: Mic, label: "Record", path: "/record"},
    { icon: BarChart3, label: "Stats", path: "/stats" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full`}
            >
              <Icon
                className={`${item.big ? "w-12 h-12 text-blue-500" : "w-6 h-6"} 
                            ${isActive ? "text-blue-500" : "text-gray-400"}`}
              />
              
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default NavBar;
