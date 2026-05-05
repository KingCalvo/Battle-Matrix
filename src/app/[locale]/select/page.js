import SelectClient from "./SelectClient";
import { getDictionary } from "@/lib/getDictionary";

export const metadata = {
  title: "Selección de personajes",
};

export default async function Page({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <SelectClient dict={{ ...dict, locale }} />;
}
