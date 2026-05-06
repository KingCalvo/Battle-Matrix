import LobbyClient from "./LobbyClient";
import { getDictionary } from "@/lib/getDictionary";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return {
    title: dict.metadata.lobby,
  };
}

export default async function Page({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <LobbyClient dict={{ ...dict, locale }} />;
}
