import { Link, useLocation } from 'react-router-dom';
import { SignOut } from '@phosphor-icons/react';
// import Logo from './Logo';

export default function Sidebar({ links, role, user }) {
  const location = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-dark flex flex-col flex-shrink-0">
      <div className="px-5 py-6 border-b border-white/[0.06]">
        {/* <Logo dark /> */}
      </div>

      <div className="px-5 py-5 border-b border-white/[0.06] flex items-center gap-3">
        {user.img ? (
          <img src={user.img} alt={user.name}
            className="w-[42px] h-[42px] rounded-full object-cover border-2 border-white/15 flex-shrink-0" />
        ) : (
          <div className="w-[42px] h-[42px] rounded-full bg-blue flex items-center justify-center text-white font-bold text-[15px] flex-shrink-0">
            {user.initials}
          </div>
        )}
        <div>
          <p className="text-[14px] font-bold text-white leading-tight">{user.name}</p>
          <p className="text-[12px] text-white/45 mt-0.5">{role}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        {links.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-white/25 px-3 py-2 mt-2">{group.label}</p>
            )}
            {group.items.map(item => {
              const Icon = item.icon;
              const active = item.active ?? location.pathname === item.to;
              const content = (
                <>
                  <Icon size={18} weight={active ? 'fill' : 'regular'} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-red text-white text-[11px] font-bold px-[7px] py-px rounded-full">{item.badge}</span>
                  )}
                </>
              );

              if (item.onClick) {
                return (
                  <button key={item.label} type="button" onClick={item.onClick}
                    className={`sidebar-item w-full text-left ${active ? 'active' : ''}`}>
                    {content}
                  </button>
                );
              }

              return (
                <Link key={item.to} to={item.to}
                  className={`sidebar-item ${active ? 'active' : ''}`}>
                  {content}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/[0.06]">
        <Link to="/login" className="sidebar-item hover:bg-red/20 hover:text-red/80">
          <SignOut size={18} />
          Logout
        </Link>
      </div>
    </aside>
  );
}
