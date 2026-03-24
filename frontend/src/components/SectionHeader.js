import { NavLink } from "react-router-dom";
import "../assets/styles/SectionHeader.css";

const links = [
  { to: "/showtimes", label: "LICH CHIEU THEO RAP" },
  { to: "/movies", label: "PHIM" },
  { to: "/cinemas", label: "RAP" },
  { to: "/prices", label: "GIA VE" },
  { to: "/news", label: "TIN MOI & UU DAI" },
];

export default function SectionHeader() {
  return (
    <header className="section-header">
      <nav className="section-header__nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive
                ? "section-header__link section-header__link--active"
                : "section-header__link"
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
