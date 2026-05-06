import SelectOnlineClient from "./SelectOnlineClient";
import { getDictionary } from "@/lib/getDictionary";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return {
    title: dict.metadata.selectOnline,
  };
}

export default async function Page({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <SelectOnlineClient dict={{ ...dict, locale }} />;
}
