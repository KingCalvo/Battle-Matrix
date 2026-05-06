import ArenaClient from "./ArenaClient";
import { getDictionary } from "@/lib/getDictionary";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return {
    title: dict.metadata.arena,
  };
}

export default async function Page({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <ArenaClient dict={{ ...dict, locale }} />;
}
