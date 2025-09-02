import { renderPage } from "../router";
import { tg } from "../telegram-web-app";

function handleBack() {
  tg.BackButton.offClick(handleBack);
  tg.BackButton.hide();
  renderPage("start");
}

export default async function MapPage() {
  try {
    tg.MainButton.hide();
    tg.MainButton.disable();
  } catch {}
  tg.SecondaryButton?.hide?.();
  tg.SecondaryButton?.disable?.();
  tg.BackButton.onClick(handleBack);
  tg.BackButton.show();
}
