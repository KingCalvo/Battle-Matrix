import ArenaOnlineClient from "./ArenaOnlineClient";
import { getDictionary } from "@/lib/getDictionary";

export const metadata = {
  title: "Arena online",
};

export default async function Page({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <ArenaOnlineClient dict={{ ...dict, locale }} />;
}
