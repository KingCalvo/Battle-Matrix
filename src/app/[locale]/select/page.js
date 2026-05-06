import SelectClient from "./SelectClient";
import { getDictionary } from "@/lib/getDictionary";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return {
    title: dict.metadata.select,
  };
}

export default async function Page({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <SelectClient dict={{ ...dict, locale }} />;
}
