import { renderPage } from "../router";
import { tg } from "../telegram-web-app";
import { useLotteryStore } from "../store/lottery";
import { useCredentialsStore } from "../store/credentials";
import { requestContact } from "../utils/promises";

function nowTs() {
  const sp = new URLSearchParams(location.search);
  const n = sp.get("now");
  if (n) {
    const num = Number(n);
    const t = Number.isFinite(num) ? num : Date.parse(n);
    if (!Number.isNaN(t)) return t;
  }
  return Date.now();
}

function parseLocal(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0).getTime();
}

function parseDatetimeAttributes(element: HTMLElement): number | undefined {
  if (!element.dataset.date || !element.dataset.time) return;
  return parseLocal(element.dataset.date, element.dataset.time);
}

function isDatetimePassed(timestamp: number) {
  return nowTs() > timestamp;
}

function isDatePassed(date: string) {
  const ts = parseLocal(date, "23:59");
  return nowTs() > ts;
}

async function sendLotteryData(date?: string, time?: string) {
  if (!date || !time) return;

  const hasCredentialsSet = useCredentialsStore.getState().isSet();
  useLotteryStore.getState().setDatetime({ date, time });

  if (!hasCredentialsSet) {
    try {
      const contact = await requestContact(
        "Подтвердите согласие на обработку персональных данных"
      );
      useCredentialsStore.getState().setCredentials({
        phone_number: contact.phone_number ?? "",
        first_name: contact.first_name ?? "",
        last_name: contact.last_name ?? "",
      });
    } catch (error) {
      console.log(error);
    }
  }

  try {
    const credentialsPayload = useCredentialsStore.getState().credentials;
    useLotteryStore.getState().markAsSent();
    tg.sendData(
      JSON.stringify({
        payload: { date, time, ...credentialsPayload },
        type: "lottery",
      })
    );
  } catch (error) {
    console.log(error);
  }
}

function showTimeslots(event: MouseEvent | TouchEvent) {
  const tileGroupElement = document.querySelector<HTMLDivElement>(
    ".lottery-tile-group--time"
  )!;
  const timeContainers = tileGroupElement.querySelectorAll<HTMLDivElement>(
    ".lottery-input-container"
  );
  const selectedTimeContainer = event.currentTarget as HTMLElement;

  tileGroupElement.classList.remove("hidden");

  for (const timeContainer of Array.from(timeContainers)) {
    timeContainer.dataset.date = selectedTimeContainer.dataset.date;
    const ts = parseDatetimeAttributes(timeContainer);
    const input = timeContainer.querySelector("input");
    if (!ts || !input) continue;
    if (isDatetimePassed(ts)) {
      input.setAttribute("disabled", "disabled");
    } else {
      input.removeAttribute("disabled");
    }
  }
}

export default function LotteryPage() {
  function cleanButtons() {
    tg.BackButton.offClick(navigateBackToCategories).hide();
    registerButton.offClick(onRegisterClick).hide().disable();
  }

  function navigateBackToCategories() {
    cleanButtons();
    renderPage("categories");
  }

  const lotteryState = useLotteryStore.getState();
  const lotteryHasBeenSent = lotteryState.hasBeenSent;
  const storedDate = lotteryState.date;
  const storedTime = lotteryState.time;
  const storedTs =
    storedDate && storedTime ? parseLocal(storedDate, storedTime) : undefined;
  const userSlotPassed = !!storedTs && isDatetimePassed(storedTs);

  const registerButton = tg.MainButton.setParams({
    text: lotteryHasBeenSent ? "Изменить данные" : "Отправить данные",
    color: "#FF9448",
    text_color: "#ffffff",
    is_active: false,
    is_visible: false,
  });

  const onRegisterClick = async () => {
    if (userSlotPassed) return;
    await sendLotteryData(registrationDate, registrationTime);
  };

  tg.SecondaryButton.hide();
  tg.BackButton.onClick(navigateBackToCategories).show();
  registerButton.onClick(onRegisterClick);

  let registrationDate: string | undefined;
  let registrationTime: string | undefined;

  const dateContainers = document.querySelectorAll<HTMLElement>(
    ".lottery-tile-group--date .lottery-input-container"
  );
  const timeContainers = document.querySelectorAll<HTMLElement>(
    ".lottery-tile-group--time .lottery-input-container"
  );

  for (const dateContainer of Array.from(dateContainers)) {
    const date = dateContainer.dataset.date;
    if (date && isDatePassed(date)) {
      dateContainer
        .querySelector("input")
        ?.setAttribute("disabled", "disabled");
    }
    dateContainer.addEventListener("click", showTimeslots);
  }

  for (const timeContainer of Array.from(timeContainers)) {
    timeContainer.addEventListener(
      "click",
      (event: MouseEvent | TouchEvent) => {
        if (userSlotPassed) {
          registerButton.hide().disable();
          return;
        }
        const parent = (event.target as HTMLElement).closest(
          ".lottery-input-container"
        ) as HTMLElement | null;
        const input = parent?.querySelector("input") as HTMLInputElement | null;
        const date = parent?.dataset.date;
        const time = parent?.dataset.time;
        if (!date || !time || !input || input.disabled) {
          registerButton.hide().disable();
          return;
        }
        const ts = parseLocal(date, time);
        if (isDatetimePassed(ts)) {
          registerButton.hide().disable();
          return;
        }
        registrationDate = date;
        registrationTime = time;
        registerButton.enable().show();
      }
    );
  }

  if (userSlotPassed) {
    registerButton.hide().disable();
  } else if (lotteryHasBeenSent && storedDate && storedTime) {
    registrationDate = storedDate;
    registrationTime = storedTime;
    const currentDateContainer = Array.from(dateContainers).find(
      (dc) => dc.dataset.date === registrationDate
    );
    currentDateContainer?.dispatchEvent(new MouseEvent("click"));
    const currentTimeContainer = Array.from(timeContainers).find(
      (tc) => tc.dataset.time === registrationTime
    );
    currentTimeContainer?.dispatchEvent(new MouseEvent("click"));
  }
}
