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
        <div></div>

        <MenuItems items={items} />

        <div></div>
      </div>
    </header>
  );
};
