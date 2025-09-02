import { renderPage } from "../router";
import { tg } from "../telegram-web-app";
import { usePuzzleStore } from "../store/puzzle";
import { useCredentialsStore } from "../store/credentials";
import { useLotteryStore } from "../store/lottery";

function navigateToCategories() {
  tg.MainButton.hide().disable().offClick(navigateToCategories);
  tg.SecondaryButton.hide().disable().offClick(resetAndNavigateToCategories);

  renderPage("categories");
}

function navigateToLottery() {
  tg.MainButton.hide().disable().offClick(navigateToLottery);
  tg.SecondaryButton.hide().disable().offClick(resetAndNavigateToCategories);

  renderPage("lottery");
}

function resetAndNavigateToCategories() {
  usePuzzleStore.getState().clearAll();
  useCredentialsStore.getState().clearAll();
  useLotteryStore.getState().clearAll();
  navigateToCategories();
}

function navigateToMap() {
  renderPage("map");
}

export default async function StartPage() {
  tg.MainButton.setParams({
    text: "Продолжить",
    color: "#9C8CD9",
    text_color: "#ffffff",
    is_active: false,
    is_visible: false,
  });

  tg.SecondaryButton.setParams({
    text: "Начать сначала",
    color: "#F4EDE5",
    text_color: "#000000",
    is_active: false,
    is_visible: false,
    position: "bottom",
  });

  const puzzleHasBeenSent = usePuzzleStore.getState().hasBeenSent;
  const lotteryHasBeenSent = useLotteryStore.getState().hasBeenSent;

  const hasData = usePuzzleStore.getState().completedIds().length;

  if (puzzleHasBeenSent && lotteryHasBeenSent) {
    tg.MainButton.setText("Изменить время розыгрыша")
      .enable()
      .show()
      .onClick(navigateToLottery);
    tg.SecondaryButton.enable().show().onClick(resetAndNavigateToCategories);
  } else if (puzzleHasBeenSent) {
    tg.MainButton.setText("Участвовать в розыгрыше")
      .enable()
      .show()
      .onClick(navigateToLottery);
    tg.SecondaryButton.enable().show().onClick(resetAndNavigateToCategories);
  } else if (hasData) {
    tg.MainButton.enable().show().onClick(navigateToCategories);
    tg.SecondaryButton.enable().show().onClick(resetAndNavigateToCategories);
  } else {
    tg.MainButton.setText("Начать!")
      .enable()
      .show()
      .onClick(navigateToCategories);
  }
  const mapBtn = document.getElementById("open-map-btn");
  if (mapBtn) {
    mapBtn.addEventListener("click", navigateToMap, { once: true });
  }
}
