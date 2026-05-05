import LocalModeClient from "./LocalModeClient";
import { getDictionary } from "@/lib/getDictionary";

export const metadata = {
  title: "Modo de juego local",
};

export default async function Page({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <LocalModeClient dict={{ ...dict, locale }} />;
}
