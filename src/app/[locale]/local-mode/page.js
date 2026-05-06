import LocalModeClient from "./LocalModeClient";
import { getDictionary } from "@/lib/getDictionary";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return {
    title: dict.metadata.localMode,
  };
}

export default async function Page({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <LocalModeClient dict={{ ...dict, locale }} />;
}
