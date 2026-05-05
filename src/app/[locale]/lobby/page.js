import LobbyClient from "./LobbyClient";
import { getDictionary } from "@/lib/getDictionary";

export const metadata = {
  title: "Lobby online",
};

export default async function Page({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <LobbyClient dict={{ ...dict, locale }} />;
}
