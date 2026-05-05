import SelectOnlineClient from "./SelectOnlineClient";
import { getDictionary } from "@/lib/getDictionary";

export const metadata = {
  title: "Selección de personajes online",
};

export default async function Page({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <SelectOnlineClient dict={{ ...dict, locale }} />;
}
