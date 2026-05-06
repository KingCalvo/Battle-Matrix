import ArenaOnlineClient from "./ArenaOnlineClient";
import { getDictionary } from "@/lib/getDictionary";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return {
    title: dict.metadata.arenaOnline,
  };
}

export default async function Page({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <ArenaOnlineClient dict={{ ...dict, locale }} />;
}
