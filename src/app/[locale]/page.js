import HomeClient from "./HomeClient";
import { getDictionary } from "@/lib/getDictionary";

export const metadata = {
  title: "BATTLE MATRIX",
};

export default async function Page({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <HomeClient dict={{ ...dict, locale }} />;
}
