import ArenaClient from "./ArenaClient";
import { getDictionary } from "@/lib/getDictionary";

export const metadata = {
  title: "Arena de batalla",
};

export default async function Page({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <ArenaClient dict={{ ...dict, locale }} />;
}
