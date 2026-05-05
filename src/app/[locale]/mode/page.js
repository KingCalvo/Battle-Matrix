import ModeClient from "./ModeClient";
import { getDictionary } from "@/lib/getDictionary";

export const metadata = {
  title: "Elige el modo de juego",
};

export default async function Page({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <ModeClient dict={{ ...dict, locale }} />;
}
