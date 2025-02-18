import { MenuItems } from "./MenuItems";

export const Header = () => {
  let items = [
    { text: "Dashboard", url: "#" },
    { text: "Market", url: "#" },
    { text: "Governance", url: "#" },
  ];
  return (
    <header>
      <div>
        <MenuItems items={items} />
      </div>
    </header>
  );
};
